import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import type {
  McpOAuthCredential,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

@Injectable()
export class GoogleWorkspaceTokenService {
  constructor(private readonly config: AppConfigService) {}

  get configured(): boolean {
    return Boolean(
      this.config.googleWorkspaceOAuthClientId &&
        this.config.googleWorkspaceOAuthClientSecret,
    );
  }

  async refresh(
    credential: McpOAuthCredential,
  ): Promise<McpOAuthCredential> {
    const clientId = this.config.googleWorkspaceOAuthClientId;
    const clientSecret = this.config.googleWorkspaceOAuthClientSecret;
    if (!clientId || !clientSecret || !credential.refreshToken) {
      throw new UnauthorizedException({
        code: 'MCP_OAUTH_RECONNECT_REQUIRED',
        message: 'Google Workspace authorization must be reconnected',
      });
    }

    let response: Response;
    try {
      response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: credential.refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
        signal: AbortSignal.timeout(this.config.upstreamTimeoutMs),
      });
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'GOOGLE_OAUTH_UNAVAILABLE',
        message: 'Google OAuth token endpoint is unavailable',
        details: {
          cause: error instanceof Error ? error.name : 'network_error',
        },
      });
    }

    let value: unknown;
    try {
      value = await response.json();
    } catch {
      value = null;
    }

    if (!response.ok || !isJsonObject(value)) {
      throw new UnauthorizedException({
        code: 'MCP_OAUTH_RECONNECT_REQUIRED',
        message: 'Google Workspace authorization must be reconnected',
      });
    }

    const accessToken = value.access_token;
    const expiresIn = value.expires_in;
    if (
      typeof accessToken !== 'string' ||
      typeof expiresIn !== 'number' ||
      !Number.isFinite(expiresIn)
    ) {
      throw new UnauthorizedException({
        code: 'MCP_OAUTH_RECONNECT_REQUIRED',
        message: 'Google OAuth refresh returned an invalid token response',
      });
    }

    return {
      ...credential,
      accessToken,
      expiresAt: new Date(Date.now() + expiresIn * 1_000).toISOString(),
      ...(typeof value.scope === 'string' ? { scope: value.scope } : {}),
    };
  }
}
