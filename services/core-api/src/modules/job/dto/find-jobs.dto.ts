import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class FindJobsDto {
  @IsOptional()
  @IsUUID()
  localId?: string;

  @ValidateIf(
    (dto: FindJobsDto) => dto.lat !== undefined || dto.lng !== undefined,
  )
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @ValidateIf(
    (dto: FindJobsDto) => dto.lat !== undefined || dto.lng !== undefined,
  )
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  radiusKm?: number;
}
