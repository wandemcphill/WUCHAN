import { RfqController, QuotesController } from '../src/domains/commercial/commercial.module';
import { ForbiddenException } from '@nestjs/common';

describe('Supplier assignment and quote issuance', () => {
  it('blocks non-platform users from assigning factories', async () => {
    const db = { withTransaction: jest.fn() } as any;
    const controller = new RfqController({} as any, db);

    await expect(
      controller.assignSupplier(
        { user: { userId: '00000000-0000-0000-0000-000000000001', activeRole: 'FACTORY_MANAGER' } },
        '00000000-0000-0000-0000-000000000010',
        { supplierOrganizationId: '00000000-0000-0000-0000-000000000020' },
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(db.withTransaction).not.toHaveBeenCalled();
  });

  it('blocks a factory from quoting an unassigned RFQ', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }) };
    const db = { withTransaction: jest.fn(async (fn: any) => fn(client)) } as any;
    const controller = new QuotesController({} as any, db);

    await expect(
      controller.createFromRfq(
        { user: { userId: '00000000-0000-0000-0000-000000000001', activeOrgId: '00000000-0000-0000-0000-000000000020', activeRole: 'FACTORY_MANAGER' } },
        {
          rfqId: '00000000-0000-0000-0000-000000000010',
          validUntil: '2026-12-01T00:00:00.000Z',
          subtotal: { amountCents: 100000, currency: 'USD' },
          tax: { amountCents: 10000, currency: 'USD' },
          shipping: { amountCents: 25000, currency: 'USD' },
          total: { amountCents: 135000, currency: 'USD' },
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
