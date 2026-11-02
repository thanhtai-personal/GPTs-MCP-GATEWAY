import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import type {
  McpOAuthCredential,
  McpProviderAdapter,
  McpProviderCatalogStatus,
  McpProviderCredential,
  McpToolArguments,
  McpToolCallResult,
  McpToolDefinition,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
import { RemoteMcpHttpClient } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.client';

/**
 * Self-hosted Google Drive MCP (see /gdrive-mcp). The operator deploys one
 * instance and sets GOOGLE_DRIVE_MCP_URL; each user saves that instance's
 * MCP_API_KEY as an encrypted api_key credential.
 */
@Injectable()
export class GoogleDriveMcpAdapter implements McpProviderAdapter {
  readonly id = 'google-drive' as const;
  readonly displayName = 'Google Drive';
  readonly credential = {
    kind: 'api_key' as const,
    label: 'Google Drive MCP API Key',
    placeholder: 'MCP_API_KEY của server gdrive-mcp',
  };
  readonly catalogStatus: McpProviderCatalogStatus;

  constructor(
    private readonly config: AppConfigService,
    private readonly client: RemoteMcpHttpClient,
  ) {
    this.catalogStatus = config.googleDriveMcpUrl
      ? 'available'
      : 'requires_configuration';
  }

  async testConnection(credential: McpProviderCredential): Promise<void> {
    await this.listTools(credential);
  }

  listTools(credential: McpProviderCredential): Promise<McpToolDefinition[]> {
    return this.client.listTools(
      this.endpoint(),
      this.bearer(credential),
      this.displayName,
    );
  }

  callTool(
    credential: McpProviderCredential,
    toolName: string,
    argumentsValue: McpToolArguments,
  ): Promise<McpToolCallResult> {
    return this.client.callTool(
      this.endpoint(),
      this.bearer(credential),
      this.displayName,
      toolName,
      argumentsValue,
    );
  }

  private endpoint(): string {
    const url = this.config.googleDriveMcpUrl;
    if (!url) {
      throw new ServiceUnavailableException({
        code: 'MCP_PROVIDER_NOT_CONFIGURED',
        message: 'GOOGLE_DRIVE_MCP_URL is not configured on this Gateway',
      });
    }
    return url;
  }

  /** The remote transport sends `Authorization: <tokenType> <accessToken>`. */
  private bearer(credential: McpProviderCredential): McpOAuthCredential {
    if (credential.kind !== 'api_key' || !credential.value) {
      throw new UnauthorizedException({
        code: 'MCP_INVALID_CREDENTIAL',
        message: 'Google Drive MCP requires an API key credential',
      });
    }
    return { kind: 'oauth', accessToken: credential.value, tokenType: 'Bearer' };
  }
}
