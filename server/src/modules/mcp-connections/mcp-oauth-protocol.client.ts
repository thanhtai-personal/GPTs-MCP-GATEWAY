import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import type {
  McpOAuthProviderConfig,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

export type OAuthTokenPayload = {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresAt?: string;
  scope?: string;
};

export type AuthorizationServerMetadata = {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  issuer: string;
  resource: string;
  scopesSupported: string[];
};

@Injectable()
export class McpOAuthProtocolClient {
  constructor(private readonly config: AppConfigService) {}

  async discoverAuthorizationServer(
    oauth: McpOAuthProviderConfig,
  ): Promise<AuthorizationServerMetadata> {
    const protectedResource = await this.fetchJson(
      oauth.protectedResourceMetadataUrl,
      'MCP OAuth protected-resource metadata',
    );

    const authorizationServers = protectedResource.authorization_servers;
    const resource = protectedResource.resource;
    const scopesSupported = Array.isArray(protectedResource.scopes_supported)
      ? protectedResource.scopes_supported.filter(
          (scope): scope is string => typeof scope === 'string' && scope.length > 0,
        )
      : [];
    if (
      typeof resource !== 'string' ||
      this.normalizeUrl(resource) !== this.normalizeUrl(oauth.resourceUrl)
    ) {
      throw new BadGatewayException({
        code: 'MCP_OAUTH_RESOURCE_MISMATCH',
        message: 'MCP OAuth protected resource does not match provider configuration',
      });
    }
    if (
      !Array.isArray(authorizationServers) ||
      authorizationServers.length === 0 ||
      typeof authorizationServers[0] !== 'string'
    ) {
      throw new BadGatewayException({
        code: 'MCP_OAUTH_DISCOVERY_FAILED',
        message: 'MCP provider did not advertise an OAuth authorization server',
      });
    }

    const issuer = authorizationServers[0];
    this.requireAllowedAuthorizationServer(
      issuer,
      oauth.authorizationServerOrigins,
    );

    for (const candidate of this.authorizationMetadataCandidates(issuer)) {
      const metadata = await this.tryFetchJson(candidate);
      if (!metadata) continue;

      if (
        typeof metadata.authorization_endpoint !== 'string' ||
        typeof metadata.token_endpoint !== 'string'
      ) {
        continue;
      }

      if (
        typeof metadata.issuer === 'string' &&
        this.normalizeUrl(metadata.issuer) !== this.normalizeUrl(issuer)
      ) {
        continue;
      }

      const discoveredIssuer =
        typeof metadata.issuer === 'string' ? metadata.issuer : issuer;

      this.requireHttpsUrl(
        metadata.authorization_endpoint,
        'MCP OAuth authorization endpoint',
      );
      this.requireHttpsUrl(metadata.token_endpoint, 'MCP OAuth token endpoint');

      return {
        authorizationEndpoint: metadata.authorization_endpoint,
        tokenEndpoint: metadata.token_endpoint,
        issuer: discoveredIssuer,
        resource,
        scopesSupported,
      };
    }

    throw new BadGatewayException({
      code: 'MCP_OAUTH_DISCOVERY_FAILED',
      message: 'Could not discover MCP OAuth authorization endpoints',
    });
  }

  exchangeAuthorizationCode(
    tokenEndpoint: string,
    form: {
      code: string;
      redirectUri: string;
      clientId: string;
      codeVerifier: string;
      resource: string;
      clientSecret?: string;
    },
  ): Promise<OAuthTokenPayload> {
    return this.exchangeToken(tokenEndpoint, {
      grant_type: 'authorization_code',
      code: form.code,
      redirect_uri: form.redirectUri,
      client_id: form.clientId,
      code_verifier: form.codeVerifier,
      resource: form.resource,
      ...(form.clientSecret ? { client_secret: form.clientSecret } : {}),
    });
  }

  refreshToken(
    tokenEndpoint: string,
    form: {
      refreshToken: string;
      clientId: string;
      resource: string;
      clientSecret?: string;
    },
  ): Promise<OAuthTokenPayload> {
    return this.exchangeToken(tokenEndpoint, {
      grant_type: 'refresh_token',
      refresh_token: form.refreshToken,
      client_id: form.clientId,
      resource: form.resource,
      ...(form.clientSecret ? { client_secret: form.clientSecret } : {}),
    });
  }

  private authorizationMetadataCandidates(issuerValue: string): string[] {
    let issuer: URL;
    try {
      issuer = new URL(issuerValue);
    } catch {
      throw new BadGatewayException({
        code: 'MCP_OAUTH_DISCOVERY_FAILED',
        message: 'MCP OAuth authorization server URL is invalid',
      });
    }

    if (issuer.protocol !== 'https:') {
      throw new BadGatewayException({
        code: 'MCP_OAUTH_DISCOVERY_FAILED',
        message: 'MCP OAuth authorization server must use HTTPS',
      });
    }

    const path = issuer.pathname.replace(/\/+$/u, '');
    const values = [
      `${issuer.origin}/.well-known/oauth-authorization-server${path}`,
      `${issuer.origin}${path}/.well-known/oauth-authorization-server`,
      `${issuer.origin}/.well-known/oauth-authorization-server`,
      `${issuer.origin}/.well-known/openid-configuration${path}`,
      `${issuer.origin}${path}/.well-known/openid-configuration`,
      `${issuer.origin}/.well-known/openid-configuration`,
    ];

    return [...new Set(values)];
  }

  private async exchangeToken(
    tokenEndpoint: string,
    form: Record<string, string>,
  ): Promise<OAuthTokenPayload> {
    let response: Response;
    try {
      response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(form),
        signal: AbortSignal.timeout(this.config.upstreamTimeoutMs),
      });
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'MCP_OAUTH_UNAVAILABLE',
        message: 'MCP OAuth token endpoint is unavailable',
        details: { cause: error instanceof Error ? error.name : 'network_error' },
      });
    }

    const payload = await this.readJsonResponse(response);
    if (!response.ok) {
      throw new UnauthorizedException({
        code: 'MCP_OAUTH_TOKEN_EXCHANGE_FAILED',
        message: 'MCP OAuth authorization could not be completed',
        details: {
          status: response.status,
          ...(typeof payload.error === 'string'
            ? { oauthError: payload.error }
            : {}),
        },
      });
    }

    if (typeof payload.access_token !== 'string' || !payload.access_token) {
      throw new BadGatewayException({
        code: 'MCP_OAUTH_INVALID_TOKEN_RESPONSE',
        message: 'MCP OAuth token response did not contain an access token',
      });
    }

    const tokenType =
      typeof payload.token_type === 'string' ? payload.token_type : 'Bearer';
    if (tokenType.toLowerCase() !== 'bearer') {
      throw new BadGatewayException({
        code: 'MCP_OAUTH_INVALID_TOKEN_RESPONSE',
        message: 'MCP OAuth token type is not supported',
      });
    }

    const expiresIn =
      typeof payload.expires_in === 'number' && payload.expires_in > 0
        ? payload.expires_in
        : undefined;

    return {
      accessToken: payload.access_token,
      tokenType: 'Bearer',
      ...(typeof payload.refresh_token === 'string' && payload.refresh_token
        ? { refreshToken: payload.refresh_token }
        : {}),
      ...(expiresIn
        ? { expiresAt: new Date(Date.now() + expiresIn * 1_000).toISOString() }
        : {}),
      ...(typeof payload.scope === 'string' && payload.scope
        ? { scope: payload.scope }
        : {}),
    };
  }

  private async fetchJson(url: string, label: string) {
    const result = await this.tryFetchJson(url);
    if (!result) {
      throw new BadGatewayException({
        code: 'MCP_OAUTH_DISCOVERY_FAILED',
        message: `Could not load ${label}`,
      });
    }
    return result;
  }

  private async tryFetchJson(url: string) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.config.upstreamTimeoutMs),
      });
    } catch {
      return null;
    }

    if (!response.ok) return null;
    try {
      const value = (await response.json()) as unknown;
      return isJsonObject(value) ? value : null;
    } catch {
      return null;
    }
  }

  private async readJsonResponse(response: Response) {
    try {
      const value = (await response.json()) as unknown;
      return isJsonObject(value) ? value : {};
    } catch {
      return {};
    }
  }

  private requireAllowedAuthorizationServer(
    issuerValue: string,
    allowedOrigins: string[],
  ): void {
    let issuer: URL;
    try {
      issuer = new URL(issuerValue);
    } catch {
      throw new BadGatewayException({
        code: 'MCP_OAUTH_DISCOVERY_FAILED',
        message: 'MCP OAuth authorization server URL is invalid',
      });
    }

    const allowed = allowedOrigins.some((originValue) => {
      try {
        return new URL(originValue).origin === issuer.origin;
      } catch {
        return false;
      }
    });

    if (!allowed) {
      throw new BadGatewayException({
        code: 'MCP_OAUTH_AUTHORIZATION_SERVER_NOT_ALLOWED',
        message: 'MCP provider advertised an untrusted OAuth authorization server',
      });
    }
  }

  private requireHttpsUrl(value: string, label: string): void {
    try {
      const url = new URL(value);
      if (url.protocol === 'https:') return;
    } catch {
      // Fall through to the semantic discovery error below.
    }

    throw new BadGatewayException({
      code: 'MCP_OAUTH_DISCOVERY_FAILED',
      message: `${label} must use HTTPS`,
    });
  }

  private normalizeUrl(value: string): string {
    return value.replace(/\/+$/u, '');
  }
}
