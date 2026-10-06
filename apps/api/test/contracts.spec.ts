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
});
