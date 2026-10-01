import { Module, Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission, Domain } from '@wuchan/contracts';
import { moneySchema } from '@wuchan/validation';
import { AuditService } from '../../audit/audit.module';

@Controller('payments')
@UseGuards(AuthGuard, PermissionsGuard)
export class PaymentsController {
  constructor(private auditService: AuditService) {}

  @Get()
  @RequirePermissions(Permission.PAYMENT_READ)
  list() {
    return [{ id: 'pay_1', amountCents: 500000, currency: 'USD', status: 'COMPLETED' }];
  }

  @Post('process')
  @RequirePermissions(Permission.PAYMENT_PROCESS)
  async processPayment(@Body() body: any) {
    const validatedMoney = moneySchema.parse(body.amount);
    const payment = {
      id: `pay_${Date.now()}`,
      amountCents: validatedMoney.amountCents,
      currency: validatedMoney.currency,
      status: 'PROCESSED'
    };
    await this.auditService.logAction({
      domain: Domain.PAYMENTS,
      action: 'PAYMENT_PROCESSED',
      actorId: '00000000-0000-0000-0000-000000000001',
      afterState: payment
    });
    return payment;
  }
}

@Controller('invoicing')
@UseGuards(AuthGuard, PermissionsGuard)
export class InvoicingController {
  @Get()
  @RequirePermissions(Permission.INVOICE_READ)
  list() {
    return [{ id: 'inv_1', amountCents: 500000, currency: 'USD' }];
  }
}

@Controller('inventory')
@UseGuards(AuthGuard, PermissionsGuard)
export class InventoryController {
  @Get()
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  list() {
    return [{ id: 'inv_item_1', sku: 'STEEL-FRAME-01', qty: 100 }];
  }
}

@Controller('production')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProductionController {
  @Get()
  @RequirePermissions(Permission.PRODUCTION_MANAGE)
  list() {
    return [{ id: 'prod_job_1', status: 'IN_PROGRESS' }];
  }
}

@Controller('quality')
@UseGuards(AuthGuard, PermissionsGuard)
export class QualityController {
  @Get()
  @RequirePermissions(Permission.QUALITY_INSPECT)
  list() {
    return [{ id: 'qc_1', result: 'PASSED' }];
  }
}

@Controller('shipping')
@UseGuards(AuthGuard, PermissionsGuard)
export class ShippingController {
  @Get()
  @RequirePermissions(Permission.SHIPPING_MANAGE)
  list() {
    return [{ id: 'ship_1', containerNo: 'CNTR-88219' }];
  }
}

@Controller('documents')
@UseGuards(AuthGuard, PermissionsGuard)
export class DocumentsController {
  @Get()
  @RequirePermissions(Permission.DOCUMENTS_MANAGE)
  list() {
    return [{ id: 'doc_1', title: 'Commercial Invoice' }];
  }
}

@Controller('messaging')
@UseGuards(AuthGuard, PermissionsGuard)
export class MessagingController {
  @Get()
  @RequirePermissions(Permission.MESSAGING_SEND)
  list() {
    return [{ id: 'msg_1', content: 'Design drawing updated.' }];
  }
}

@Controller('notifications')
@UseGuards(AuthGuard, PermissionsGuard)
export class NotificationsController {
  @Get()
  @RequirePermissions(Permission.NOTIFICATIONS_READ)
  list() {
    return [{ id: 'notif_1', title: 'New RFQ received' }];
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
export class AuthController {
  @Get('session')
  getSession() {
    return { authenticated: true, user: { email: 'dev@wuchan.com' } };
  }
}

@Module({
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
