import { UserType } from '../../../generated/prisma/client';

export class UserResponseDto {
  id!: string;
  email!: string;
  type!: UserType;
  createdAt!: Date;
}
