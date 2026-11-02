import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CompleteMcpOAuthDto {
  @IsString()
  @MaxLength(4096)
  code!: string;

  @IsString()
  @MaxLength(8192)
  state!: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/u)
  browserNonce!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  iss?: string;
}
