import { Module, Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
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
  @RequirePermissions(Permission.CATALOG_READ)
  async listProducts() {
    const res = await this.db.query(
      `SELECT id, organization_id, name, sku, description, is_public, base_price_cents, currency, lead_time_days
       FROM public.products
       ORDER BY created_at DESC`
    );
    return res.rows;
  }

  @Get('products/:id')
  @RequirePermissions(Permission.CATALOG_READ)
  async getProduct(@Param('id') id: string) {
    const res = await this.db.query(
      `SELECT id, organization_id, name, sku, description, is_public, base_price_cents, currency, lead_time_days
       FROM public.products WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  @Post('products')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  async createProduct(@Body() body: any) {
    const validated = createProductSchema.parse(body);
    const res = await this.db.query(
      `INSERT INTO public.products (organization_id, name, sku, description, base_price_cents, currency, lead_time_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, organization_id, name, sku, description, base_price_cents, currency, lead_time_days, created_at`,
      [
        validated.organizationId,
        validated.name,
        validated.sku,
        validated.description || null,
        validated.basePrice.amountCents,
        validated.basePrice.currency,
        validated.leadTimeDays
      ]
    );
    const prod = res.rows[0];

    await this.auditService.logAction({
      domain: Domain.CATALOG,
      action: 'PRODUCT_CREATED',
      actorId: '00000000-0000-0000-0000-000000000001',
      organizationId: prod.organization_id,
      afterState: prod
    });

    return prod;
  }
}

@Module({
  imports: [AuditModule],
  controllers: [CatalogController]
})
export class CatalogModule {}
