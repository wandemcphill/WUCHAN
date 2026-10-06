import { QuotesController } from '../src/domains/commercial/commercial.module';
import { ForbiddenException } from '@nestjs/common';

describe('Quote customer acceptance boundary', () => {
  it('prevents a supplier from accepting its own quote', async () => {
    const client = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FROM public.quotes')) {
          return {
            rows: [{
              id: '00000000-0000-0000-0000-000000000010',
              organization_id: '00000000-0000-0000-0000-000000000011',
              seller_organization_id: '00000000-0000-0000-0000-000000000012',
              status: 'ISSUED',
              current_version: 1,
              valid_until: '2026-12-31T00:00:00.000Z',
            }],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      }),
    };

    const db = { withTransaction: jest.fn(async (fn: any) => fn(client)) } as any;
    const controller = new QuotesController({} as any, db);

    await expect(
      controller.approve(
        {
          user: {
            userId: '00000000-0000-0000-0000-000000000001',
            activeOrgId: '00000000-0000-0000-0000-000000000012',
            activeRole: 'ORG_ADMIN',
          },
        },
        '00000000-0000-0000-0000-000000000010',
        { purchaseOrderRef: 'PO-001' },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('requires a purchase order reference when a customer accepts', async () => {
    const db = { withTransaction: jest.fn() } as any;
    const controller = new QuotesController({} as any, db);

    await expect(
      controller.approve(
        {
          user: {
            userId: '00000000-0000-0000-0000-000000000001',
            activeOrgId: '00000000-0000-0000-0000-000000000011',
            activeRole: 'CUSTOMER_BUYER',
          },
        },
        '00000000-0000-0000-0000-000000000010',
        { purchaseOrderRef: '' },
      ),
    ).rejects.toThrow();
    expect(db.withTransaction).not.toHaveBeenCalled();
  });
});
