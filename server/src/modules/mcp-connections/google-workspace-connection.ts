import type { ConnectGoogleWorkspaceDto } from '@server/root/modules/mcp-connections/dto/connect-google-workspace.dto';
import type { McpProviderCredential } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

export const GOOGLE_WORKSPACE_PROVIDER_IDS = [
  'google-docs',
  'google-sheets',
] as const;

export function googleWorkspaceCredential(
  dto: ConnectGoogleWorkspaceDto,
): McpProviderCredential {
  return {
    kind: 'oauth',
    accessToken: dto.providerToken,
    refreshToken: dto.providerRefreshToken,
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 50 * 60 * 1_000).toISOString(),
  };
}
