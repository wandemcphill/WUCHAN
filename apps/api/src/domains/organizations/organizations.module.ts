import { Module, Controller, Get, Post, Body, UseGuards, Param, Req, ConflictException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission, Domain, OrgType } from '@wuchan/contracts';
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
    const res = await this.db.query(
      'SELECT id, name, slug, type, country_code, created_at FROM public.organizations ORDER BY name ASC',
      [],
      req.user.userId
    );
    return res.rows;
  }

  @Get(':id')
  @RequirePermissions(Permission.ORG_READ)
  async getById(@Req() req: any, @Param('id') id: string) {
    const res = await this.db.query(
      'SELECT id, name, slug, type, country_code, created_at FROM public.organizations WHERE id = $1',
      [id],
      req.user.userId
    );
    return res.rows[0] || null;
  }

  @Post('bootstrap')
  async bootstrap(@Req() req: any, @Body() body: any) {
    const validated = createOrganizationSchema.parse(body);
    if (validated.type !== OrgType.CUSTOMER) {
      throw new BadRequestException('Self-service organization bootstrap is limited to CUSTOMER organizations');
    }

    const actorId = req.user.userId;
    const email = req.user.email;

    return this.db.withTransaction(async (client) => {
      // Serialize bootstrap attempts for the same authenticated profile.
      await client.query(
        `INSERT INTO public.profiles (id, email, full_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (id)
         DO UPDATE SET email = EXCLUDED.email, updated_at = NOW()`,
        [actorId, email, null]
      );
      await client.query(
        'SELECT id FROM public.profiles WHERE id = $1 FOR UPDATE',
        [actorId]
      );

      const membershipRes = await client.query(
        'SELECT organization_id FROM public.organization_members WHERE user_id = $1',
        [actorId]
      );
      if (membershipRes.rows.length > 0) {
        throw new ConflictException('This user already belongs to an organization');
      }

      const orgRes = await client.query(
        `INSERT INTO public.organizations (name, slug, type, logo_url, country_code)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, slug, type, country_code, created_at`,
        [validated.name, validated.slug, validated.type, validated.logoUrl || null, validated.countryCode]
      );
      const org = orgRes.rows[0];

      await client.query(
        `INSERT INTO public.organization_members (organization_id, user_id, role)
         VALUES ($1, $2, 'ORG_OWNER')`,
        [org.id, actorId]
      );

      await this.auditService.logActionInTransaction({
        domain: Domain.ORGANIZATIONS,
        action: 'ORGANIZATION_BOOTSTRAPPED',
        actorId,
        organizationId: org.id,
        resourceId: org.id,
        afterState: org
      }, client);

      return org;
    }, actorId);
  }

  @Post()
  @RequirePermissions(Permission.ORG_MANAGE)
  async create(@Req() req: any, @Body() body: any) {
    const validated = createOrganizationSchema.parse(body);
    const actorId = req.user.userId;

    return this.db.withTransaction(async (client) => {
      const res = await client.query(
        `INSERT INTO public.organizations (name, slug, type, logo_url, country_code)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, slug, type, country_code, created_at`,
        [validated.name, validated.slug, validated.type, validated.logoUrl || null, validated.countryCode]
      );
      const org = res.rows[0];

      // The creator becomes the initial owner, preventing an orphaned tenant.
      await client.query(
        `INSERT INTO public.organization_members (organization_id, user_id, role)
         VALUES ($1, $2, 'ORG_OWNER')
         ON CONFLICT (organization_id, user_id) DO NOTHING`,
        [org.id, actorId]
      );

      await this.auditService.logActionInTransaction({
        domain: Domain.ORGANIZATIONS,
        action: 'ORGANIZATION_CREATED',
        actorId,
        organizationId: org.id,
        resourceId: org.id,
        afterState: org
      }, client);

      return org;
    }, actorId);
  }
}

@Module({
  imports: [AuditModule],
  controllers: [OrganizationsController]
})
export class OrganizationsModule {}
