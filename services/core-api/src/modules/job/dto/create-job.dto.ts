import {
  IsInt,
  IsISO8601,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateJobDto {
  @IsUUID()
  localId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsISO8601()
  startsAt: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  value: number;
}
