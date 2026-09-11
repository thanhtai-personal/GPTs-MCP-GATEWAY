import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import type {
  McpOAuthCredential,
  McpProviderAdapter,
  McpProviderCredential,
  McpToolArguments,
  McpToolCallResult,
  McpToolDefinition,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
import { RemoteMcpHttpClient } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.client';

const LOVABLE_MCP_ENDPOINT = 'https://mcp.lovable.dev';
const LOVABLE_RESOURCE_METADATA =
  'https://mcp.lovable.dev/.well-known/oauth-protected-resource';

@Injectable()
export class LovableMcpAdapter implements McpProviderAdapter {
  readonly id = 'lovable' as const;
  readonly displayName = 'Lovable';
  readonly credential = {
    kind: 'oauth' as const,
    label: 'Lovable OAuth',
    connectLabel: { en: 'Connect Lovable', vi: 'Kết nối Lovable' },
    configured: true,
    note: {
      en: 'Lovable MCP is currently a research preview.',
      vi: 'Lovable MCP hiện đang ở giai đoạn research preview.',
    },
  };

  readonly oauth;

  constructor(
    config: AppConfigService,
    private readonly client: RemoteMcpHttpClient,
  ) {
    this.oauth = {
      resourceUrl: LOVABLE_MCP_ENDPOINT,
      protectedResourceMetadataUrl: LOVABLE_RESOURCE_METADATA,
      authorizationServerOrigins: ['https://lovable.dev'],
      clientId: config.lovableMcpOAuthClientId,
      scopes: [
        'offline',
        'projects:read',
        'projects:write',
        'workspaces:read',
        'workspaces:write',
      ],
    };
  }

  async testConnection(credential: McpProviderCredential): Promise<void> {
    await this.listTools(credential);
  }

  listTools(
    credential: McpProviderCredential,
  ): Promise<McpToolDefinition[]> {
    return this.client.listTools(
      LOVABLE_MCP_ENDPOINT,
      this.oauthCredential(credential),
      this.displayName,
    );
  }

  callTool(
    credential: McpProviderCredential,
    toolName: string,
    argumentsValue: McpToolArguments,
  ): Promise<McpToolCallResult> {
    return this.client.callTool(
      LOVABLE_MCP_ENDPOINT,
      this.oauthCredential(credential),
      this.displayName,
      toolName,
      argumentsValue,
    );
  }

  private oauthCredential(
    credential: McpProviderCredential,
  ): McpOAuthCredential {
    if (credential.kind !== 'oauth') {
      throw new UnauthorizedException({
        code: 'MCP_INVALID_CREDENTIAL',
        message: 'Lovable requires an OAuth credential',
      });
    }
    return credential;
  }
}
