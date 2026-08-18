import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserType } from '../../generated/prisma/client';
import { AuthenticatedRequest } from '../types/authenticated-request';

interface JwtPayload {
  userId: string;
  type: UserType;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException({
        code: 'MISSING_TOKEN',
        message: 'Token de autenticação ausente',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = { userId: payload.userId, type: payload.type };
      return true;
    } catch (error) {
      this.logger.warn(
        `Rejected request with invalid token: ${(error as Error).message}`,
      );
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Token de autenticação inválido ou expirado',
      });
    }
  }

  private extractToken(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [scheme, token] = authHeader.split(' ');
    return scheme === 'Bearer' && token ? token : undefined;
  }
}
