import { Module, Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission, Domain } from '@wuchan/contracts';
import { createOrganizationSchema } from '@wuchan/validation';
import { AuditService } from '../../audit/audit.module';

@Controller('organizations')
@UseGuards(AuthGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(private auditService: AuditService) {}

  @Get()
  @RequirePermissions(Permission.ORG_READ)
  list() {
    return [{ id: '11111111-1111-1111-1111-111111111111', name: 'WUCHAN Global', slug: 'wuchan-global' }];
  }

  @Post()
  @RequirePermissions(Permission.ORG_MANAGE)
  async create(@Body() body: any) {
    const validated = createOrganizationSchema.parse(body);
    const org = { id: `org_${Date.now()}`, ...validated };
    await this.auditService.logAction({
      domain: Domain.ORGANIZATIONS,
      action: 'ORGANIZATION_CREATED',
      actorId: '00000000-0000-0000-0000-000000000001',
      organizationId: org.id,
      afterState: org
    });
    return org;
  }
}

@Module({
  controllers: [OrganizationsController]
})
export class OrganizationsModule {}
