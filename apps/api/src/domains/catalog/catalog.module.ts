import { Module, Controller, Get, Post, Body, UseGuards, Param, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Permission, Domain } from '@wuchan/contracts';
import { createProductSchema } from '@wuchan/validation';
import { AuditService, AuditModule } from '../../audit/audit.module';
import { DatabaseService } from '../../database/database.service';

@Controller('catalog')
@UseGuards(AuthGuard, PermissionsGuard)
export class CatalogController {
  constructor(
    private auditService: AuditService,
    private db: DatabaseService
  ) {}

  @Get('products')
  @Public()
  async listProducts(@Req() req: any) {
    // Unauthenticated public visitors see public products; authenticated users see public + their tenant products
    const userId = req.user?.userId;
    if (userId) {
      const res = await this.db.query(
        `SELECT id, organization_id, name, sku, description, is_public, base_price_cents, currency, lead_time_days
         FROM public.products
         ORDER BY created_at DESC`,
        [],
        userId
      );
      return res.rows;
    }

    const res = await this.db.queryPublic(
      `SELECT id, organization_id, name, sku, description, is_public, base_price_cents, currency, lead_time_days
       FROM public.products
       WHERE is_public = TRUE
       ORDER BY created_at DESC`
    );
    return res.rows;
  }

  @Get('products/:id')
  @Public()
  async getProduct(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId;
    if (userId) {
      const res = await this.db.query(
        `SELECT id, organization_id, name, sku, description, is_public, base_price_cents, currency, lead_time_days
         FROM public.products WHERE id = $1`,
        [id],
        userId
      );
      return res.rows[0] || null;
    }

    const res = await this.db.queryPublic(
      `SELECT id, organization_id, name, sku, description, is_public, base_price_cents, currency, lead_time_days
       FROM public.products WHERE id = $1 AND is_public = TRUE`,
      [id]
    );
    return res.rows[0] || null;
  }

  @Post('products')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  async createProduct(@Req() req: any, @Body() body: any) {
    const validated = createProductSchema.parse(body);
    const actorId = req.user.userId;

    const activeOrgId = req.user.activeOrgId;
    if (req.user.activeRole !== 'PLATFORM_ADMIN' && activeOrgId !== validated.organizationId) {
      throw new ForbiddenException('Product organization must match the authenticated organization');
    }

    return this.db.withTransaction(async (client) => {
      const res = await client.query(
        `INSERT INTO public.products (organization_id, name, sku, description, is_public, base_price_cents, currency, lead_time_days)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, organization_id, name, sku, description, is_public, base_price_cents, currency, lead_time_days, created_at`,
        [
          validated.organizationId,
          validated.name,
          validated.sku,
          validated.description || null,
          validated.isPublic !== undefined ? validated.isPublic : true,
          validated.basePrice.amountCents,
          validated.basePrice.currency,
          validated.leadTimeDays
        ]
      );
      const prod = res.rows[0];

      await this.auditService.logActionInTransaction({
        domain: Domain.CATALOG,
        action: 'PRODUCT_CREATED',
        actorId,
        organizationId: prod.organization_id,
        resourceId: prod.id,
        afterState: prod
      }, client);

      return prod;
    }, actorId);
  }
}

@Module({
  imports: [AuditModule],
  controllers: [CatalogController]
})
export class CatalogModule {}
