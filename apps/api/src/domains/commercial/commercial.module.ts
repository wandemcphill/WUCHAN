import {
  Module, Controller, Get, Post, Body, UseGuards, Param, Patch, Req,
  BadRequestException, NotFoundException, ForbiddenException, ConflictException
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission, Domain, isValidOrderStatusTransition } from '@wuchan/contracts';
import {
  createRfqSchema,
  createQuoteVersionSchema,
  createQuoteFromRfqSchema,
  assignRfqSupplierSchema,
  updateOrderStatusSchema
} from '@wuchan/validation';
import { randomUUID } from 'crypto';
import { AuditService, AuditModule } from '../../audit/audit.module';
import { DatabaseService } from '../../database/database.service';

@Controller('rfq')
@UseGuards(AuthGuard, PermissionsGuard)
export class RfqController {
  constructor(
    private auditService: AuditService,
    private db: DatabaseService
  ) {}

  @Get()
  @RequirePermissions(Permission.RFQ_READ)
  async list(@Req() req: any) {
    const res = await this.db.query(
      `SELECT
         r.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id', ri.id,
               'productId', ri.product_id,
               'productSku', p.sku,
               'quantity', ri.quantity,
               'configuration', ri.configuration,
               'notes', ri.notes,
               'targetUnitPriceCents', ri.target_unit_price_cents,
               'currency', ri.currency
             )
             ORDER BY ri.created_at
           ) FILTER (WHERE ri.id IS NOT NULL),
           '[]'::json
         ) AS items
       FROM public.rfqs r
       LEFT JOIN public.rfq_items ri ON ri.rfq_id = r.id
       LEFT JOIN public.products p ON p.id = ri.product_id
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      [],
      req.user.userId
    );
    return res.rows;
  }

  @Post(':id/assign-supplier')
  @RequirePermissions(Permission.RFQ_MANAGE)
  async assignSupplier(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.user.activeRole !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Only WUCHAN platform administrators may assign factories to RFQs');
    }

    const validated = assignRfqSupplierSchema.parse(body);
    const actorId = req.user.userId;

    return this.db.withTransaction(async (client) => {
      const rfqRes = await client.query(
        'SELECT id, organization_id, status FROM public.rfqs WHERE id = $1 FOR UPDATE',
        [id]
      );
      const rfq = rfqRes.rows[0];
      if (!rfq) throw new NotFoundException('RFQ ' + id + ' not found');

      const supplierRes = await client.query(
        'SELECT id, type, name FROM public.organizations WHERE id = $1',
        [validated.supplierOrganizationId]
      );
      const supplier = supplierRes.rows[0];
      if (!supplier) throw new NotFoundException('Supplier organization ' + validated.supplierOrganizationId + ' not found');
      if (supplier.type !== 'FACTORY') {
        throw new BadRequestException('RFQ suppliers must be FACTORY organizations');
      }

      const assignmentRes = await client.query(
        `INSERT INTO public.rfq_supplier_assignments
          (rfq_id, customer_organization_id, supplier_organization_id, assigned_by, status)
         VALUES ($1, $2, $3, $4, 'ACTIVE')
         ON CONFLICT (rfq_id, supplier_organization_id)
         DO UPDATE SET status = 'ACTIVE', assigned_by = EXCLUDED.assigned_by
         RETURNING *`,
        [rfq.id, rfq.organization_id, supplier.id, actorId]
      );

      await this.auditService.logActionInTransaction({
        domain: Domain.RFQ,
        action: 'RFQ_SUPPLIER_ASSIGNED',
        actorId,
        organizationId: rfq.organization_id,
        resourceId: rfq.id,
        afterState: { assignment: assignmentRes.rows[0], supplier }
      }, client);

      return assignmentRes.rows[0];
    }, actorId);
  }

  @Post()
  @RequirePermissions(Permission.RFQ_CREATE)
  async create(@Req() req: any, @Body() body: any) {
    const validated = createRfqSchema.parse(body);
    const actorId = req.user.userId;
    const activeOrgId = req.user.activeOrgId;

    if (req.user.activeRole !== 'PLATFORM_ADMIN' && activeOrgId !== validated.organizationId) {
      throw new ForbiddenException('RFQ organization must match the authenticated organization');
    }

    return this.db.withTransaction(async (client) => {
      if (validated.projectId) {
        const projectRes = await client.query(
          'SELECT id FROM public.projects WHERE id = $1 AND organization_id = $2',
          [validated.projectId, validated.organizationId]
        );
        if (!projectRes.rows[0]) {
          throw new BadRequestException('Project does not belong to the authenticated organization');
        }
      }

      const resolvedItems: Array<{
        productId: string;
        quantity: number;
        configuration: Record<string, any>;
        notes?: string;
        targetUnitPrice?: { amountCents: number; currency: string };
      }> = [];

      for (const item of validated.items) {
        const productRes = await client.query(
          item.productId
            ? 'SELECT id, sku, organization_id, is_public FROM public.products WHERE id = $1'
            : 'SELECT id, sku, organization_id, is_public FROM public.products WHERE sku = $1',
          [item.productId || item.productSku]
        );
        const product = productRes.rows[0];

        if (!product) {
          throw new NotFoundException(
            item.productId
              ? 'Product ' + item.productId + ' not found'
              : 'Product SKU ' + item.productSku + ' not found'
          );
        }

        if (!product.is_public && product.organization_id !== activeOrgId && req.user.activeRole !== 'PLATFORM_ADMIN') {
          throw new ForbiddenException('RFQ may only request public products outside the authenticated organization');
        }

        if (item.targetUnitPrice && validated.budget && item.targetUnitPrice.currency !== validated.budget.currency) {
          throw new BadRequestException('RFQ item target price currency must match the RFQ budget currency');
        }

        resolvedItems.push({
          productId: product.id,
          quantity: item.quantity,
          configuration: item.configuration || {},
          notes: item.notes,
          targetUnitPrice: item.targetUnitPrice,
        });
      }

      const rfqNumber = 'RFQ-' + new Date().getUTCFullYear() + '-' + randomUUID().slice(0, 8).toUpperCase();

      const rfqRes = await client.query(
        \`INSERT INTO public.rfqs
          (rfq_number, organization_id, project_id, title, description, target_delivery_date, budget_cents, currency, status, destination_port, incoterms_requested)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SUBMITTED', $9, $10)
         RETURNING *\`,
        [
          rfqNumber,
          validated.organizationId,
          validated.projectId || null,
          validated.title,
          validated.description,
          validated.targetDeliveryDate || null,
          validated.budget?.amountCents ?? null,
          validated.budget?.currency ?? 'USD',
          validated.destinationPort,
          validated.incotermsRequested
        ]
      );
      const rfq = rfqRes.rows[0];

      for (const item of resolvedItems) {
        await client.query(
          \`INSERT INTO public.rfq_items
            (rfq_id, product_id, quantity, configuration, notes, target_unit_price_cents, currency)
           VALUES ($1, $2, $3, $4, $5, $6, $7)\`,
          [
            rfq.id,
            item.productId,
            item.quantity,
            JSON.stringify(item.configuration),
            item.notes || null,
            item.targetUnitPrice?.amountCents ?? null,
            item.targetUnitPrice?.currency || validated.budget?.currency || 'USD'
          ]
        );
      }

      await this.auditService.logActionInTransaction({
        domain: Domain.RFQ,
        action: 'RFQ_CREATED',
        actorId,
        organizationId: rfq.organization_id,
        resourceId: rfq.id,
        afterState: {
          ...rfq,
          items: resolvedItems
        }
      }, client);

      return {
        ...rfq,
        items: resolvedItems
      };
    }, actorId);
  }
}

@Controller('quotes')
@UseGuards(AuthGuard, PermissionsGuard)
export class QuotesController {
  constructor(
    private auditService: AuditService,
    private db: DatabaseService
  ) {}

  @Get()
  @RequirePermissions(Permission.QUOTE_READ)
  async list(@Req() req: any) {
    const res = await this.db.query(
      'SELECT * FROM public.quotes ORDER BY created_at DESC',
      [],
      req.user.userId
    );
    return res.rows;
  }

  @Post('from-rfq')
  @RequirePermissions(Permission.QUOTE_CREATE)
  async createFromRfq(@Req() req: any, @Body() body: any) {
    const validated = createQuoteFromRfqSchema.parse(body);
    const actorId = req.user.userId;
    const sellerOrgId = req.user.activeOrgId;

    if (!sellerOrgId || !['PLATFORM_ADMIN', 'ORG_OWNER', 'ORG_ADMIN', 'FACTORY_MANAGER'].includes(req.user.activeRole)) {
      throw new ForbiddenException('A factory organization user is required to issue a quote');
    }

    return this.db.withTransaction(async (client) => {
      const existingRes = await client.query(
        'SELECT id, quote_number FROM public.quotes WHERE rfq_id = $1 AND seller_organization_id = $2 FOR UPDATE',
        [validated.rfqId, sellerOrgId]
      );
      if (existingRes.rows[0]) {
        throw new ConflictException('This factory has already issued a quote for the RFQ');
      }

      const rfqRes = await client.query(
        \`SELECT
           r.id,
           r.organization_id AS customer_organization_id
         FROM public.rfqs r
         JOIN public.rfq_supplier_assignments rsa ON rsa.rfq_id = r.id
         JOIN public.organizations supplier ON supplier.id = rsa.supplier_organization_id
         WHERE r.id = $1
           AND rsa.supplier_organization_id = $2
           AND rsa.status = 'ACTIVE'
           AND supplier.type = 'FACTORY'
         FOR UPDATE OF r\`,
        [validated.rfqId, sellerOrgId]
      );
      const rfq = rfqRes.rows[0];
      if (!rfq) throw new ForbiddenException('RFQ is not assigned to the authenticated factory');

      const customerOrgId = rfq.customer_organization_id;
      const quoteNumber = 'QTE-' + new Date().getUTCFullYear() + '-' + randomUUID().slice(0, 8).toUpperCase();

      const quoteRes = await client.query(
        \`INSERT INTO public.quotes
          (quote_number, rfq_id, organization_id, seller_organization_id, current_version, status)
         VALUES ($1, $2, $3, $4, 1, 'ISSUED')
         RETURNING *\`,
        [quoteNumber, rfq.id, customerOrgId, sellerOrgId]
      );
      const quote = quoteRes.rows[0];

      const versionRes = await client.query(
        \`INSERT INTO public.quote_versions
          (quote_id, version, subtotal_cents, tax_cents, shipping_cents, total_cents, currency, valid_until, notes)
         VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *\`,
        [
          quote.id,
          validated.subtotal.amountCents,
          validated.tax.amountCents,
          validated.shipping.amountCents,
          validated.total.amountCents,
          validated.total.currency,
          validated.validUntil,
          validated.notes ?? null
        ]
      );

      await client.query(
        'UPDATE public.rfqs SET status = \\'QUOTED\\', updated_at = NOW() WHERE id = $1',
        [rfq.id]
      );

      await this.auditService.logActionInTransaction({
        domain: Domain.QUOTES,
        action: 'QUOTE_ISSUED',
        actorId,
        organizationId: customerOrgId,
        resourceId: quote.id,
        afterState: {
          quote,
          version: versionRes.rows[0],
          sellerOrganizationId: sellerOrgId
        }
      }, client);

      return { ...quote, currentVersion: versionRes.rows[0] };
    }, actorId);
  }

  @Post()
  @RequirePermissions(Permission.QUOTE_CREATE)
  async createVersion(@Req() req: any, @Body() body: any) {
    const validated = createQuoteVersionSchema.parse(body);
    const actorId = req.user.userId;

    return this.db.withTransaction(async (client) => {
      const quoteRes = await client.query(
        `SELECT id, current_version, organization_id, seller_organization_id, rfq_id, status
         FROM public.quotes
         WHERE id = $1
         FOR UPDATE`,
        [validated.quoteId]
      );
      const quote = quoteRes.rows[0];

      if (!quote) {
        throw new NotFoundException(`Quote ${validated.quoteId} not found`);
      }

      if (
        req.user.activeRole !== 'PLATFORM_ADMIN' &&
        quote.organization_id !== req.user.activeOrgId &&
        quote.seller_organization_id !== req.user.activeOrgId
      ) {
        throw new ForbiddenException('Quote belongs to a different organization');
      }

      const latestRes = await client.query(
        'SELECT COALESCE(MAX(version), 0) AS version FROM public.quote_versions WHERE quote_id = $1',
        [quote.id]
      );
      const nextVersion = Number(latestRes.rows[0].version) + 1;

      const versionRes = await client.query(
        `INSERT INTO public.quote_versions
          (quote_id, version, subtotal_cents, tax_cents, shipping_cents, total_cents, currency, valid_until, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          quote.id,
          nextVersion,
          validated.subtotal.amountCents,
          validated.tax.amountCents,
          validated.shipping.amountCents,
          validated.total.amountCents,
          validated.total.currency,
          validated.validUntil,
          validated.notes ?? null
        ]
      );
      const quoteVersion = versionRes.rows[0];

      await client.query(
        'UPDATE public.quotes SET current_version = $1, updated_at = NOW(), status = $2 WHERE id = $3',
        [nextVersion, nextVersion === 1 ? 'ISSUED' : 'REVISED', quote.id]
      );

      await this.auditService.logActionInTransaction({
        domain: Domain.QUOTES,
        action: 'QUOTE_VERSION_CREATED',
        actorId,
        organizationId: quote.organization_id,
        resourceId: quote.id,
        afterState: quoteVersion
      }, client);

      return quoteVersion;
    }, actorId);
  }

  @Post(':id/approve')
  @RequirePermissions(Permission.QUOTE_APPROVE)
  async approve(@Req() req: any, @Param('id') id: string) {
    const actorId = req.user.userId;

    return this.db.withTransaction(async (client) => {
      const quoteRes = await client.query(
        `SELECT q.id, q.organization_id, q.status, q.current_version,
                qv.valid_until
         FROM public.quotes q
         LEFT JOIN public.quote_versions qv
           ON qv.quote_id = q.id AND qv.version = q.current_version
         WHERE q.id = $1
         FOR UPDATE`,
        [id]
      );
      const quote = quoteRes.rows[0];

      if (!quote) {
        throw new NotFoundException(`Quote ${id} not found`);
      }
      if (req.user.activeOrgId && quote.organization_id !== req.user.activeOrgId && req.user.activeRole !== 'PLATFORM_ADMIN') {
        throw new ForbiddenException('Quote belongs to a different organization');
      }
      if (!quote.valid_until || new Date(quote.valid_until).getTime() < Date.now()) {
        throw new BadRequestException('Quote has expired');
      }
      if (['ACCEPTED', 'DECLINED', 'EXPIRED', 'SUPERSEDED'].includes(quote.status)) {
        throw new BadRequestException(`Quote cannot be accepted from status ${quote.status}`);
      }

      const res = await client.query(
        `UPDATE public.quotes
         SET status = 'ACCEPTED', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      const approved = res.rows[0];

      await this.auditService.logActionInTransaction({
        domain: Domain.QUOTES,
        action: 'QUOTE_APPROVED',
        actorId,
        organizationId: quote.organization_id,
        resourceId: id,
        beforeState: quote,
        afterState: approved
      }, client);

      return approved;
    }, actorId);
  }
}

@Controller('orders')
@UseGuards(AuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(
    private auditService: AuditService,
    private db: DatabaseService
  ) {}

  @Get()
  @RequirePermissions(Permission.ORDER_READ)
  async list(@Req() req: any) {
    const res = await this.db.query(
      'SELECT * FROM public.orders ORDER BY created_at DESC',
      [],
      req.user.userId
    );
    return res.rows;
  }

  @Patch('status')
  @RequirePermissions(Permission.ORDER_STATE_UPDATE)
  async updateStatus(@Req() req: any, @Body() body: any) {
    const validated = updateOrderStatusSchema.parse(body);
    const actorId = req.user.userId;

    return this.db.withTransaction(async (client) => {
      const currentOrderRes = await client.query(
        'SELECT * FROM public.orders WHERE id = $1 FOR UPDATE',
        [validated.orderId]
      );
      const currentOrder = currentOrderRes.rows[0];

      if (!currentOrder) {
        throw new NotFoundException(`Order ${validated.orderId} not found`);
      }

      if (req.user.activeOrgId && currentOrder.organization_id !== req.user.activeOrgId && req.user.activeRole !== 'PLATFORM_ADMIN') {
        throw new ForbiddenException('Order belongs to a different organization');
      }

      if (!isValidOrderStatusTransition(currentOrder.status, validated.status)) {
        throw new BadRequestException(
          `Invalid order state transition from ${currentOrder.status} to ${validated.status}`
        );
      }

      const res = await client.query(
        `UPDATE public.orders
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [validated.status, validated.orderId]
      );

      const updated = res.rows[0];

      await this.auditService.logActionInTransaction({
        domain: Domain.ORDERS,
        action: 'ORDER_STATUS_UPDATED',
        actorId,
        organizationId: currentOrder.organization_id,
        resourceId: validated.orderId,
        beforeState: currentOrder,
        afterState: updated
      }, client);

      return updated;
    }, actorId);
  }
}

@Module({
  imports: [AuditModule],
  controllers: [RfqController, QuotesController, OrdersController]
})
export class CommercialModule {}
