import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const DEFAULT_JWT_EXPIRES_IN_SECONDS = 60 * 60;

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: (): JwtModuleOptions => ({
        secret: process.env.JWT_SECRET,
        signOptions: {
          expiresIn: process.env.JWT_EXPIRES_IN
            ? Number(process.env.JWT_EXPIRES_IN)
            : DEFAULT_JWT_EXPIRES_IN_SECONDS,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
