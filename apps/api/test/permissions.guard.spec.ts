import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Permission } from '@wuchan/contracts';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user })
      })
    } as any;
  }

  it('allows access when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ userId: 'u1' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws UnauthorizedException if user context is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.ORG_READ]);
    const context = createMockContext(null);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('allows access if user possesses required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.QUOTE_APPROVE]);
    const user = {
      userId: 'u1',
      permissions: [Permission.QUOTE_APPROVE, Permission.QUOTE_READ]
    };
    const context = createMockContext(user);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException if user lacks required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.QUOTE_APPROVE]);
    const user = {
      userId: 'u1',
      permissions: [Permission.QUOTE_READ]
    };
    const context = createMockContext(user);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
