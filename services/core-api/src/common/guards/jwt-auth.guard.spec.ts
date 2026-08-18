import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthenticatedRequest } from '../types/authenticated-request';

function createContext(authorization?: string): {
  context: ExecutionContext;
  request: Partial<AuthenticatedRequest>;
} {
  const request: Partial<AuthenticatedRequest> = {
    headers: authorization ? { authorization } : {},
  };

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;

  return { context, request };
}

function createGuard(verifyAsync: jest.Mock): {
  guard: JwtAuthGuard;
  verifyAsync: jest.Mock;
} {
  const jwtService = { verifyAsync } as unknown as JwtService;
  return { guard: new JwtAuthGuard(jwtService), verifyAsync };
}

describe('JwtAuthGuard', () => {
  it('throws 401 when there is no Authorization header', async () => {
    const verifyAsync = jest.fn();
    const { guard } = createGuard(verifyAsync);
    const { context } = createContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifyAsync).not.toHaveBeenCalled();
  });

  it('throws 401 when the token is invalid or expired', async () => {
    const verifyAsync = jest.fn().mockRejectedValue(new Error('jwt expired'));
    const { guard } = createGuard(verifyAsync);
    const { context } = createContext('Bearer invalid-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('populates request.user and allows access with a valid token', async () => {
    const verifyAsync = jest
      .fn()
      .mockResolvedValue({ userId: 'user-1', type: 'operator' });
    const { guard } = createGuard(verifyAsync);
    const { context, request } = createContext('Bearer valid-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 'user-1', type: 'operator' });
    expect(verifyAsync).toHaveBeenCalledWith('valid-token');
  });
});
