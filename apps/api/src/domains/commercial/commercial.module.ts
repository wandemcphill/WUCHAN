import { Module, Controller, Get, Post, Body, UseGuards, Param, Patch } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission, Domain, OrderStatus } from '@wuchan/contracts';
import { createRfqSchema, createQuoteVersionSchema, updateOrderStatusSchema } from '@wuchan/validation';
import { AuditService } from '../../audit/audit.module';

@Controller('rfq')
@UseGuards(AuthGuard, PermissionsGuard)
export class RfqController {
  constructor(private auditService: AuditService) {}

  @Get()
  @RequirePermissions(Permission.RFQ_READ)
  list() {
    return [{ id: 'rfq_1', title: 'Modular Office Complex RFQ' }];
  }

  @Post()
  @RequirePermissions(Permission.RFQ_CREATE)
  async create(@Body() body: any) {
    const validated = createRfqSchema.parse(body);
    const rfq = { id: `rfq_${Date.now()}`, ...validated };
    await this.auditService.logAction({
      domain: Domain.RFQ,
      action: 'RFQ_CREATED',
      actorId: '00000000-0000-0000-0000-000000000001',
      organizationId: rfq.organizationId,
      afterState: rfq
    });
    return rfq;
  }
}

@Controller('quotes')
@UseGuards(AuthGuard, PermissionsGuard)
export class QuotesController {
  constructor(private auditService: AuditService) {}

  @Get()
  @RequirePermissions(Permission.QUOTE_READ)
  list() {
    return [{ id: 'quote_1', rfqId: 'rfq_1', version: 1 }];
  }

  @Post()
  @RequirePermissions(Permission.QUOTE_CREATE)
  async createVersion(@Body() body: any) {
    const validated = createQuoteVersionSchema.parse(body);
    const quote = { id: `quote_${Date.now()}`, version: 1, ...validated };
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
    const approved = { id, status: 'APPROVED', approvedAt: new Date().toISOString() };
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
  constructor(private auditService: AuditService) {}

  @Get()
  @RequirePermissions(Permission.ORDER_READ)
  list() {
    return [{ id: 'ord_1', status: OrderStatus.CONFIRMED }];
  }

  @Patch('status')
  @RequirePermissions(Permission.ORDER_STATE_UPDATE)
  async updateStatus(@Body() body: any) {
    const validated = updateOrderStatusSchema.parse(body);
    await this.auditService.logAction({
      domain: Domain.ORDERS,
      action: 'ORDER_STATUS_UPDATED',
      actorId: '00000000-0000-0000-0000-000000000001',
      resourceId: validated.orderId,
      afterState: validated
    });
    return validated;
  }
}

@Module({
  controllers: [RfqController, QuotesController, OrdersController]
})
export class CommercialModule {}
