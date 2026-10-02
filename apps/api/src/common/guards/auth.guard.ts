import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserContext, Permission, RoleName } from '@wuchan/contracts';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Dev / Test fallback strictly prohibited in production environment
      if (process.env.NODE_ENV === 'test' || (process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_AUTH === 'true')) {
        const mockUser: UserContext = {
          userId: (request.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000001',
          email: 'dev@wuchan.com',
          activeOrgId: (request.headers['x-org-id'] as string) || '11111111-1111-1111-1111-111111111111',
          activeRole: (request.headers['x-user-role'] as RoleName) || RoleName.ORG_OWNER,
          permissions: Object.values(Permission)
        };
        request.user = mockUser;
        return true;
      }
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;

    if (!jwtSecret) {
      if (process.env.NODE_ENV === 'test') {
        // Fallback for isolated test environments
        request.user = {
          userId: '00000000-0000-0000-0000-000000000001',
          email: 'test@wuchan.com',
          activeOrgId: '11111111-1111-1111-1111-111111111111',
          activeRole: RoleName.ORG_OWNER,
          permissions: Object.values(Permission)
        };
        return true;
      }
      throw new UnauthorizedException('JWT secret configuration is missing on server');
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      const userContext: UserContext = {
        userId: decoded.sub,
        email: decoded.email,
        activeOrgId: decoded.user_metadata?.org_id || decoded.org_id,
        activeRole: decoded.user_metadata?.role || decoded.role || RoleName.MEMBER,
        permissions: decoded.permissions || [Permission.ORG_READ, Permission.CATALOG_READ]
      };
      request.user = userContext;
      return true;
    } catch (err) {
      throw new UnauthorizedException(`Invalid or expired JWT signature: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
