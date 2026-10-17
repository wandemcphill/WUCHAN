import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, UserContext } from '@wuchan/contracts';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: UserContext = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication token required.');
    }

    // Platform Admins have full access
    if (user.permissions?.includes(Permission.ORG_MANAGE) && user.activeRole === 'PLATFORM_ADMIN') {
      return true;
    }

    const hasPermission = requiredPermissions.every((permission) =>
      user.permissions?.includes(permission)
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Requires: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}
