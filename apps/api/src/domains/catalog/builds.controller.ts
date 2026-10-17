import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Domain, Permission } from '@wuchan/contracts';
import {
  createProductOptionSchema,
  placeBuildOrderSchema,
  quoteBuildOrderSchema,
} from '@wuchan/validation';
import { AuditService } from '../../audit/audit.module';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { DatabaseService } from '../../database/database.service';
import { priceBuild } from '@wuchan/validation';

function assertUuid(value: string, label: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new BadRequestException('Invalid ' + label);
  }
}

@Controller('catalog')
@UseGuards(AuthGuard, PermissionsGuard)
export class BuildsController {
  constructor(
    private auditService: AuditService,
    private db: DatabaseService
  ) {}

  @Post('products/:id/options')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  async createOption(@Req() req: any, @Param('id') productId: string, @Body() body: any) {
    assertUuid(productId, 'product id');
    const validated = createProductOptionSchema.parse(body);
    const actorId = req.user.userId;

    return this.db.withTransaction(async (client) => {
      const productRes = await client.query(
        'SELECT id, organization_id FROM public.products WHERE id = $1',
        [productId]
      );
      const product = productRes.rows[0];
      if (!product) throw new NotFoundException('Product not found');
      if (req.user.activeRole !== 'PLATFORM_ADMIN' && product.organization_id !== req.user.activeOrgId) {
        throw new ForbiddenException('Options can only be added to your organization products');
      }

      const inserted = await client.query(
        `INSERT INTO public.product_options
          (product_id, name, option_type, price_delta_cents, lead_time_delta_days, requires_quote, sort_order, swatch_hex)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, product_id, name, option_type, price_delta_cents, lead_time_delta_days, requires_quote, sort_order, swatch_hex`,
        [
          productId,
          validated.name,
          validated.optionType,
          validated.priceDeltaCents,
          validated.leadTimeDeltaDays,
          validated.requiresQuote,
          validated.sortOrder,
          validated.swatchHex || null,
        ]
      );

      await this.auditService.logActionInTransaction({
        domain: Domain.CATALOG,
        action: 'PRODUCT_OPTION_CREATED',
        actorId,
        organizationId: product.organization_id,
        resourceId: inserted.rows[0].id,
        afterState: inserted.rows[0],
      }, client);

      return inserted.rows[0];
    }, actorId);
  }

  @Get('builds')
  @RequirePermissions(Permission.RFQ_READ)
  async listBuilds(@Req() req: any) {
    const orgFilter = req.user.activeRole === 'PLATFORM_ADMIN' ? null : req.user.activeOrgId;
    const res = await this.db.query(
      `SELECT b.*, p.name AS product_name, p.sku AS product_sku
       FROM public.build_orders b
       JOIN public.products p ON p.id = b.product_id
       WHERE ($1::uuid IS NULL OR b.customer_organization_id = $1 OR b.seller_organization_id = $1)
       ORDER BY b.created_at DESC`,
      [orgFilter],
      req.user.userId
    );
    return res.rows;
  }

