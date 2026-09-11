import { IsIn, IsString, MinLength } from 'class-validator';

export class SaveMcpConnectionDto {
  @IsIn(['stitch'])
  provider!: 'stitch';

  @IsString()
  @MinLength(8)
  apiKey!: string;
}
