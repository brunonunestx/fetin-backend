import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../types/authenticated-request';

function createContext(user?: AuthenticatedUser): ExecutionContext {
  const request: Partial<AuthenticatedRequest> = { user };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows access when the route has no @Roles metadata', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(
      guard.canActivate(createContext({ userId: 'user-1', type: 'operator' })),
    ).toBe(true);
  });

  it('throws 403 when the authenticated user type is not allowed', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['local_owner']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() =>
      guard.canActivate(createContext({ userId: 'user-1', type: 'operator' })),
    ).toThrow(ForbiddenException);
  });

  it('allows access when the authenticated user type is allowed', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['operator']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(
      guard.canActivate(createContext({ userId: 'user-1', type: 'operator' })),
    ).toBe(true);
  });

  it('throws 403 when there is no authenticated user on the request', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['operator']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(createContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
