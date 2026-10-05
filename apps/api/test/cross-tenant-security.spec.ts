import { AuthGuard } from '../src/common/guards/auth.guard';
import { DatabaseService } from '../src/database/database.service';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PaymentsController } from '../src/domains/operations/operations.module';
import { OrdersController, QuotesController } from '../src/domains/commercial/commercial.module';
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
    delete process.env.SUPABASE_JWT_ISSUER;
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

    (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user_123', email: 'user@a.com' });

    await expect(authGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('fails fast in production when SUPABASE_JWT_ISSUER is missing', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete process.env.SUPABASE_JWT_ISSUER;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer valid_mock_jwt'
          }
        })
      })
    } as any;

    await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);

    process.env.NODE_ENV = originalEnv;
  });

  it('atomically resolves parent quote and inserts quote version', async () => {
    const auditService = { logAction: jest.fn() } as any;
    const quotesController = new QuotesController(auditService, dbService);

    jest.spyOn(dbService, 'withTransaction').mockImplementation(async (fn: any) => {
      const mockClient = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('SELECT id, current_version')) {
            return Promise.resolve({ rows: [], rowCount: 0 });
          }
          if (sql.includes('INSERT INTO public.quotes')) {
            return Promise.resolve({ rows: [{ id: '00000000-0000-0000-0000-000000000001', current_version: 1, organization_id: 'org_1' }], rowCount: 1 });
          }
          if (sql.includes('INSERT INTO public.quote_versions')) {
            return Promise.resolve({ rows: [{ id: 'qv_1', quote_id: '00000000-0000-0000-0000-000000000001', version: 1 }], rowCount: 1 });
          }
          return Promise.resolve({ rows: [], rowCount: 0 });
        })
      } as any;
      return fn(mockClient);
    });

    const req = { user: { userId: '00000000-0000-0000-0000-000000000002', activeOrgId: 'org_1' } };
    const createBody = {
      quoteId: '00000000-0000-0000-0000-000000000001',
      validUntil: new Date().toISOString(),
      subtotal: { amountCents: 10000, currency: 'USD' },
      tax: { amountCents: 0, currency: 'USD' },
      shipping: { amountCents: 0, currency: 'USD' },
      total: { amountCents: 10000, currency: 'USD' }
    };

    const res = await quotesController.createVersion(req, createBody);
    expect(res).toBeDefined();
    expect(res.version).toBe(1);
  });

  it('prevents overpayment on invoices exceeding outstanding balance', async () => {
    const auditService = { logAction: jest.fn() } as any;
    const paymentsController = new PaymentsController(auditService, dbService);

    jest.spyOn(dbService, 'withTransaction').mockImplementation(async (fn: any) => {
      const mockClient = {
        query: jest.fn().mockImplementation((sql: string) => {
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
        })
      } as any;
      return fn(mockClient);
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
