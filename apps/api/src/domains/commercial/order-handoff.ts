import { BadRequestException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { PoolClient } from 'pg';
import { Domain } from '@wuchan/contracts';
import { calculateDepositCents } from '@wuchan/validation';
import { AuditService } from '../../audit/audit.module';

export interface OpenedOrder {
  order: Record<string, any>;
  invoice: Record<string, any> | null;
  created: boolean;
}

/**
 * Open the single order and deposit invoice implied by a fully executed contract.
 * Amounts are copied from the current quote version. Safe to call again.
 */
export async function openDepositOrderFromContract(
  client: PoolClient,
  auditService: AuditService,
  contract: Record<string, any>,
  actorId: string
): Promise<OpenedOrder> {
  const existingRes = await client.query(
    'SELECT * FROM public.orders WHERE contract_id = $1 FOR UPDATE',
    [contract.id]
  );
  if (existingRes.rows[0]) {
    const invoicesRes = await client.query(
      'SELECT * FROM public.invoices WHERE order_id = $1 ORDER BY created_at ASC',
      [existingRes.rows[0].id]
    );
    return {
      order: existingRes.rows[0],
      invoice: invoicesRes.rows[0] || null,
      created: false
    };
  }

  const versionRes = await client.query(
    `SELECT qv.version, qv.subtotal_cents, qv.tax_cents, qv.shipping_cents, qv.total_cents, qv.currency
     FROM public.quotes q
     JOIN public.quote_versions qv
       ON qv.quote_id = q.id AND qv.version = q.current_version
     WHERE q.id = $1`,
    [contract.quote_id]
  );
  const version = versionRes.rows[0];
  if (!version) {
    throw new ConflictException('Accepted quote has no frozen commercial version');
  }

  let depositCents: number;
  try {
    depositCents = calculateDepositCents(Number(version.total_cents), Number(contract.deposit_bps));
  } catch (error) {
    throw new BadRequestException(error instanceof Error ? error.message : 'Invalid deposit basis');
  }

  const orderNumber = 'ORD-' + new Date().getUTCFullYear() + '-' + randomUUID().slice(0, 8).toUpperCase();
  const orderRes = await client.query(
    `INSERT INTO public.orders
      (organization_id, seller_organization_id, quote_id, contract_id, status,
       quote_version, subtotal_cents, tax_cents, shipping_cents, total_amount_cents,
       deposit_cents, currency, order_number)
     VALUES ($1, $2, $3, $4, 'DEPOSIT_PENDING', $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      contract.organization_id,
      contract.seller_organization_id,
      contract.quote_id,
      contract.id,
      version.version,
      version.subtotal_cents,
      version.tax_cents,
      version.shipping_cents,
      version.total_cents,
      depositCents,
      version.currency,
      orderNumber
    ]
  );
  const order = orderRes.rows[0];

  const invoiceNumber = 'INV-' + new Date().getUTCFullYear() + '-' + randomUUID().slice(0, 8).toUpperCase();
  const invoiceRes = await client.query(
    `INSERT INTO public.invoices
      (order_id, organization_id, seller_organization_id, invoice_number, amount_cents, currency, due_date, status, milestone)
     VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '14 days', 'UNPAID', 'DEPOSIT')
     RETURNING *`,
    [
      order.id,
      contract.organization_id,
      contract.seller_organization_id,
      invoiceNumber,
      depositCents,
      version.currency
    ]
  );
  const invoice = invoiceRes.rows[0];

  await auditService.logActionInTransaction({
    domain: Domain.ORDERS,
    action: 'ORDER_OPENED_FROM_CONTRACT',
    actorId,
    organizationId: contract.organization_id,
    resourceId: order.id,
    afterState: {
      order,
      contractId: contract.id,
      quoteVersion: version.version,
      depositCents
    }
  }, client);

  await auditService.logActionInTransaction({
    domain: Domain.INVOICING,
    action: 'DEPOSIT_INVOICE_ISSUED',
    actorId,
    organizationId: contract.organization_id,
    resourceId: invoice.id,
    afterState: invoice
  }, client);

  return { order, invoice, created: true };
}
