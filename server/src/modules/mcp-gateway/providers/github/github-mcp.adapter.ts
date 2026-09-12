import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import type {
  McpOAuthCredential,
  McpOAuthProviderConfig,
  McpProviderAdapter,
  McpProviderCredential,
  McpProviderCredentialDefinition,
  McpToolArguments,
  McpToolCallResult,
  McpToolDefinition,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
import { RemoteMcpHttpClient } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.client';

const GITHUB_MCP_ENDPOINT = 'https://api.githubcopilot.com/mcp';
const GITHUB_MCP_READ_ONLY_ENDPOINT =
  'https://api.githubcopilot.com/mcp/x/all/readonly';
const GITHUB_RESOURCE_METADATA =
  'https://api.githubcopilot.com/.well-known/oauth-protected-resource/mcp';

@Injectable()
export class GithubMcpAdapter implements McpProviderAdapter {
  readonly id = 'github' as const;
  readonly displayName = 'GitHub';
  readonly credential: McpProviderCredentialDefinition;
  readonly oauth: McpOAuthProviderConfig;

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
            en: 'Read-only is the default. Write tools are enabled only after you explicitly select Read + write and reconnect GitHub.',
            vi: 'Mặc định chỉ đọc. Write tools chỉ được bật khi bạn chủ động chọn Đọc + ghi và kết nối lại GitHub.',
          }
        : {
            en: 'Register a GitHub OAuth App or GitHub App for this hosted Gateway callback, then configure the server-side MCP OAuth client ID and secret.',
            vi: 'Hãy đăng ký GitHub OAuth App hoặc GitHub App cho callback của Gateway hosted này, sau đó cấu hình MCP OAuth client ID và secret ở server.',
          },
      accessModes: {
        default: 'read',
        options: [
          {
            id: 'read',
            label: { en: 'Read only', vi: 'Chỉ đọc' },
            description: {
              en: 'Source, repositories, issues, pull requests, Actions and metadata can be inspected. GitHub MCP write tools are filtered out.',
              vi: 'Có thể đọc source, repository, issue, pull request, Actions và metadata. GitHub MCP sẽ loại toàn bộ write tools.',
            },
          },
          {
            id: 'write',
            label: { en: 'Read + write', vi: 'Đọc + ghi' },
            description: {
              en: 'Allows write-capable GitHub MCP tools exposed by the granted OAuth scopes and organization policy.',
              vi: 'Cho phép các GitHub MCP write tools trong phạm vi OAuth scope và policy của organization.',
            },
          },
        ],
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
    const oauth = this.oauthCredential(credential);
    return this.client.listTools(
      this.endpointFor(oauth),
      oauth,
      this.displayName,
    );
  }

  callTool(
    credential: McpProviderCredential,
    toolName: string,
    argumentsValue: McpToolArguments,
  ): Promise<McpToolCallResult> {
    const oauth = this.oauthCredential(credential);
    return this.client.callTool(
      this.endpointFor(oauth),
      oauth,
      this.displayName,
      toolName,
      argumentsValue,
    );
  }

  private endpointFor(credential: McpOAuthCredential): string {
    return credential.accessMode === 'write'
      ? GITHUB_MCP_ENDPOINT
      : GITHUB_MCP_READ_ONLY_ENDPOINT;
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
