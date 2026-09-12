import { Injectable, UnauthorizedException } from '@nestjs/common';
import type {
  McpOAuthCredential,
  McpProviderAdapter,
  McpProviderCredential,
  McpProviderCredentialDefinition,
  McpToolArguments,
  McpToolCallResult,
  McpToolDefinition,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
import { GoogleWorkspaceTokenService } from '@server/root/modules/mcp-gateway/providers/google/google-workspace-token.service';
import { RemoteMcpHttpClient } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.client';

const ENDPOINT = 'https://docsmcp.googleapis.com/mcp/v1';

@Injectable()
export class GoogleDocsMcpAdapter implements McpProviderAdapter {
  readonly id = 'google-docs' as const;
  readonly credentialOwner = {
    id: 'google-workspace',
    displayName: 'Google Workspace',
  } as const;
  readonly displayName = 'Google Docs';
  readonly credential: McpProviderCredentialDefinition;

  constructor(
    private readonly client: RemoteMcpHttpClient,
    private readonly tokens: GoogleWorkspaceTokenService,
  ) {
    this.credential = {
      kind: 'oauth',
      label: 'Google Workspace OAuth',
      connectLabel: {
        en: 'Grant Google Docs + Sheets access',
        vi: 'Cấp quyền Google Docs + Sheets',
      },
      configured: tokens.configured,
      note: tokens.configured
        ? {
            en: 'Uses the Google account already signed in to MCP Gateway and requests additional Docs + Sheets permissions.',
            vi: 'Dùng tài khoản Google đang đăng nhập MCP Gateway và xin thêm quyền Docs + Sheets.',
          }
        : {
            en: 'Configure GOOGLE_WORKSPACE_OAUTH_CLIENT_ID/SECRET with the same Google OAuth client used by Supabase Auth.',
            vi: 'Cấu hình GOOGLE_WORKSPACE_OAUTH_CLIENT_ID/SECRET trùng Google OAuth client đang dùng trong Supabase Auth.',
          },
    };
  }

  async testConnection(credential: McpProviderCredential): Promise<void> {
    await this.listTools(credential);
  }

  listTools(
    credential: McpProviderCredential,
  ): Promise<McpToolDefinition[]> {
    return this.client.listTools(
      ENDPOINT,
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
      ENDPOINT,
      this.oauthCredential(credential),
      this.displayName,
      toolName,
      argumentsValue,
    );
  }

  refreshCredential(
    credential: McpOAuthCredential,
  ): Promise<McpOAuthCredential> {
    return this.tokens.refresh(credential);
  }

  private oauthCredential(
    credential: McpProviderCredential,
  ): McpOAuthCredential {
    if (credential.kind !== 'oauth') {
      throw new UnauthorizedException({
        code: 'MCP_INVALID_CREDENTIAL',
        message: 'Google Docs requires a Google OAuth credential',
      });
    }
    return credential;
  }
}