  @Post('products/:id/builds')
  @RequirePermissions(Permission.RFQ_CREATE)
  async placeBuild(@Req() req: any, @Param('id') productId: string, @Body() body: any) {
    assertUuid(productId, 'product id');
    const validated = placeBuildOrderSchema.parse(body);
    const actorId = req.user.userId;
    if (req.user.activeRole !== 'PLATFORM_ADMIN' && validated.organizationId !== req.user.activeOrgId) {
      throw new ForbiddenException('Build organization must match the authenticated organization');
    }

    return this.db.withTransaction(async (client) => {
      const productRes = await client.query(
        `SELECT id, organization_id, name, base_price_cents, currency, lead_time_days, is_public
         FROM public.products WHERE id = $1`,
        [productId]
      );
      const product = productRes.rows[0];
      if (!product) throw new NotFoundException('Product not found');
      if (!product.is_public && product.organization_id !== req.user.activeOrgId && req.user.activeRole !== 'PLATFORM_ADMIN') {
        throw new NotFoundException('Product not found');
      }

      const optionsRes = await client.query(
        `SELECT id, name, option_type, price_delta_cents, lead_time_delta_days, requires_quote, swatch_hex
         FROM public.product_options WHERE product_id = $1`,
        [productId]
      );

      let priced;
      try {
        priced = priceBuild({
          basePriceCents: product.base_price_cents,
          baseLeadTimeDays: product.lead_time_days,
          quantity: validated.quantity,
          options: optionsRes.rows,
          selectedOptionIds: validated.optionIds,
          customNote: validated.customNote,
        });
      } catch (error) {
        throw new BadRequestException(error instanceof Error ? error.message : 'Invalid build');
      }

      const buildNumber = 'BLD-' + new Date().getUTCFullYear() + '-' + randomUUID().slice(0, 8).toUpperCase();
      const status = priced.isSpecial ? 'QUOTE_NEEDED' : 'RECEIVED';
      const inserted = await client.query(
        `INSERT INTO public.build_orders
          (build_number, product_id, customer_organization_id, seller_organization_id, created_by,
           quantity, selected_options, custom_note, is_special, status, currency,
           catalog_price_cents, lead_time_days)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          buildNumber,
          product.id,
          validated.organizationId,
          product.organization_id,
          actorId,
          validated.quantity,
          JSON.stringify(priced.selections),
          (validated.customNote || '').trim() || null,
          priced.isSpecial,
          status,
          product.currency,
          priced.totalPriceCents,
          priced.leadTimeDays,
        ]
      );

      await this.auditService.logActionInTransaction({
        domain: Domain.CATALOG,
        action: priced.isSpecial ? 'BUILD_SPECIAL_REQUESTED' : 'BUILD_ORDER_RECEIVED',
        actorId,
        organizationId: validated.organizationId,
        resourceId: inserted.rows[0].id,
        afterState: {
          buildNumber,
          status,
          catalogPriceCents: priced.totalPriceCents,
          leadTimeDays: priced.leadTimeDays,
          isSpecial: priced.isSpecial,
        },
      }, client);

      return inserted.rows[0];
    }, actorId);
  }

  @Post('builds/:id/quote')
  @RequirePermissions(Permission.QUOTE_CREATE)
  async quoteBuild(@Req() req: any, @Param('id') buildId: string, @Body() body: any) {
    assertUuid(buildId, 'build id');
    const validated = quoteBuildOrderSchema.parse(body);
    const validUntil = new Date(validated.validUntil);
    if (Number.isNaN(validUntil.getTime()) || validUntil.getTime() <= Date.now()) {
      throw new BadRequestException('Quote validity must be in the future');
    }
    const actorId = req.user.userId;

    return this.db.withTransaction(async (client) => {
      const current = await client.query('SELECT * FROM public.build_orders WHERE id = $1 FOR UPDATE', [buildId]);
      const row = current.rows[0];
      if (!row) throw new NotFoundException('Build order not found');
      if (req.user.activeRole !== 'PLATFORM_ADMIN' && row.seller_organization_id !== req.user.activeOrgId) {
        throw new ForbiddenException('Only the selling factory can quote this build');
      }
      if (!row.is_special || row.status !== 'QUOTE_NEEDED') {
        throw new BadRequestException('Only a special build waiting for a quote can be quoted');
      }

      const updated = await client.query(
        `UPDATE public.build_orders
         SET status = 'QUOTED',
             quoted_price_cents = $2,
             quoted_lead_time_days = $3,
             quote_note = $4,
             quote_valid_until = $5
         WHERE id = $1
         RETURNING *`,
        [buildId, validated.priceCents, validated.leadTimeDays, validated.note || null, validUntil.toISOString()]
      );

      await this.auditService.logActionInTransaction({
        domain: Domain.QUOTES,
        action: 'BUILD_QUOTE_ISSUED',
        actorId,
        organizationId: row.seller_organization_id,
        resourceId: buildId,
        beforeState: { status: row.status },
        afterState: {
          status: 'QUOTED',
          quotedPriceCents: validated.priceCents,
          quotedLeadTimeDays: validated.leadTimeDays,
        },
      }, client);

      return updated.rows[0];
    }, actorId);
  }

  @Post('builds/:id/accept')
  @RequirePermissions(Permission.QUOTE_APPROVE)
  async acceptQuote(@Req() req: any, @Param('id') buildId: string) {
    assertUuid(buildId, 'build id');
    const actorId = req.user.userId;

    return this.db.withTransaction(async (client) => {
      const current = await client.query('SELECT * FROM public.build_orders WHERE id = $1 FOR UPDATE', [buildId]);
      const row = current.rows[0];
      if (!row) throw new NotFoundException('Build order not found');
      if (req.user.activeRole !== 'PLATFORM_ADMIN' && row.customer_organization_id !== req.user.activeOrgId) {
        throw new ForbiddenException('Only the customer organization can accept this quote');
      }
      if (row.status !== 'QUOTED') {
        throw new BadRequestException('Quote cannot be accepted from status ' + row.status);
      }
      if (!row.quote_valid_until || new Date(row.quote_valid_until).getTime() <= Date.now()) {
        throw new BadRequestException('Quote has expired');
      }

      const updated = await client.query(
        `UPDATE public.build_orders
         SET status = 'ACCEPTED', accepted_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [buildId]
      );

      await this.auditService.logActionInTransaction({
        domain: Domain.QUOTES,
        action: 'BUILD_QUOTE_ACCEPTED',
        actorId,
        organizationId: row.customer_organization_id,
        resourceId: buildId,
        beforeState: { status: row.status, quotedPriceCents: row.quoted_price_cents },
        afterState: { status: 'ACCEPTED', quotedPriceCents: row.quoted_price_cents },
      }, client);

      return updated.rows[0];
    }, actorId);
  }

  @Post('builds/:id/cancel')
  @RequirePermissions(Permission.RFQ_CREATE)
  async cancelBuild(@Req() req: any, @Param('id') buildId: string) {
    assertUuid(buildId, 'build id');
    const actorId = req.user.userId;

    return this.db.withTransaction(async (client) => {
      const current = await client.query('SELECT * FROM public.build_orders WHERE id = $1 FOR UPDATE', [buildId]);
      const row = current.rows[0];
      if (!row) throw new NotFoundException('Build order not found');
      if (req.user.activeRole !== 'PLATFORM_ADMIN' && row.customer_organization_id !== req.user.activeOrgId) {
        throw new ForbiddenException('Only the customer organization can cancel this build');
      }
      if (!['RECEIVED', 'QUOTE_NEEDED', 'QUOTED'].includes(row.status)) {
        throw new BadRequestException('Build cannot be cancelled from status ' + row.status);
      }

      const updated = await client.query(
        `UPDATE public.build_orders SET status = 'CANCELLED' WHERE id = $1 RETURNING *`,
        [buildId]
      );
      await this.auditService.logActionInTransaction({
        domain: Domain.CATALOG,
        action: 'BUILD_ORDER_CANCELLED',
        actorId,
        organizationId: row.customer_organization_id,
        resourceId: buildId,
        beforeState: { status: row.status },
        afterState: { status: 'CANCELLED' },
      }, client);
      return updated.rows[0];
    }, actorId);
  }
}
