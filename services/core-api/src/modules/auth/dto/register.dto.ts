import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserType } from '../../../generated/prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserType)
  type: UserType;
}
