import { UserType } from '../../../generated/prisma/client';

export class MeResponseDto {
  userId!: string;
  type!: UserType;
}
