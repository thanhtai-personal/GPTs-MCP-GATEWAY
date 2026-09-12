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

const ENDPOINT = 'https://sheetsmcp.googleapis.com/mcp/v1';

@Injectable()
export class GoogleSheetsMcpAdapter implements McpProviderAdapter {
  readonly id = 'google-sheets' as const;
  readonly credentialOwner = {
    id: 'google-workspace',
    displayName: 'Google Workspace',
  } as const;
  readonly displayName = 'Google Sheets';
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
            en: 'TEST / Developer Preview. Gateway runs a dedicated Google OAuth consent flow for Workspace MCP while using the signed-in account as login_hint. The Workspace account and Cloud project must be enrolled in Developer Preview.',
            vi: 'TEST / Developer Preview. Gateway mở Google OAuth consent riêng cho Workspace MCP nhưng dùng login_hint của tài khoản đang đăng nhập. Google Workspace account và Cloud project phải được enroll Developer Preview.',
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
        message: 'Google Sheets requires a Google OAuth credential',
      });
    }
    return credential;
  }
}
