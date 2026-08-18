import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const UF_REGEX = /^[A-Z]{2}$/;
const ZIP_CODE_REGEX = /^\d{5}-?\d{3}$/;

export class CreateLocalDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  address: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @IsString()
  @Matches(UF_REGEX, {
    message: 'state deve ser a sigla da UF em maiúsculas (ex: SP)',
  })
  state: string;

  @IsString()
  @Matches(ZIP_CODE_REGEX, {
    message: 'zipCode deve estar no formato de CEP (ex: 01310-100)',
  })
  zipCode: string;
}
