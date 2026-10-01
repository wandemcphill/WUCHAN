import { Module, Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission, Domain } from '@wuchan/contracts';
import { createProductSchema } from '@wuchan/validation';
import { AuditService } from '../../audit/audit.module';

@Controller('catalog')
@UseGuards(AuthGuard, PermissionsGuard)
export class CatalogController {
  constructor(private auditService: AuditService) {}

  @Get('products')
  @RequirePermissions(Permission.CATALOG_READ)
  listProducts() {
    return [{ id: 'prod_1', name: 'Prefab Cabin Alpha', sku: 'CABIN-001' }];
  }

  @Post('products')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  async createProduct(@Body() body: any) {
    const validated = createProductSchema.parse(body);
    const prod = { id: `prod_${Date.now()}`, ...validated };
    await this.auditService.logAction({
      domain: Domain.CATALOG,
      action: 'PRODUCT_CREATED',
      actorId: '00000000-0000-0000-0000-000000000001',
      organizationId: prod.organizationId,
      afterState: prod
    });
    return prod;
  }
}

@Module({
  controllers: [CatalogController]
})
export class CatalogModule {}
