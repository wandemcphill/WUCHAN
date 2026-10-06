import { RfqController } from '../src/domains/commercial/commercial.module';
import { DatabaseService } from '../src/database/database.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('RFQ command boundaries', () => {
  function makeController(client: any) {
    return new RfqController(
      { logActionInTransaction: jest.fn() } as any,
      { withTransaction: jest.fn(async (fn: any) => fn(client)), query: jest.fn() } as any as DatabaseService,
    );
  }

  it('rejects an RFQ assigned to another organization before writing', async () => {
    const controller = makeController({ query: jest.fn() });

    await expect(
      controller.create(
        { user: { userId: '00000000-0000-0000-0000-000000000001', activeOrgId: '00000000-0000-0000-0000-000000000010', activeRole: 'CUSTOMER_BUYER' } },
        {
          organizationId: '00000000-0000-0000-0000-000000000020',
          title: 'Test RFQ',
          description: 'Request for a modular building quotation.',
          destinationPort: 'Port of Lagos',
          incotermsRequested: 'CIF',
          items: [{ productSku: 'WCH-POD-X7', quantity: 2 }],
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects private products owned by another organization', async () => {
    const client = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FROM public.products')) {
          return {
            rows: [{
              id: '00000000-0000-0000-0000-000000000030',
              sku: 'PRIVATE-001',
              organization_id: '00000000-0000-0000-0000-000000000099',
              is_public: false,
            }],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      }),
    };

    const controller = makeController(client);

    await expect(
      controller.create(
        { user: { userId: '00000000-0000-0000-0000-000000000001', activeOrgId: '00000000-0000-0000-0000-000000000010', activeRole: 'CUSTOMER_BUYER' } },
        {
          organizationId: '00000000-0000-0000-0000-000000000010',
          title: 'Private product request',
          description: 'Request for a private supplier product.',
          destinationPort: 'Port of Lagos',
          incotermsRequested: 'DDP',
          items: [{ productSku: 'PRIVATE-001', quantity: 1 }],
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('persists a valid structured RFQ and emits the audit event in the same transaction', async () => {
    const client = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FROM public.products')) {
          return {
            rows: [{
              id: '00000000-0000-0000-0000-000000000030',
              sku: 'WCH-POD-X7',
              organization_id: '00000000-0000-0000-0000-000000000099',
              is_public: true,
            }],
            rowCount: 1,
          };
        }
        if (sql.includes('INSERT INTO public.rfqs')) {
          return {
            rows: [{
              id: '00000000-0000-0000-0000-000000000040',
              organization_id: '00000000-0000-0000-0000-000000000010',
              title: 'Valid RFQ',
              status: 'SUBMITTED',
            }],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 1 };
      }),
    };

    const auditService = { logActionInTransaction: jest.fn() };
    const db = { withTransaction: jest.fn(async (fn: any) => fn(client)) } as any;
    const controller = new RfqController(auditService as any, db);

    const result = await controller.create(
      { user: { userId: '00000000-0000-0000-0000-000000000001', activeOrgId: '00000000-0000-0000-0000-000000000010', activeRole: 'CUSTOMER_BUYER' } },
      {
        organizationId: '00000000-0000-0000-0000-000000000010',
        title: 'Valid RFQ',
        description: 'Request for a modular building quotation.',
        destinationPort: 'Port of Lagos',
        incotermsRequested: 'FOB',
        items: [{ productSku: 'WCH-POD-X7', quantity: 3, configuration: { color: 'white' } }],
      },
    );

    expect(result.id).toBe('00000000-0000-0000-0000-000000000040');
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO public.rfq_items'),
      expect.any(Array),
    );
    expect(auditService.logActionInTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'RFQ_CREATED' }),
      client,
    );
  });

  it('returns authenticated tenant RFQs with structured item aggregation', async () => {
    const db = {
      query: jest.fn().mockResolvedValue({
        rows: [{ id: '00000000-0000-0000-0000-000000000040', items: [] }],
        rowCount: 1,
      }),
    } as any;

    const controller = new RfqController({} as any, db);
    const result = await controller.list({ user: { userId: '00000000-0000-0000-0000-000000000001' } });

    expect(result).toHaveLength(1);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('json_agg'),
      [],
      '00000000-0000-0000-0000-000000000001',
    );
  });
});
