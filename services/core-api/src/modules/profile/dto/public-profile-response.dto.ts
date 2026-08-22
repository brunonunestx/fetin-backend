import { UserType } from '../../../generated/prisma/client';

export class PublicProfileResponseDto {
  id!: string;
  type!: UserType;
  name!: string | null;
  position!: string | null;
  bio!: string | null;
}
