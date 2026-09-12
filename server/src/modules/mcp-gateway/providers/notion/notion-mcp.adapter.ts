import { Injectable, UnauthorizedException } from '@nestjs/common';
import type {
  McpOAuthCredential,
  McpProviderAdapter,
  McpProviderCredential,
  McpToolArguments,
  McpToolCallResult,
  McpToolDefinition,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
import { RemoteMcpHttpClient } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.client';

const NOTION_MCP_ENDPOINT = 'https://mcp.notion.com/mcp';
const NOTION_RESOURCE_METADATA =
  'https://mcp.notion.com/.well-known/oauth-protected-resource/mcp';

@Injectable()
export class NotionMcpAdapter implements McpProviderAdapter {
  readonly id = 'notion' as const;
  readonly displayName = 'Notion';
  readonly credential = {
    kind: 'oauth' as const,
    label: 'Notion OAuth',
    connectLabel: { en: 'Connect Notion', vi: 'Kết nối Notion' },
    configured: true,
    note: {
      en: 'Notion MCP uses OAuth with PKCE and dynamic client registration. Gateway stores the resulting OAuth token and dynamic client registration encrypted server-side.',
      vi: 'Notion MCP dùng OAuth với PKCE và dynamic client registration. Gateway mã hóa token OAuth và thông tin dynamic client ở server-side.',
    },
  };
  readonly oauth = {
    resourceUrl: NOTION_MCP_ENDPOINT,
    protectedResourceMetadataUrl: NOTION_RESOURCE_METADATA,
    authorizationServerOrigins: ['https://mcp.notion.com'],
    scopes: ['default'],
    dynamicClientRegistration: {
      clientName: 'MCP Gateway',
    },
  };

  constructor(private readonly client: RemoteMcpHttpClient) {}

  async testConnection(credential: McpProviderCredential): Promise<void> {
    await this.listTools(credential);
  }

  listTools(
    credential: McpProviderCredential,
  ): Promise<McpToolDefinition[]> {
    return this.client.listTools(
      NOTION_MCP_ENDPOINT,
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
      NOTION_MCP_ENDPOINT,
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
        message: 'Notion requires an OAuth credential',
      });
    }
    return credential;
  }
}
