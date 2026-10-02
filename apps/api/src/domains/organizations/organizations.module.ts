import { Module, Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission, Domain } from '@wuchan/contracts';
import { createOrganizationSchema } from '@wuchan/validation';
import { AuditService, AuditModule } from '../../audit/audit.module';
import { DatabaseService } from '../../database/database.service';

@Controller('organizations')
@UseGuards(AuthGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(
    private auditService: AuditService,
    private db: DatabaseService
  ) {}

  @Get()
  @RequirePermissions(Permission.ORG_READ)
  async list() {
    const res = await this.db.query(
      'SELECT id, name, slug, type, country_code, created_at FROM public.organizations ORDER BY name ASC'
    );
    return res.rows;
  }

  @Get(':id')
  @RequirePermissions(Permission.ORG_READ)
  async getById(@Param('id') id: string) {
    const res = await this.db.query(
      'SELECT id, name, slug, type, country_code, created_at FROM public.organizations WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  }

  @Post()
  @RequirePermissions(Permission.ORG_MANAGE)
  async create(@Body() body: any) {
    const validated = createOrganizationSchema.parse(body);
    const res = await this.db.query(
      `INSERT INTO public.organizations (name, slug, type, logo_url, country_code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, slug, type, country_code, created_at`,
      [validated.name, validated.slug, validated.type, validated.logoUrl || null, validated.countryCode]
    );
    const org = res.rows[0];

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
  imports: [AuditModule],
  controllers: [OrganizationsController]
})
export class OrganizationsModule {}
