import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { SecretCipherService } from '@server/root/common/security/secret-cipher.service';
import { AuthService } from '@server/root/modules/auth/auth.service';
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';
import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import type { McpOAuthCredential } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

const AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const TOKEN_INFO_ENDPOINT = 'https://oauth2.googleapis.com/tokeninfo';

const REQUESTED_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
] as const;

const REQUIRED_EFFECTIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets',
] as const;

type GoogleWorkspaceOAuthState = {
  version: 1;
  userId: string;
  issuedAt: number;
};

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
};

@Injectable()
export class GoogleWorkspaceOAuthService {
  constructor(
    private readonly auth: AuthService,
    private readonly cipher: SecretCipherService,
    private readonly config: AppConfigService,
    private readonly connections: McpConnectionsService,
  ) {}

  async start(request: Request) {
    const user = await this.auth.requireUser(request);
    const clientId = this.requireClientId();

    const state = this.cipher.encrypt(
      JSON.stringify({
        version: 1,
        userId: user.id,
        issuedAt: Date.now(),
      } satisfies GoogleWorkspaceOAuthState),
    );

    const url = new URL(AUTHORIZATION_ENDPOINT);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', this.callbackUri());
    url.searchParams.set('scope', REQUESTED_SCOPES.join(' '));
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('include_granted_scopes', 'true');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', state);
    if (user.email) url.searchParams.set('login_hint', user.email);

    return {
      provider: 'google-workspace',
      authorizationUrl: url.toString(),
    };
  }

