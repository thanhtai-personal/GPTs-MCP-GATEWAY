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
const LOVABLE_SHARED_EDITOR_CLIENT_ID =
  '6d465f583e1e4ce5801b1616f735670c';

@Injectable()
export class LovableMcpAdapter implements McpProviderAdapter {
  readonly id = 'lovable' as const;
  readonly displayName = 'Lovable';
  readonly credential;
  readonly oauth;
  readonly catalogStatus;

  constructor(
    config: AppConfigService,
    private readonly client: RemoteMcpHttpClient,
  ) {
    const configuredClientId = config.lovableMcpOAuthClientId;
    const usesSharedEditorClient =
      configuredClientId === LOVABLE_SHARED_EDITOR_CLIENT_ID;
    const configured = Boolean(configuredClientId && !usesSharedEditorClient);

    this.catalogStatus = configured
      ? ('available' as const)
      : ('provider_restricted' as const);

    this.credential = {
      kind: 'oauth' as const,
      label: 'Lovable OAuth',
      connectLabel: { en: 'Connect Lovable', vi: 'Kết nối Lovable' },
      configured,
      note: configured
        ? {
            en: 'Lovable OAuth client is configured for this Gateway.',
            vi: 'OAuth client Lovable đã được cấu hình cho Gateway này.',
          }
        : {
            en: usesSharedEditorClient
              ? 'Lovable\'s shared editor client ID does not authorize this hosted Gateway callback. Use a client explicitly registered for this Gateway.'
              : 'Lovable currently restricts OAuth to supported MCP clients. Connect is disabled until Lovable allows or registers this hosted Gateway client.',
            vi: usesSharedEditorClient
              ? 'Client ID dùng chung cho editor của Lovable không cho phép callback của Gateway hosted này. Chỉ dùng client được đăng ký riêng cho Gateway.'
              : 'Lovable hiện giới hạn OAuth cho các MCP client được hỗ trợ. Kết nối bị khóa cho đến khi Lovable cho phép hoặc đăng ký Gateway hosted này.',
          },
    };

    this.oauth = {
      resourceUrl: LOVABLE_MCP_ENDPOINT,
      protectedResourceMetadataUrl: LOVABLE_RESOURCE_METADATA,
      authorizationServerOrigins: ['https://lovable.dev'],
      clientId: configured ? configuredClientId : undefined,
      clientSecret: configured ? config.lovableMcpOAuthClientSecret : undefined,
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
