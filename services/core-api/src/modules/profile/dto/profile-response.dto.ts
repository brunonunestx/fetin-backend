import { UserType } from '../../../generated/prisma/client';

export class ProfileResponseDto {
  id!: string;
  email!: string;
  type!: UserType;
  name!: string | null;
  age!: number | null;
  phone!: string | null;
  position!: string | null;
  bio!: string | null;
  createdAt!: Date;
}
