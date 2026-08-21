import { IsOptional, IsUUID } from 'class-validator';

export class FindJobsDto {
  @IsOptional()
  @IsUUID()
  localId?: string;
}
