import { ContractsController } from '../src/domains/contracts/contracts.module';
import { ForbiddenException } from '@nestjs/common';

describe('Contract lifecycle boundaries', () => {
  it('rejects drafting a contract from an unaccepted quote', async () => {
    const client = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FROM public.quotes')) {
          return {
            rows: [{
              id: '00000000-0000-0000-0000-000000000010',
              quote_number: 'QTE-2026-ABCD1234',
              customer_organization_id: '00000000-0000-0000-0000-000000000011',
              seller_organization_id: '00000000-0000-0000-0000-000000000012',
              status: 'ISSUED',
              seller_type: 'FACTORY',
            }],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      }),
    };
    const db = { withTransaction: jest.fn(async (fn: any) => fn(client)) } as any;
    const controller = new ContractsController({} as any, db);

    await expect(
      controller.createFromQuote(
        {
          user: {
            userId: '00000000-0000-0000-0000-000000000020',
            activeOrgId: '00000000-0000-0000-0000-000000000012',
            activeRole: 'FACTORY_MANAGER',
          },
        },
        {
          quoteId: '00000000-0000-0000-0000-000000000010',
          termsText: 'This is a sufficiently long commercial contract terms document for test purposes with more than one hundred characters.',
          depositBps: 3000,
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('blocks an unrelated organization from signing', async () => {
    const client = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FROM public.contracts')) {
          return {
            rows: [{
              id: '00000000-0000-0000-0000-000000000030',
              organization_id: '00000000-0000-0000-0000-000000000011',
              seller_organization_id: '00000000-0000-0000-0000-000000000012',
              status: 'PENDING_SIGNATURE',
              customer_signed_at: null,
              seller_signed_at: null,
            }],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      }),
    };
    const db = { withTransaction: jest.fn(async (fn: any) => fn(client)) } as any;
    const controller = new ContractsController({} as any, db);

    await expect(
      controller.sign(
        {
          user: {
            userId: '00000000-0000-0000-0000-000000000020',
            activeOrgId: '00000000-0000-0000-0000-000000000099',
            activeRole: 'CUSTOMER_BUYER',
          },
        },
        '00000000-0000-0000-0000-000000000030',
        { acknowledged: true },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('opens one deposit order when the second party signs and does not duplicate it', async () => {
    const state: { contract: Record<string, any>; orders: any[]; invoices: any[] } = {
      contract: {
        id: '00000000-0000-0000-0000-000000000030',
        quote_id: '00000000-0000-0000-0000-000000000010',
        organization_id: '00000000-0000-0000-0000-000000000011',
        seller_organization_id: '00000000-0000-0000-0000-000000000012',
        status: 'CUSTOMER_SIGNED',
        customer_signed_at: '2026-10-01T00:00:00.000Z',
        seller_signed_at: null,
        deposit_bps: 3000,
        quote_number: 'QTE-2026-ABCD1234',
      },
      orders: [],
      invoices: [],
    };

    const client = {
      query: jest.fn(async (sql: string, params: any[] = []) => {
        if (sql.includes('FROM public.contracts')) {
          return { rows: [state.contract], rowCount: 1 };
        }
        if (sql.includes('UPDATE public.contracts')) {
          state.contract = {
            ...state.contract,
            seller_signed_at: '2026-10-02T00:00:00.000Z',
            seller_signed_by: params[1],
            status: 'FULLY_EXECUTED',
          };
          return { rows: [state.contract], rowCount: 1 };
        }
        if (sql.includes('FROM public.orders WHERE contract_id')) {
          return { rows: state.orders, rowCount: state.orders.length };
        }
        if (sql.includes('FROM public.quotes')) {
          return {
            rows: [{
              version: 1,
              subtotal_cents: '700000',
              tax_cents: '0',
              shipping_cents: '300000',
              total_cents: '1000000',
              currency: 'USD',
            }],
            rowCount: 1,
          };
        }
        if (sql.includes('INSERT INTO public.orders')) {
          const order = {
            id: '00000000-0000-0000-0000-000000000040',
            order_number: params[11],
            status: 'DEPOSIT_PENDING',
            deposit_cents: params[9],
            total_amount_cents: params[8],
            contract_id: params[3],
          };
          state.orders.push(order);
          return { rows: [order], rowCount: 1 };
        }
        if (sql.includes('INSERT INTO public.invoices')) {
          const invoice = {
            id: '00000000-0000-0000-0000-000000000041',
            invoice_number: params[3],
            amount_cents: params[4],
            milestone: 'DEPOSIT',
            status: 'UNPAID',
          };
          state.invoices.push(invoice);
          return { rows: [invoice], rowCount: 1 };
        }
        if (sql.includes('FROM public.invoices')) {
          return { rows: state.invoices, rowCount: state.invoices.length };
        }
        return { rows: [], rowCount: 0 };
      }),
    };

    const audit = { logActionInTransaction: jest.fn(async () => ({})) };
    const db = { withTransaction: jest.fn(async (fn: any) => fn(client)) } as any;
    const controller = new ContractsController(audit as any, db);
    const seller = {
      user: {
        userId: '00000000-0000-0000-0000-000000000020',
        activeOrgId: '00000000-0000-0000-0000-000000000012',
        activeRole: 'FACTORY_MANAGER',
      },
    };

    const signed = await controller.sign(seller, state.contract.id, { acknowledged: true });
    expect(signed.order.deposit_cents).toBe(300000);
    expect(signed.order.total_amount_cents).toBe('1000000');
    expect(signed.depositInvoice.amount_cents).toBe(300000);
    expect(signed.depositInvoice.milestone).toBe('DEPOSIT');
    expect(audit.logActionInTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ORDER_OPENED_FROM_CONTRACT', domain: 'orders' }),
      client,
    );

    const again = await controller.sign(seller, state.contract.id, { acknowledged: true });
    expect(again.order.id).toBe(signed.order.id);
    expect(state.orders).toHaveLength(1);
    expect(state.invoices).toHaveLength(1);
  });
});
