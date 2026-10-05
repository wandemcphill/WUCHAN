import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { UserContext, Permission, RoleName } from '@wuchan/contracts';
import { DatabaseService } from '../../database/database.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  [RoleName.PLATFORM_ADMIN]: Object.values(Permission),
  [RoleName.ORG_OWNER]: Object.values(Permission),
  [RoleName.ORG_ADMIN]: [
    Permission.ORG_READ, Permission.ORG_MEMBERS_MANAGE,
    Permission.CATALOG_READ, Permission.CATALOG_MANAGE,
    Permission.RFQ_READ, Permission.RFQ_MANAGE,
    Permission.QUOTE_READ, Permission.QUOTE_CREATE, Permission.QUOTE_APPROVE,
    Permission.ORDER_READ, Permission.ORDER_MANAGE, Permission.ORDER_STATE_UPDATE,
    Permission.PAYMENT_READ, Permission.INVOICE_READ, Permission.INVENTORY_READ, Permission.INVENTORY_MANAGE,
    Permission.PRODUCTION_READ, Permission.PRODUCTION_MANAGE, Permission.QUALITY_READ, Permission.QUALITY_INSPECT,
    Permission.SHIPPING_READ, Permission.SHIPPING_MANAGE, Permission.DOCUMENTS_READ, Permission.DOCUMENTS_MANAGE,
    Permission.MESSAGING_READ, Permission.MESSAGING_SEND, Permission.NOTIFICATIONS_READ, Permission.AUDIT_READ
  ],
  [RoleName.FACTORY_MANAGER]: [
    Permission.CATALOG_READ, Permission.CATALOG_MANAGE, Permission.ORDER_READ, Permission.ORDER_STATE_UPDATE,
    Permission.INVENTORY_READ, Permission.INVENTORY_MANAGE, Permission.PRODUCTION_READ, Permission.PRODUCTION_MANAGE,
    Permission.QUALITY_READ, Permission.QUALITY_INSPECT, Permission.SHIPPING_READ, Permission.SHIPPING_MANAGE,
    Permission.DOCUMENTS_READ, Permission.DOCUMENTS_MANAGE, Permission.MESSAGING_READ, Permission.MESSAGING_SEND, Permission.NOTIFICATIONS_READ
  ],
  [RoleName.PRODUCTION_SUPERVISOR]: [
    Permission.ORDER_READ, Permission.INVENTORY_READ, Permission.INVENTORY_MANAGE, Permission.PRODUCTION_READ, Permission.PRODUCTION_MANAGE, Permission.QUALITY_READ, Permission.QUALITY_INSPECT
  ],
  [RoleName.QUALITY_INSPECTOR]: [
    Permission.ORDER_READ, Permission.QUALITY_READ, Permission.QUALITY_INSPECT, Permission.DOCUMENTS_READ, Permission.DOCUMENTS_MANAGE
  ],
  [RoleName.CUSTOMER_BUYER]: [
    Permission.CATALOG_READ, Permission.RFQ_CREATE, Permission.RFQ_READ, Permission.QUOTE_READ,
    Permission.QUOTE_APPROVE, Permission.ORDER_READ, Permission.PAYMENT_READ, Permission.PAYMENT_PROCESS,
    Permission.INVOICE_READ, Permission.DOCUMENTS_READ, Permission.DOCUMENTS_MANAGE, Permission.MESSAGING_READ, Permission.MESSAGING_SEND, Permission.NOTIFICATIONS_READ
  ],
  [RoleName.CUSTOMER_PROJECT_MANAGER]: [
    Permission.CATALOG_READ, Permission.RFQ_READ, Permission.QUOTE_READ, Permission.ORDER_READ,
    Permission.DOCUMENTS_READ, Permission.DOCUMENTS_MANAGE, Permission.MESSAGING_READ, Permission.MESSAGING_SEND, Permission.NOTIFICATIONS_READ
  ],
  [RoleName.MEMBER]: [
    Permission.CATALOG_READ, Permission.RFQ_READ, Permission.QUOTE_READ, Permission.ORDER_READ, Permission.NOTIFICATIONS_READ
  ]
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private db: DatabaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (isPublic) {
        request.user = null;
        return true;
      }
      if (process.env.NODE_ENV === 'test' || (process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_AUTH === 'true')) {
        const userId = (request.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000001';
        const role = (request.headers['x-user-role'] as RoleName) || RoleName.ORG_OWNER;
        request.user = {
          userId,
          email: 'dev@wuchan.com',
          activeOrgId: (request.headers['x-org-id'] as string) || '11111111-1111-1111-1111-111111111111',
          activeRole: role,
          permissions: ROLE_PERMISSIONS[role] || Object.values(Permission)
        };
        return true;
      }
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;

    if (!jwtSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('SUPABASE_JWT_SECRET environment variable is missing on server');
      }
      if (process.env.NODE_ENV === 'test') {
        request.user = {
          userId: '00000000-0000-0000-0000-000000000001',
          email: 'test@wuchan.com',
          activeOrgId: '11111111-1111-1111-1111-111111111111',
          activeRole: RoleName.ORG_OWNER,
          permissions: Object.values(Permission)
        };
        return true;
      }
      throw new UnauthorizedException('Server JWT secret configuration missing');
    }

    try {
      if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_JWT_ISSUER) {
        throw new UnauthorizedException('SUPABASE_JWT_ISSUER environment variable must be configured in production');
      }

      const expectedIssuer = process.env.SUPABASE_JWT_ISSUER;
      const expectedAudience = process.env.SUPABASE_JWT_AUDIENCE || 'authenticated';

      const decoded = jwt.verify(token, jwtSecret, {
        issuer: expectedIssuer,
        audience: expectedAudience
      }) as any;

      const userId = decoded.sub;
      const email = decoded.email || 'user@wuchan.com';

      const requestedOrgId = request.headers['x-org-id'] as string;

      const memberRes = await this.db.query(
        'SELECT organization_id, role FROM public.organization_members WHERE user_id = $1',
        [userId],
        userId
      );

      const memberships = memberRes.rows;

      let activeOrgId: string | undefined = undefined;
      let activeRole: RoleName = RoleName.MEMBER;

      if (requestedOrgId) {
        const found = memberships.find((m: any) => m.organization_id === requestedOrgId);
        if (!found) {
          throw new ForbiddenException(`User is not a member of requested organization ${requestedOrgId}`);
        }
        activeOrgId = found.organization_id;
        activeRole = found.role as RoleName;
      } else if (memberships.length > 0) {
        activeOrgId = memberships[0].organization_id;
        activeRole = memberships[0].role as RoleName;
      }

      const permissions = ROLE_PERMISSIONS[activeRole] || [Permission.CATALOG_READ, Permission.ORG_READ];

      const userContext: UserContext = {
        userId,
        email,
        activeOrgId,
        activeRole,
        permissions
      };

      request.user = userContext;
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException || err instanceof UnauthorizedException) {
        throw err;
      }
      if (isPublic) {
        request.user = null;
        return true;
      }
      throw new UnauthorizedException(`JWT verification failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
