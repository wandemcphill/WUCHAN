import { Module, Controller, Get, Post, Body, UseGuards, Param, Patch, Req, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission, Domain, isValidOrderStatusTransition } from '@wuchan/contracts';
import { createRfqSchema, createQuoteVersionSchema, updateOrderStatusSchema } from '@wuchan/validation';
import { AuditService, AuditModule } from '../../audit/audit.module';
import { DatabaseService } from '../../database/database.service';

@Controller('rfq')
@UseGuards(AuthGuard, PermissionsGuard)
export class RfqController {
  constructor(
    private auditService: AuditService,
    private db: DatabaseService
  ) {}

  @Get()
  @RequirePermissions(Permission.RFQ_READ)
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const res = await this.db.query('SELECT * FROM public.rfqs ORDER BY created_at DESC', [], userId);
    return res.rows;
  }

  @Post()
  @RequirePermissions(Permission.RFQ_CREATE)
  async create(@Req() req: any, @Body() body: any) {
    const validated = createRfqSchema.parse(body);
    const actorId = req.user.userId;

    const res = await this.db.query(
      `INSERT INTO public.rfqs (organization_id, title, description, budget_cents, currency, target_delivery_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        validated.organizationId,
        validated.title,
        validated.description,
        validated.budget?.amountCents || null,
        validated.budget?.currency || 'USD',
        validated.targetDeliveryDate || null
      ],
      actorId
    );
    const rfq = res.rows[0];

    await this.auditService.logAction({
      domain: Domain.RFQ,
      action: 'RFQ_CREATED',
      actorId,
      organizationId: rfq.organization_id,
      afterState: rfq
    });

    return rfq;
  }
}

@Controller('quotes')
@UseGuards(AuthGuard, PermissionsGuard)
export class QuotesController {
  constructor(
    private auditService: AuditService,
    private db: DatabaseService
  ) {}

  @Get()
  @RequirePermissions(Permission.QUOTE_READ)
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const res = await this.db.query('SELECT * FROM public.quotes ORDER BY created_at DESC', [], userId);
    return res.rows;
  }

  @Post()
  @RequirePermissions(Permission.QUOTE_CREATE)
  async createVersion(@Req() req: any, @Body() body: any) {
    const validated = createQuoteVersionSchema.parse(body);
    const actorId = req.user.userId;

    return this.db.withTransaction(async (client) => {
      // 1. Resolve or create parent quote record
      const quoteRes = await client.query('SELECT id, current_version, organization_id FROM public.quotes WHERE id = $1', [validated.quoteId]);
      let quote = quoteRes.rows[0];

      if (!quote) {
        const newQuoteRes = await client.query(
          `INSERT INTO public.quotes (id, rfq_id, organization_id, current_version, status)
           VALUES ($1, $1, $2, 1, 'DRAFT')
           RETURNING id, current_version, organization_id`,
          [validated.quoteId, req.user.activeOrgId || '11111111-1111-1111-1111-111111111111']
        );
        quote = newQuoteRes.rows[0];
      } else {
        await client.query(
          'UPDATE public.quotes SET current_version = current_version + 1, updated_at = NOW() WHERE id = $1',
          [quote.id]
        );
      }

      // 2. Insert quote version
      const nextVersion = (quote.current_version || 0) + 1;
      const res = await client.query(
        `INSERT INTO public.quote_versions (quote_id, version, subtotal_cents, tax_cents, shipping_cents, total_cents, currency, valid_until, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          quote.id,
          nextVersion,
          validated.subtotal.amountCents,
          validated.tax.amountCents,
          validated.shipping.amountCents,
          validated.total.amountCents,
          validated.total.currency,
          validated.validUntil,
          validated.notes || null
        ]
      );
      const quoteVersion = res.rows[0];

      await this.auditService.logAction({
        domain: Domain.QUOTES,
        action: 'QUOTE_VERSION_CREATED',
        actorId,
        organizationId: quote.organization_id,
        afterState: quoteVersion
      });

      return quoteVersion;
    }, actorId);
  }

  @Post(':id/approve')
  @RequirePermissions(Permission.QUOTE_APPROVE)
  async approve(@Req() req: any, @Param('id') id: string) {
    const actorId = req.user.userId;

    const res = await this.db.query(
      `UPDATE public.quotes SET status = 'APPROVED', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id],
      actorId
    );
    const approved = res.rows[0] || { id, status: 'APPROVED' };

    await this.auditService.logAction({
      domain: Domain.QUOTES,
      action: 'QUOTE_APPROVED',
      actorId,
      resourceId: id,
      afterState: approved
    });

    return approved;
  }
}

@Controller('orders')
@UseGuards(AuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(
    private auditService: AuditService,
    private db: DatabaseService
  ) {}

  @Get()
  @RequirePermissions(Permission.ORDER_READ)
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const res = await this.db.query('SELECT * FROM public.orders ORDER BY created_at DESC', [], userId);
    return res.rows;
  }

  @Patch('status')
  @RequirePermissions(Permission.ORDER_STATE_UPDATE)
  async updateStatus(@Req() req: any, @Body() body: any) {
    const validated = updateOrderStatusSchema.parse(body);
    const actorId = req.user.userId;

    const currentOrderRes = await this.db.query('SELECT id, status FROM public.orders WHERE id = $1', [validated.orderId], actorId);
    const currentOrder = currentOrderRes.rows[0];

    if (currentOrder) {
      if (!isValidOrderStatusTransition(currentOrder.status, validated.status)) {
        throw new BadRequestException(`Invalid order state transition from ${currentOrder.status} to ${validated.status}`);
      }
    }

    const res = await this.db.query(
      `UPDATE public.orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [validated.status, validated.orderId],
      actorId
    );

    await this.auditService.logAction({
      domain: Domain.ORDERS,
      action: 'ORDER_STATUS_UPDATED',
      actorId,
      resourceId: validated.orderId,
      afterState: res.rows[0] || validated
    });

    return res.rows[0] || validated;
  }
}

@Module({
  imports: [AuditModule],
  controllers: [RfqController, QuotesController, OrdersController]
})
export class CommercialModule {}
