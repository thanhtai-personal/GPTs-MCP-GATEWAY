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

const FIGMA_MCP_ENDPOINT = 'https://mcp.figma.com/mcp';
const FIGMA_RESOURCE_METADATA =
  'https://mcp.figma.com/.well-known/oauth-protected-resource';

@Injectable()
export class FigmaMcpAdapter implements McpProviderAdapter {
  readonly id = 'figma' as const;
  readonly displayName = 'Figma';
  readonly credential;
  readonly oauth;
  readonly catalogStatus;

  constructor(
    config: AppConfigService,
    private readonly client: RemoteMcpHttpClient,
  ) {
    const configured = Boolean(config.figmaMcpOAuthClientId);
    this.catalogStatus = configured
      ? ('available' as const)
      : ('pending_review' as const);
    this.credential = {
      kind: 'oauth' as const,
      label: 'Figma OAuth',
      connectLabel: { en: 'Connect Figma', vi: 'Kết nối Figma' },
      configured,
      note: configured
        ? {
            en: 'Figma Remote MCP uses OAuth and requires an MCP client approved by Figma. Standard Figma REST OAuth app credentials do not grant mcp:connect access.',
            vi: 'Figma Remote MCP dùng OAuth và yêu cầu MCP client được Figma chấp thuận. Credential của Figma REST OAuth app thông thường không cấp quyền mcp:connect.',
          }
        : {
            en: 'Figma Remote MCP client access is pending Figma review. Connect stays disabled until Figma approves the client and an approved MCP OAuth client ID is configured.',
            vi: 'Quyền truy cập Figma Remote MCP client đang chờ Figma xét duyệt. Nút kết nối sẽ bị khóa cho đến khi Figma phê duyệt client và MCP OAuth client ID được cấu hình.',
          },
    };
    this.oauth = {
      resourceUrl: 'https://mcp.figma.com',
      protectedResourceMetadataUrl: FIGMA_RESOURCE_METADATA,
      authorizationServerOrigins: ['https://api.figma.com'],
      clientId: config.figmaMcpOAuthClientId,
      clientSecret: config.figmaMcpOAuthClientSecret,
    };
  }

  async testConnection(credential: McpProviderCredential): Promise<void> {
    await this.listTools(credential);
  }

  listTools(
    credential: McpProviderCredential,
  ): Promise<McpToolDefinition[]> {
    return this.client.listTools(
      FIGMA_MCP_ENDPOINT,
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
      FIGMA_MCP_ENDPOINT,
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
        message: 'Figma requires an OAuth credential',
      });
    }
    return credential;
  }
}
