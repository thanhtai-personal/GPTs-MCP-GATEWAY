import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOpenIdDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;
}
