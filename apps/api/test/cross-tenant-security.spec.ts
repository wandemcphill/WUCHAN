import { AuthGuard } from '../src/common/guards/auth.guard';
import { DatabaseService } from '../src/database/database.service';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { PaymentsController } from '../src/domains/operations/operations.module';
import { OrdersController } from '../src/domains/commercial/commercial.module';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

describe('Cross-Tenant Security & Business Boundary Tests', () => {
  let authGuard: AuthGuard;
  let dbService: DatabaseService;
  let reflector: Reflector;

  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret-12345';
    reflector = new Reflector();
    dbService = new DatabaseService();
    authGuard = new AuthGuard(reflector, dbService);
  });

  afterEach(() => {
    delete process.env.SUPABASE_JWT_SECRET;
  });

  it('rejects access when user requests an x-org-id they do not belong to', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    jest.spyOn(dbService, 'query').mockResolvedValue({
      rows: [{ organization_id: 'org_tenant_A', role: 'MEMBER' }],
      rowCount: 1
    });

    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer valid_mock_jwt',
            'x-org-id': 'org_tenant_B_unauthorized'
          }
        })
      })
    } as any;

    (jwt.verify as jest.Mock).mockReturnValue({ sub: '00000000-0000-0000-0000-000000000003', email: 'user@a.com' });

    await expect(authGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('prevents overpayment on invoices exceeding outstanding balance', async () => {
    const auditService = { logAction: jest.fn() } as any;
    const paymentsController = new PaymentsController(auditService, dbService);

    jest.spyOn(dbService, 'query').mockImplementation((sql: string) => {
      if (sql.includes('public.invoices')) {
        return Promise.resolve({
          rows: [{ id: '00000000-0000-0000-0000-000000000001', organization_id: 'org_1', amount_cents: 10000, currency: 'USD', status: 'UNPAID' }],
          rowCount: 1
        });
      }
      if (sql.includes('public.payments')) {
        return Promise.resolve({
          rows: [{ total_paid: '8000' }],
          rowCount: 1
        });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const req = { user: { userId: '00000000-0000-0000-0000-000000000002', activeOrgId: 'org_1' } };
    const overpaymentBody = {
      invoiceId: '00000000-0000-0000-0000-000000000001',
      amount: { amountCents: 5000, currency: 'USD' }
    };

    await expect(paymentsController.processPayment(req, overpaymentBody)).rejects.toThrow(BadRequestException);
  });

  it('rejects illegal order status transitions', async () => {
    const auditService = { logAction: jest.fn() } as any;
    const ordersController = new OrdersController(auditService, dbService);

    jest.spyOn(dbService, 'query').mockImplementation((sql: string) => {
      if (sql.includes('public.orders')) {
        return Promise.resolve({
          rows: [{ id: '00000000-0000-0000-0000-000000000001', status: 'DRAFT' }],
          rowCount: 1
        });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const req = { user: { userId: '00000000-0000-0000-0000-000000000002', activeOrgId: 'org_1' } };
    const illegalTransition = {
      orderId: '00000000-0000-0000-0000-000000000001',
      status: 'COMPLETED'
    };

    await expect(ordersController.updateStatus(req, illegalTransition)).rejects.toThrow(BadRequestException);
  });
});
