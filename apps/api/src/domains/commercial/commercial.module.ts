import { Module, Controller, Get, Post, Body, UseGuards, Param, Patch } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission, Domain } from '@wuchan/contracts';
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
  async list() {
    const res = await this.db.query('SELECT * FROM public.rfqs ORDER BY created_at DESC');
    return res.rows;
  }

  @Post()
  @RequirePermissions(Permission.RFQ_CREATE)
  async create(@Body() body: any) {
    const validated = createRfqSchema.parse(body);
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
      ]
    );
    const rfq = res.rows[0];

    await this.auditService.logAction({
      domain: Domain.RFQ,
      action: 'RFQ_CREATED',
      actorId: '00000000-0000-0000-0000-000000000001',
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
  async list() {
    const res = await this.db.query('SELECT * FROM public.quotes ORDER BY created_at DESC');
    return res.rows;
  }

  @Post()
  @RequirePermissions(Permission.QUOTE_CREATE)
  async createVersion(@Body() body: any) {
    const validated = createQuoteVersionSchema.parse(body);
    const res = await this.db.query(
      `INSERT INTO public.quote_versions (quote_id, version, subtotal_cents, tax_cents, shipping_cents, total_cents, currency, valid_until, notes)
       VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        validated.rfqId,
        validated.subtotal.amountCents,
        validated.tax.amountCents,
        validated.shipping.amountCents,
        validated.total.amountCents,
        validated.total.currency,
        validated.validUntil,
        validated.notes || null
      ]
    );
    const quote = res.rows[0];

    await this.auditService.logAction({
      domain: Domain.QUOTES,
      action: 'QUOTE_VERSION_CREATED',
      actorId: '00000000-0000-0000-0000-000000000001',
      afterState: quote
    });

    return quote;
  }

  @Post(':id/approve')
  @RequirePermissions(Permission.QUOTE_APPROVE)
  async approve(@Param('id') id: string) {
    const res = await this.db.query(
      `UPDATE public.quotes SET status = 'APPROVED', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    const approved = res.rows[0] || { id, status: 'APPROVED' };

    await this.auditService.logAction({
      domain: Domain.QUOTES,
      action: 'QUOTE_APPROVED',
      actorId: '00000000-0000-0000-0000-000000000001',
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
  async list() {
    const res = await this.db.query('SELECT * FROM public.orders ORDER BY created_at DESC');
    return res.rows;
  }

  @Patch('status')
  @RequirePermissions(Permission.ORDER_STATE_UPDATE)
  async updateStatus(@Body() body: any) {
    const validated = updateOrderStatusSchema.parse(body);
    const res = await this.db.query(
      `UPDATE public.orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [validated.status, validated.orderId]
    );

    await this.auditService.logAction({
      domain: Domain.ORDERS,
      action: 'ORDER_STATUS_UPDATED',
      actorId: '00000000-0000-0000-0000-000000000001',
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
