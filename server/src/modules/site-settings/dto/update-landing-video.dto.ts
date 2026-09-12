import { IsString, MaxLength } from 'class-validator';

export class UpdateLandingVideoDto {
  @IsString()
  @MaxLength(4_096)
  youtubeInput!: string;
}
