import { IsString, MinLength } from 'class-validator';

export class SaveMcpConnectionDto {
  @IsString()
  @MinLength(1)
  provider!: string;

  @IsString()
  @MinLength(1)
  apiKey!: string;
}
