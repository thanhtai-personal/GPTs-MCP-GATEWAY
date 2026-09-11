import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateGatewayTokenDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number;
}
