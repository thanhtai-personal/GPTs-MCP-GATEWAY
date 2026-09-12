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

const GITHUB_MCP_ENDPOINT = 'https://api.githubcopilot.com/mcp';
const GITHUB_RESOURCE_METADATA =
  'https://api.githubcopilot.com/.well-known/oauth-protected-resource/mcp';

@Injectable()
export class GithubMcpAdapter implements McpProviderAdapter {
  readonly id = 'github' as const;
  readonly displayName = 'GitHub';
  readonly credential;
  readonly oauth;

  constructor(
    config: AppConfigService,
    private readonly client: RemoteMcpHttpClient,
  ) {
    const configured = Boolean(
      config.githubMcpOAuthClientId && config.githubMcpOAuthClientSecret,
    );

    this.credential = {
      kind: 'oauth' as const,
      label: 'GitHub OAuth',
      connectLabel: { en: 'Connect GitHub', vi: 'Kết nối GitHub' },
      configured,
      note: configured
        ? {
            en: 'GitHub Remote MCP OAuth is configured for this Gateway. Access remains limited by the scopes approved during sign-in and organization policy.',
            vi: 'GitHub Remote MCP OAuth đã được cấu hình cho Gateway này. Quyền truy cập vẫn bị giới hạn bởi scope người dùng phê duyệt và policy của organization.',
          }
        : {
            en: 'Register a GitHub OAuth App or GitHub App for this hosted Gateway callback, then configure the server-side MCP OAuth client ID and secret.',
            vi: 'Hãy đăng ký GitHub OAuth App hoặc GitHub App cho callback của Gateway hosted này, sau đó cấu hình MCP OAuth client ID và secret ở server.',
          },
    };

    this.oauth = {
      resourceUrl: GITHUB_MCP_ENDPOINT,
      protectedResourceMetadataUrl: GITHUB_RESOURCE_METADATA,
      authorizationServerOrigins: ['https://github.com'],
      clientId: config.githubMcpOAuthClientId,
      clientSecret: config.githubMcpOAuthClientSecret,
      scopes: [
        'repo',
        'read:org',
        'read:user',
        'user:email',
        'read:project',
        'project',
        'gist',
        'notifications',
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
      GITHUB_MCP_ENDPOINT,
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
      GITHUB_MCP_ENDPOINT,
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
        message: 'GitHub requires an OAuth credential',
      });
    }
    return credential;
  }
}
