import { AuditService, OutboxService } from '../src/audit/audit.module';
import { DatabaseService } from '../src/database/database.service';
import { Domain } from '@wuchan/contracts';

describe('Audit & Outbox Framework', () => {
  let auditService: AuditService;
  let outboxService: OutboxService;
  let dbService: DatabaseService;

  beforeEach(() => {
    dbService = new DatabaseService();
    outboxService = new OutboxService(dbService);
    auditService = new AuditService(outboxService, dbService);
  });

  it('records audit log and emits outbox event via database service transaction', async () => {
    jest.spyOn(dbService, 'withTransaction').mockImplementation(async (fn: any) => {
      const mockClient = { query: jest.fn() } as any;
      return fn(mockClient);
    });

    const entry = await auditService.logAction({
      domain: Domain.QUOTES,
      action: 'QUOTE_APPROVED',
      actorId: '00000000-0000-0000-0000-000000000001',
      organizationId: '11111111-1111-1111-1111-111111111111',
      resourceId: 'q_123',
      afterState: { status: 'APPROVED' }
    });

    expect(entry).toBeDefined();
    expect(entry.domain).toBe(Domain.QUOTES);
    expect(entry.action).toBe('QUOTE_APPROVED');
  });
});
