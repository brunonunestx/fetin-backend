import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Prisma, User } from '../../generated/prisma/client';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { AuthTokenDto } from './dto/auth-token.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from './dto/user-response.dto';

const SALT_ROUNDS = 10;
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaProvider,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterDto): Promise<UserResponseDto> {
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          type: data.type,
        },
      });

      return this.toUserResponse(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'E-mail já cadastrado',
        });
      }

      throw error;
    }
  }

  async login(data: LoginDto): Promise<AuthTokenDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      this.logger.warn(`Login attempt failed for email ${data.email}`);
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciais inválidas',
      });
    }

    const accessToken = await this.jwtService.signAsync({
      userId: user.id,
      type: user.type,
    });

    return { accessToken };
  }

  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      type: user.type,
      createdAt: user.createdAt,
    };
  }
}
