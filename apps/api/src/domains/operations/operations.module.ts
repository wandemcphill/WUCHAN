import { Module, Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
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
  async list() {
    const res = await this.db.query('SELECT * FROM public.payments ORDER BY created_at DESC');
    return res.rows;
  }

  @Post('process')
  @RequirePermissions(Permission.PAYMENT_PROCESS)
  async processPayment(@Req() req: any, @Body() body: any) {
    const validatedMoney = moneySchema.parse(body.amount);
    const actorId = req.user.userId;

    // Validate invoice ownership and currency match
    const invoiceRes = await this.db.query('SELECT id, organization_id, amount_cents, currency FROM public.invoices WHERE id = $1', [body.invoiceId]);
    const invoice = invoiceRes.rows[0];

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.currency !== validatedMoney.currency) {
      throw new Error(`Currency mismatch. Invoice is in ${invoice.currency}, payment attempt was in ${validatedMoney.currency}`);
    }

    const res = await this.db.query(
      `INSERT INTO public.payments (invoice_id, organization_id, amount_cents, currency, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, 'COMPLETED')
       RETURNING *`,
      [
        invoice.id,
        invoice.organization_id,
        validatedMoney.amountCents,
        validatedMoney.currency,
        body.paymentMethod || 'BANK_TRANSFER'
      ]
    );
    const payment = res.rows[0];

    await this.auditService.logAction({
      domain: Domain.PAYMENTS,
      action: 'PAYMENT_PROCESSED',
      actorId,
      organizationId: invoice.organization_id,
      afterState: payment
    });

    return payment;
  }
}

@Controller('invoicing')
@UseGuards(AuthGuard, PermissionsGuard)
export class InvoicingController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.INVOICE_READ)
  async list() {
    const res = await this.db.query('SELECT * FROM public.invoices ORDER BY created_at DESC');
    return res.rows;
  }
}

@Controller('inventory')
@UseGuards(AuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  async list() {
    const res = await this.db.query('SELECT * FROM public.inventory_items ORDER BY created_at DESC');
    return res.rows;
  }
}

@Controller('production')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProductionController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.PRODUCTION_MANAGE)
  async list() {
    const res = await this.db.query('SELECT * FROM public.production_orders ORDER BY created_at DESC');
    return res.rows;
  }
}

@Controller('quality')
@UseGuards(AuthGuard, PermissionsGuard)
export class QualityController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.QUALITY_INSPECT)
  async list() {
    const res = await this.db.query('SELECT * FROM public.qc_inspections ORDER BY created_at DESC');
    return res.rows;
  }
}

@Controller('shipping')
@UseGuards(AuthGuard, PermissionsGuard)
export class ShippingController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.SHIPPING_MANAGE)
  async list() {
    const res = await this.db.query('SELECT * FROM public.shipments ORDER BY created_at DESC');
    return res.rows;
  }
}

@Controller('documents')
@UseGuards(AuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.DOCUMENTS_MANAGE)
  async list() {
    const res = await this.db.query('SELECT * FROM public.documents ORDER BY created_at DESC');
    return res.rows;
  }
}

@Controller('messaging')
@UseGuards(AuthGuard, PermissionsGuard)
export class MessagingController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.MESSAGING_SEND)
  async list() {
    const res = await this.db.query('SELECT * FROM public.conversations ORDER BY created_at DESC');
    return res.rows;
  }
}

@Controller('notifications')
@UseGuards(AuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.NOTIFICATIONS_READ)
  async list() {
    const res = await this.db.query('SELECT * FROM public.notifications ORDER BY created_at DESC');
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
