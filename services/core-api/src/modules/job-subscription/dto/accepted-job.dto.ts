import { Prisma } from '../../../generated/prisma/client';

export class AcceptedJobDto {
  jobId!: string;
  title!: string;
  description!: string;
  startsAt!: Date;
  durationMinutes!: number;
  value!: Prisma.Decimal;
  localId!: string;
  acceptedAt!: Date;
}
