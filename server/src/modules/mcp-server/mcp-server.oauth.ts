import type { AppConfigService } from '@server/root/common/config/app-config.service';

export const MCP_OAUTH_SCOPES = ['openid', 'email', 'profile'] as const;

type MetadataConfig = Pick<
  AppConfigService,
  'mcpResourceUrl' | 'supabaseOAuthIssuerUrl' | 'webBaseUrl'
>;

/** RFC 9728 protected resource metadata for /api/v1/mcp. */
export function mcpProtectedResourceMetadata(config: MetadataConfig) {
  const web = config.webBaseUrl.replace(/\/+$/u, '');
  return {
    resource: config.mcpResourceUrl,
    authorization_servers: [config.supabaseOAuthIssuerUrl],
    scopes_supported: [...MCP_OAUTH_SCOPES],
    bearer_methods_supported: ['header'],
    resource_name: 'MCP Gateway',
    resource_documentation: web,
    resource_policy_uri: `${web}/privacy`,
    resource_tos_uri: `${web}/terms`,
  };
}

export function mcpAuthChallenge(
  config: Pick<AppConfigService, 'mcpProtectedResourceMetadataUrl'>,
): string {
  return `Bearer resource_metadata="${config.mcpProtectedResourceMetadataUrl}", error="invalid_token", error_description="MCP Gateway authentication required"`;
}