  async complete(code: string, stateValue: string) {
    const state = this.readState(stateValue);
    await this.auth.getUserById(state.userId);

    const credential = await this.exchangeCode(code);
    const diagnostics = await this.validateFreshToken(credential);

    try {
      const connection =
        await this.connections.connectGoogleWorkspaceCredential(
          state.userId,
          credential,
        );

      return { connection };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        const response = error.getResponse();
        const codeValue =
          isJsonObject(response) && typeof response.code === 'string'
            ? response.code
            : undefined;

        if (codeValue === 'MCP_OAUTH_RECONNECT_REQUIRED') {
          throw new ForbiddenException({
            code: 'GOOGLE_WORKSPACE_MCP_ACCESS_REJECTED',
            message:
              'Google issued a fresh OAuth token with the required scopes, but the Google Workspace MCP server rejected it. Verify Developer Preview enrollment for both the Workspace account and Google Cloud project, then verify the Docs/Sheets MCP APIs are enabled.',
            details: diagnostics,
          });
        }
      }
      throw error;
    }
  }

  callbackUri(): string {
    const base = this.config.publicBaseUrl.replace(/\/+$/u, '');
    return `${base}/api/v1/mcp-connections/google-workspace/oauth/callback`;
  }

  private async exchangeCode(code: string): Promise<McpOAuthCredential> {
    let response: Response;
    try {
      response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: this.requireClientId(),
          client_secret: this.requireClientSecret(),
          redirect_uri: this.callbackUri(),
          grant_type: 'authorization_code',
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

    const payload = await this.readJson(response);
    if (!response.ok) {
      throw new UnauthorizedException({
        code: 'GOOGLE_WORKSPACE_OAUTH_EXCHANGE_FAILED',
        message: 'Google Workspace authorization could not be completed',
        details: {
          status: response.status,
          ...(typeof payload.error === 'string'
            ? { oauthError: payload.error }
            : {}),
        },
      });
    }

    if (
      typeof payload.access_token !== 'string' ||
      typeof payload.expires_in !== 'number'
    ) {
      throw new BadGatewayException({
        code: 'GOOGLE_OAUTH_INVALID_TOKEN_RESPONSE',
        message: 'Google OAuth returned an invalid token response',
      });
    }

    const token = payload as unknown as GoogleTokenResponse;
    if (!token.refresh_token) {
      throw new UnauthorizedException({
        code: 'GOOGLE_WORKSPACE_REFRESH_TOKEN_MISSING',
        message:
          'Google did not return an offline refresh token. Revoke the existing app grant for this test account, then connect Google Workspace again.',
      });
    }

    return {
      kind: 'oauth',
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + token.expires_in * 1_000).toISOString(),
      ...(token.scope ? { scope: token.scope } : {}),
    };
  }

  private async validateFreshToken(
    credential: McpOAuthCredential,
  ): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      const url = new URL(TOKEN_INFO_ENDPOINT);
      url.searchParams.set('access_token', credential.accessToken);
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.config.upstreamTimeoutMs),
      });
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'GOOGLE_OAUTH_DIAGNOSTICS_UNAVAILABLE',
        message: 'Google OAuth token diagnostics are unavailable',
        details: {
          cause: error instanceof Error ? error.name : 'network_error',
        },
      });
    }

    const payload = await this.readJson(response);
    if (!response.ok) {
      throw new UnauthorizedException({
        code: 'GOOGLE_WORKSPACE_OAUTH_TOKEN_INVALID',
        message: 'Google rejected the newly issued OAuth token',
        details: { status: response.status },
      });
    }

    const grantedScopes =
      typeof payload.scope === 'string'
        ? new Set(payload.scope.split(/\s+/u).filter(Boolean))
        : new Set<string>();

    const missingScopes = REQUIRED_EFFECTIVE_SCOPES.filter(
      (scope) => !grantedScopes.has(scope),
    );
    if (missingScopes.length) {
      throw new ForbiddenException({
        code: 'GOOGLE_WORKSPACE_SCOPES_MISSING',
        message:
          'Google OAuth did not grant all scopes required by the Docs and Sheets MCP servers',
        details: { missingScopes },
      });
    }

    const audience =
      typeof payload.aud === 'string' ? payload.aud : undefined;
    if (audience && audience !== this.requireClientId()) {
      throw new UnauthorizedException({
        code: 'GOOGLE_WORKSPACE_OAUTH_CLIENT_MISMATCH',
        message:
          'The Google OAuth token was issued to a different OAuth client than the Gateway configuration',
      });
    }

    return {
      tokenValid: true,
      requiredScopesGranted: true,
      ...(audience ? { audienceMatchesClient: true } : {}),
    };
  }

  private readState(serialized: string): GoogleWorkspaceOAuthState {
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.cipher.decrypt(serialized));
    } catch {
      throw this.invalidState();
    }

    if (
      !isJsonObject(parsed) ||
      parsed.version !== 1 ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.issuedAt !== 'number'
    ) {
      throw this.invalidState();
    }

    const state = parsed as GoogleWorkspaceOAuthState;
    const ageMs = Date.now() - state.issuedAt;
    if (
      ageMs < 0 ||
      ageMs > this.config.mcpOAuthStateTtlSeconds * 1_000
    ) {
      throw new BadRequestException({
        code: 'MCP_OAUTH_STATE_EXPIRED',
        message: 'Google Workspace OAuth authorization state expired',
      });
    }

    return state;
  }

  private async readJson(response: Response): Promise<Record<string, unknown>> {
    try {
      const value: unknown = await response.json();
      return isJsonObject(value) ? value : {};
    } catch {
      return {};
    }
  }

  private requireClientId(): string {
    const value = this.config.googleWorkspaceOAuthClientId;
    if (!value) {
      throw new ServiceUnavailableException({
        code: 'GOOGLE_WORKSPACE_OAUTH_NOT_CONFIGURED',
        message: 'Google Workspace OAuth client ID is not configured',
      });
    }
    return value;
  }

  private requireClientSecret(): string {
    const value = this.config.googleWorkspaceOAuthClientSecret;
    if (!value) {
      throw new ServiceUnavailableException({
        code: 'GOOGLE_WORKSPACE_OAUTH_NOT_CONFIGURED',
        message: 'Google Workspace OAuth client secret is not configured',
      });
    }
    return value;
  }

  private invalidState(): BadRequestException {
    return new BadRequestException({
      code: 'MCP_OAUTH_STATE_INVALID',
      message: 'Google Workspace OAuth state is invalid',
    });
  }
}
