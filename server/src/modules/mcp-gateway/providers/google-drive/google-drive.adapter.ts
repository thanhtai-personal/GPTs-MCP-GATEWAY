import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GoogleWorkspaceTokenService } from '@server/root/modules/mcp-gateway/providers/google/google-workspace-token.service';
import {
  GoogleDriveApiClient,
  GoogleDriveApiError,
} from '@server/root/modules/mcp-gateway/providers/google-drive/google-drive-api.client';
import { GOOGLE_DRIVE_HANDLERS } from '@server/root/modules/mcp-gateway/providers/google-drive/google-drive.operations';
import { GOOGLE_DRIVE_TOOLS } from '@server/root/modules/mcp-gateway/providers/google-drive/google-drive.tools';
import type {
  McpOAuthCredential,
  McpProviderAdapter,
  McpProviderCredential,
  McpProviderCredentialDefinition,
  McpToolArguments,
  McpToolCallResult,
  McpToolDefinition,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

/**
 * Native Google Drive provider. Unlike Docs/Sheets it does not proxy a remote
 * MCP server: Gateway exposes its own tool catalog and calls the Drive REST
 * API directly with the user's Google Workspace OAuth token (full drive scope),
 * so Drive, Docs, and Sheets operations do not depend on Workspace MCP Preview.
 */
@Injectable()
export class GoogleDriveAdapter implements McpProviderAdapter {
  readonly id = 'google-drive' as const;
  readonly credentialOwner = {
    id: 'google-workspace',
    displayName: 'Google Workspace',
  } as const;
  readonly displayName = 'Google Drive';
  readonly credential: McpProviderCredentialDefinition;

  constructor(
    private readonly api: GoogleDriveApiClient,
    private readonly tokens: GoogleWorkspaceTokenService,
  ) {
    this.credential = {
      kind: 'oauth',
      label: 'Google Workspace OAuth',
      connectLabel: {
        en: 'Grant Google Drive + Docs + Sheets access',
        vi: 'Cấp quyền Google Drive + Docs + Sheets',
      },
      configured: tokens.configured,
      note: tokens.configured
        ? {
            en: 'Google Drive, Docs, and Sheets use official Google APIs. The full Drive scope allows access to files the signed-in user can access; the user must still have edit permission on each file. Google may require OAuth app verification for restricted Drive scope.',
            vi: 'Google Drive, Docs và Sheets dùng API chính thức. Scope Drive đầy đủ cho phép truy cập file mà người dùng đăng nhập có quyền truy cập; người dùng vẫn phải có quyền chỉnh sửa trên từng file. Google có thể yêu cầu xác minh ứng dụng OAuth đối với scope Drive hạn chế.',
          }
        : {
            en: 'Configure GOOGLE_WORKSPACE_OAUTH_CLIENT_ID/SECRET with the same Google OAuth client used by Supabase Auth.',
            vi: 'Cấu hình GOOGLE_WORKSPACE_OAUTH_CLIENT_ID/SECRET trùng Google OAuth client đang dùng trong Supabase Auth.',
          },
    };
  }

  async testConnection(credential: McpProviderCredential): Promise<void> {
    await this.api.getJson(this.accessToken(credential), '/about', {
      fields: 'user(emailAddress)',
    });
  }

  async listTools(
    credential: McpProviderCredential,
  ): Promise<McpToolDefinition[]> {
    this.accessToken(credential);
    return GOOGLE_DRIVE_TOOLS;
  }

  async callTool(
    credential: McpProviderCredential,
    toolName: string,
    argumentsValue: McpToolArguments,
  ): Promise<McpToolCallResult> {
    const handler = GOOGLE_DRIVE_HANDLERS[toolName];
    if (!handler) {
      throw new NotFoundException({
        code: 'MCP_TOOL_NOT_FOUND',
        message: `MCP tool not found: ${toolName}`,
      });
    }

    try {
      const value = await handler(
        this.api,
        this.accessToken(credential),
        argumentsValue,
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(value) }],
        structuredContent: { result: value },
      };
    } catch (error) {
      if (error instanceof GoogleDriveApiError) {
        return {
          isError: true,
          content: [{ type: 'text', text: this.explain(error) }],
        };
      }
      throw error;
    }
  }

  refreshCredential(
    credential: McpOAuthCredential,
  ): Promise<McpOAuthCredential> {
    return this.tokens.refresh(credential);
  }

  private explain(error: GoogleDriveApiError): string {
    if (error.status === 403) {
      return `Google Drive denied this operation (${error.message}). the OAuth grant or the signed-in user does not permit this operation.`;
    }
    if (error.status === 404) {
      return `File not found or not accessible (${error.message}).`;
    }
    return `Google Drive error ${error.status}: ${error.message}`;
  }

  private accessToken(credential: McpProviderCredential): string {
    if (credential.kind !== 'oauth') {
      throw new UnauthorizedException({
        code: 'MCP_INVALID_CREDENTIAL',
        message: 'Google Drive requires a Google OAuth credential',
      });
    }
    return credential.accessToken;
  }
}
