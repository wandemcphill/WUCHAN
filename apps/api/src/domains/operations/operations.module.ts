import { Module, Controller, Get, Post, Body, UseGuards, Req, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission, Domain } from '@wuchan/contracts';
import { moneySchema } from '@wuchan/validation';
import { AuditService, AuditModule } from '../../audit/audit.module';
import { DatabaseService } from '../../database/database.service';

@Controller('payments')
@UseGuards(AuthGuard, PermissionsGuard)
export class PaymentsController {
  constructor(
    private auditService: AuditService,
    private db: DatabaseService
  ) {}

  @Get()
  @RequirePermissions(Permission.PAYMENT_READ)
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const res = await this.db.query('SELECT * FROM public.payments ORDER BY created_at DESC', [], userId);
    return res.rows;
  }

  @Post('process')
  @RequirePermissions(Permission.PAYMENT_PROCESS)
  async processPayment(@Req() req: any, @Body() body: any) {
    const validatedMoney = moneySchema.parse(body.amount);
    const actorId = req.user.userId;
    const activeOrgId = req.user.activeOrgId;

    if (!body.invoiceId) {
      throw new BadRequestException('invoiceId is required');
    }

    return this.db.withTransaction(async (client) => {
      // 1. Fetch invoice and verify tenant access
      const invoiceRes = await client.query(
        'SELECT id, organization_id, amount_cents, currency, status FROM public.invoices WHERE id = $1',
        [body.invoiceId]
      );
      const invoice = invoiceRes.rows[0];

      if (!invoice) {
        throw new NotFoundException(`Invoice ${body.invoiceId} not found`);
      }

      if (activeOrgId && invoice.organization_id !== activeOrgId) {
        throw new ForbiddenException('Invoice belongs to a different organization');
      }

      // 2. Validate currency match
      if (invoice.currency !== validatedMoney.currency) {
        throw new BadRequestException(
          `Currency mismatch: Invoice is in ${invoice.currency}, but payment attempted in ${validatedMoney.currency}`
        );
      }

      // 3. Idempotency check
      if (body.idempotencyKey) {
        const existingPayment = await client.query(
          'SELECT * FROM public.payments WHERE idempotency_key = $1',
          [body.idempotencyKey]
        );
        if (existingPayment.rows.length > 0) {
          return existingPayment.rows[0];
        }
      }

      // 4. Calculate previous payments and outstanding balance
      const paidRes = await client.query(
        "SELECT COALESCE(SUM(amount_cents), 0) AS total_paid FROM public.payments WHERE invoice_id = $1 AND status = 'COMPLETED'",
        [invoice.id]
      );
      const totalPaidCents = parseInt(paidRes.rows[0].total_paid, 10);
      const outstandingCents = invoice.amount_cents - totalPaidCents;

      if (outstandingCents <= 0) {
        throw new BadRequestException('Invoice is already fully paid');
      }

      if (validatedMoney.amountCents > outstandingCents) {
        throw new BadRequestException(
          `Payment amount (${validatedMoney.amountCents} cents) exceeds outstanding invoice balance (${outstandingCents} cents)`
        );
      }

      // 5. Insert payment row with status COMPLETED or PENDING
      const paymentStatus = body.status || 'COMPLETED';
      const paymentRes = await client.query(
        `INSERT INTO public.payments (invoice_id, organization_id, amount_cents, currency, payment_method, idempotency_key, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          invoice.id,
          invoice.organization_id,
          validatedMoney.amountCents,
          validatedMoney.currency,
          body.paymentMethod || 'BANK_TRANSFER',
          body.idempotencyKey || null,
          paymentStatus
        ]
      );
      const payment = paymentRes.rows[0];

      // Update invoice status if fully paid and payment is completed
      if (paymentStatus === 'COMPLETED' && (totalPaidCents + validatedMoney.amountCents >= invoice.amount_cents)) {
        await client.query(
          "UPDATE public.invoices SET status = 'PAID' WHERE id = $1",
          [invoice.id]
        );
      }

      await this.auditService.logAction({
        domain: Domain.PAYMENTS,
        action: 'PAYMENT_PROCESSED',
        actorId,
        organizationId: invoice.organization_id,
        afterState: payment
      });

      return payment;
    }, actorId);
  }
}

@Controller('invoicing')
@UseGuards(AuthGuard, PermissionsGuard)
export class InvoicingController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.INVOICE_READ)
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const res = await this.db.query('SELECT * FROM public.invoices ORDER BY created_at DESC', [], userId);
    return res.rows;
  }
}

@Controller('inventory')
@UseGuards(AuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.INVENTORY_READ)
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const res = await this.db.query('SELECT * FROM public.inventory_items ORDER BY created_at DESC', [], userId);
    return res.rows;
  }
}

@Controller('production')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProductionController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.PRODUCTION_READ)
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const res = await this.db.query('SELECT * FROM public.production_orders ORDER BY created_at DESC', [], userId);
    return res.rows;
  }
}

@Controller('quality')
@UseGuards(AuthGuard, PermissionsGuard)
export class QualityController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.QUALITY_READ)
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const res = await this.db.query('SELECT * FROM public.qc_inspections ORDER BY created_at DESC', [], userId);
    return res.rows;
  }
}

@Controller('shipping')
@UseGuards(AuthGuard, PermissionsGuard)
export class ShippingController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.SHIPPING_READ)
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const res = await this.db.query('SELECT * FROM public.shipments ORDER BY created_at DESC', [], userId);
    return res.rows;
  }
}

@Controller('documents')
@UseGuards(AuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.DOCUMENTS_READ)
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const res = await this.db.query('SELECT * FROM public.documents ORDER BY created_at DESC', [], userId);
    return res.rows;
  }
}

@Controller('messaging')
@UseGuards(AuthGuard, PermissionsGuard)
export class MessagingController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.MESSAGING_READ)
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const res = await this.db.query('SELECT * FROM public.conversations ORDER BY created_at DESC', [], userId);
    return res.rows;
  }
}

@Controller('notifications')
@UseGuards(AuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.NOTIFICATIONS_READ)
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const res = await this.db.query('SELECT * FROM public.notifications ORDER BY created_at DESC', [], userId);
    return res.rows;
  }
}

@Controller('ai')
@UseGuards(AuthGuard, PermissionsGuard)
export class AiController {
  @Get()
  @RequirePermissions(Permission.AI_EXECUTE)
  list() {
    return [{ id: 'ai_task_1', prompt: 'Summarize quote specifications' }];
  }
}

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
  @Get('session')
  getSession(@Req() req: any) {
    return {
      authenticated: true,
      user: req.user
    };
  }
}

@Module({
  imports: [AuditModule],
  controllers: [
    PaymentsController,
    InvoicingController,
    InventoryController,
    ProductionController,
    QualityController,
    ShippingController,
    DocumentsController,
    MessagingController,
    NotificationsController,
    AiController,
    AuthController
  ]
})
export class OperationsModule {}
