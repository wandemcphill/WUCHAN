import { Module, Injectable, Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Domain, Permission } from '@wuchan/contracts';
import { auditEventSchema } from '@wuchan/validation';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class OutboxService {
  constructor(private db: DatabaseService) {}

  async publishEvent(domain: Domain, action: string, actorId: string, payload: Record<string, any>) {
    const event = {
      domain,
      action,
      actorId,
      payload
    };
    await this.db.insertOutboxEvent(event);
    return event;
  }
}

@Injectable()
export class AuditService {
  constructor(
    private outboxService: OutboxService,
    private db: DatabaseService
  ) {}

  async logAction(params: {
    domain: Domain;
    action: string;
    actorId: string;
    organizationId?: string;
    resourceId?: string;
    beforeState?: Record<string, any>;
    afterState?: Record<string, any>;
  }) {
    const validated = auditEventSchema.parse({
      domain: params.domain,
      action: params.action,
      actorId: params.actorId,
      organizationId: params.organizationId,
      resourceId: params.resourceId,
      beforeState: params.beforeState,
      afterState: params.afterState
    });

    // Write audit log and outbox event atomically in a single SQL transaction
    await this.db.withTransaction(async (client) => {
      await this.db.insertAuditLog({
        domain: validated.domain,
        action: validated.action,
        actorId: validated.actorId,
        organizationId: validated.organizationId,
        resourceId: validated.resourceId,
        beforeState: validated.beforeState,
        afterState: validated.afterState
      }, client);

      await this.db.insertOutboxEvent({
        domain: validated.domain,
        action: validated.action,
        actorId: validated.actorId,
        payload: validated
      }, client);
    }, validated.actorId);

    return validated;
  }
}

@Controller('audit')
@UseGuards(AuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private db: DatabaseService) {}

  @Get()
  @RequirePermissions(Permission.AUDIT_READ)
  async getAuditLogs() {
    const res = await this.db.query('SELECT * FROM public.audit_logs ORDER BY created_at DESC');
    return res.rows;
  }
}

@Module({
  controllers: [AuditController],
  providers: [DatabaseService, AuditService, OutboxService],
  exports: [DatabaseService, AuditService, OutboxService]
})
export class AuditModule {}
