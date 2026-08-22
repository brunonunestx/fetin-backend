import { LocalSummaryDto } from '../../local/dto/local-summary.dto';

export class JobResponseDto {
  id!: string;
  localId!: string;
  title!: string;
  description!: string;
  startsAt!: Date;
  durationMinutes!: number;
  value!: string;
  createdAt!: Date;
  cancelledAt!: Date | null;
  filled!: boolean;
  local!: LocalSummaryDto;
}
