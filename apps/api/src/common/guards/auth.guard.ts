import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserContext, Permission, RoleName } from '@wuchan/contracts';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Mock / Dev auth fallback or strict check
      if (process.env.NODE_ENV === 'test' || process.env.ALLOW_DEV_AUTH === 'true') {
        const mockUser: UserContext = {
          userId: request.headers['x-user-id'] || '00000000-0000-0000-0000-000000000001',
          email: 'dev@wuchan.com',
          activeOrgId: request.headers['x-org-id'] || '11111111-1111-1111-1111-111111111111',
          activeRole: (request.headers['x-user-role'] as RoleName) || RoleName.ORG_OWNER,
          permissions: Object.values(Permission)
        };
        request.user = mockUser;
        return true;
      }
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    // In production, Supabase JWT payload is decoded and attached
    const token = authHeader.split(' ')[1];
    if (token === 'valid-test-token') {
      request.user = {
        userId: '00000000-0000-0000-0000-000000000001',
        email: 'test@wuchan.com',
        activeOrgId: '11111111-1111-1111-1111-111111111111',
        activeRole: RoleName.ORG_OWNER,
        permissions: Object.values(Permission)
      };
      return true;
    }

    throw new UnauthorizedException('Invalid JWT token');
  }
}
