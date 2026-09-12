import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectGoogleWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  providerToken!: string;

  @IsString()
  @IsNotEmpty()
  providerRefreshToken!: string;
}
