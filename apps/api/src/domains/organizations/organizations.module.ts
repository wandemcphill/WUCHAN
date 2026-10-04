import { Module, Controller, Get, Post, Body, UseGuards, Param, Req } from '@nestjs/common';
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
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const res = await this.db.query(
      'SELECT id, name, slug, type, country_code, created_at FROM public.organizations ORDER BY name ASC',
      [],
      userId
    );
    return res.rows;
  }

  @Get(':id')
  @RequirePermissions(Permission.ORG_READ)
  async getById(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    const res = await this.db.query(
      'SELECT id, name, slug, type, country_code, created_at FROM public.organizations WHERE id = $1',
      [id],
      userId
    );
    return res.rows[0] || null;
  }

  @Post()
  @RequirePermissions(Permission.ORG_MANAGE)
  async create(@Req() req: any, @Body() body: any) {
    const validated = createOrganizationSchema.parse(body);
    const actorId = req.user.userId;

    const res = await this.db.query(
      `INSERT INTO public.organizations (name, slug, type, logo_url, country_code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, slug, type, country_code, created_at`,
      [validated.name, validated.slug, validated.type, validated.logoUrl || null, validated.countryCode],
      actorId
    );
    const org = res.rows[0];

    await this.auditService.logAction({
      domain: Domain.ORGANIZATIONS,
      action: 'ORGANIZATION_CREATED',
      actorId,
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
