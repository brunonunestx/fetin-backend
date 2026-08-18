import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  @Matches(PHONE_REGEX, {
    message: 'phone deve estar no formato E.164 (ex: +5511999999999)',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
