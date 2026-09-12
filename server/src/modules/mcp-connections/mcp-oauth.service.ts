import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { SecretCipherService } from '@server/root/common/security/secret-cipher.service';
import { McpOAuthClientRegistrationClient } from '@server/root/modules/mcp-connections/mcp-oauth-client-registration.client';
import type {
  OAuthTokenPayload,
} from '@server/root/modules/mcp-connections/mcp-oauth-protocol.client';
import { McpOAuthProtocolClient } from '@server/root/modules/mcp-connections/mcp-oauth-protocol.client';
import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import type {
  McpOAuthCredential,
  McpOAuthProviderConfig,
  McpProviderAdapter,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

type OAuthStatePayload = {
  version: 1;
  provider: string;
  userId: string;
  codeVerifier: string;
  clientId: string;
  clientSecret?: string;
  dynamicClient?: boolean;
  redirectUri: string;
  issuer: string;
  resource: string;
  issuedAt: number;
};

type OAuthClientRegistration = {
  clientId: string;
  clientSecret?: string;
  dynamic: boolean;
};

@Injectable()
export class McpOAuthService {
  constructor(
    private readonly config: AppConfigService,
    private readonly cipher: SecretCipherService,
    private readonly protocol: McpOAuthProtocolClient,
    private readonly registration: McpOAuthClientRegistrationClient,
  ) {}

  async createAuthorizationRequest(
    userId: string,
    provider: McpProviderAdapter,
  ) {
    const oauth = this.requireOAuth(provider);
    const metadata = await this.protocol.discoverAuthorizationServer(oauth);
    const redirectUri = this.callbackUri(provider.id);
    const client = await this.resolveAuthorizationClient(
      provider,
      oauth,
      metadata.registrationEndpoint,
      redirectUri,
    );
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    const state = this.encodeState({
      version: 1,
      provider: provider.id,
      userId,
      codeVerifier,
      clientId: client.clientId,
      ...(client.clientSecret ? { clientSecret: client.clientSecret } : {}),
      ...(client.dynamic ? { dynamicClient: true } : {}),
      redirectUri,
      issuer: metadata.issuer,
      resource: metadata.resource,
      issuedAt: Date.now(),
    });

    const authorizationUrl = new URL(metadata.authorizationEndpoint);
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('client_id', client.clientId);
    authorizationUrl.searchParams.set('redirect_uri', redirectUri);
    authorizationUrl.searchParams.set('code_challenge', codeChallenge);
    authorizationUrl.searchParams.set('code_challenge_method', 'S256');
    authorizationUrl.searchParams.set('state', state);
    authorizationUrl.searchParams.set('resource', metadata.resource);

    const scopes = oauth.scopes ?? metadata.scopesSupported;
    if (scopes.length) {
      authorizationUrl.searchParams.set('scope', scopes.join(' '));
    }

    return {
      provider: provider.id,
      authorizationUrl: authorizationUrl.toString(),
    };
  }

  async exchangeAuthorizationCode(
    provider: McpProviderAdapter,
    code: string,
    stateValue: string,
    authorizationIssuer?: string,
  ): Promise<{ userId: string; credential: McpOAuthCredential }> {
    const oauth = this.requireOAuth(provider);
    const state = this.readAndValidateState(provider, stateValue);

    if (oauth.clientId && oauth.clientId !== state.clientId) {
      throw new BadRequestException({
        code: 'MCP_OAUTH_STATE_INVALID',
        message: 'OAuth client configuration changed during authorization',
      });
    }

    const metadata = await this.protocol.discoverAuthorizationServer(oauth);
    if (
      metadata.resource !== state.resource ||
      metadata.issuer !== state.issuer ||
      (authorizationIssuer !== undefined &&
        authorizationIssuer !== state.issuer)
    ) {
      throw this.invalidState();
    }
    const token = await this.protocol.exchangeAuthorizationCode(
      metadata.tokenEndpoint,
      {
        code,
        redirectUri: state.redirectUri,
        clientId: state.clientId,
        codeVerifier: state.codeVerifier,
        resource: metadata.resource,
        ...(state.clientSecret ?? oauth.clientSecret
          ? { clientSecret: state.clientSecret ?? oauth.clientSecret }
          : {}),
      },
    );

    return {
      userId: state.userId,
      credential: this.toCredential(
        token,
        state.dynamicClient
          ? {
              clientId: state.clientId,
              ...(state.clientSecret
                ? { clientSecret: state.clientSecret }
                : {}),
            }
          : undefined,
      ),
    };
  }

  async refreshCredential(
    provider: McpProviderAdapter,
    credential: McpOAuthCredential,
  ): Promise<McpOAuthCredential> {
    const oauth = this.requireOAuth(provider);
    const client = this.resolveRefreshClient(provider, oauth, credential);

    if (!credential.refreshToken) {
      throw new UnauthorizedException({
        code: 'MCP_OAUTH_RECONNECT_REQUIRED',
        message: `${provider.displayName} authorization must be reconnected`,
      });
    }

    const metadata = await this.protocol.discoverAuthorizationServer(oauth);
    const token = await this.protocol.refreshToken(metadata.tokenEndpoint, {
      refreshToken: credential.refreshToken,
      clientId: client.clientId,
      resource: metadata.resource,
      ...(client.clientSecret ? { clientSecret: client.clientSecret } : {}),
    });

    return this.toCredential(
      {
        ...token,
        refreshToken: token.refreshToken ?? credential.refreshToken,
        scope: token.scope ?? credential.scope,
      },
      client.dynamic
        ? {
            clientId: client.clientId,
            ...(client.clientSecret
              ? { clientSecret: client.clientSecret }
              : {}),
          }
        : undefined,
    );
  }

  callbackUri(providerId: string): string {
    const base = this.config.publicBaseUrl.replace(/\/+$/u, '');
    return `${base}/api/v1/mcp-connections/${encodeURIComponent(providerId)}/oauth/callback`;
  }

  private encodeState(state: OAuthStatePayload): string {
    return this.cipher.encrypt(JSON.stringify(state));
  }

  private readAndValidateState(
    provider: McpProviderAdapter,
    serialized: string,
  ): OAuthStatePayload {
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.cipher.decrypt(serialized));
    } catch {
      throw this.invalidState();
    }

    if (
      !isJsonObject(parsed) ||
      parsed.version !== 1 ||
      typeof parsed.provider !== 'string' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.codeVerifier !== 'string' ||
      typeof parsed.clientId !== 'string' ||
      ('clientSecret' in parsed &&
        parsed.clientSecret !== undefined &&
        typeof parsed.clientSecret !== 'string') ||
      ('dynamicClient' in parsed &&
        parsed.dynamicClient !== undefined &&
        typeof parsed.dynamicClient !== 'boolean') ||
      typeof parsed.redirectUri !== 'string' ||
      typeof parsed.issuer !== 'string' ||
      typeof parsed.resource !== 'string' ||
      typeof parsed.issuedAt !== 'number'
    ) {
      throw this.invalidState();
    }

    const state = parsed as OAuthStatePayload;
    if (
      state.provider !== provider.id ||
      state.redirectUri !== this.callbackUri(provider.id)
    ) {
      throw this.invalidState();
    }

    const ageMs = Date.now() - state.issuedAt;
    if (
      ageMs < 0 ||
      ageMs > this.config.mcpOAuthStateTtlSeconds * 1_000
    ) {
      throw new BadRequestException({
        code: 'MCP_OAUTH_STATE_EXPIRED',
        message: 'OAuth authorization state expired',
      });
    }

    return state;
  }

  private requireOAuth(provider: McpProviderAdapter): McpOAuthProviderConfig {
    if (provider.credential.kind !== 'oauth' || !provider.oauth) {
      throw new BadRequestException({
        code: 'MCP_OAUTH_NOT_SUPPORTED',
        message: `${provider.displayName} does not use OAuth`,
      });
    }
    return provider.oauth;
  }

  private async resolveAuthorizationClient(
    provider: McpProviderAdapter,
    oauth: McpOAuthProviderConfig,
    registrationEndpoint: string | undefined,
    redirectUri: string,
  ): Promise<OAuthClientRegistration> {
    if (oauth.clientId) {
      return {
        clientId: oauth.clientId,
        ...(oauth.clientSecret ? { clientSecret: oauth.clientSecret } : {}),
        dynamic: false,
      };
    }

    if (!oauth.dynamicClientRegistration) {
      throw new ServiceUnavailableException({
        code: 'MCP_OAUTH_CLIENT_NOT_CONFIGURED',
        message: `${provider.displayName} OAuth client is not configured for this Gateway`,
      });
    }
    if (!registrationEndpoint) {
      throw new ServiceUnavailableException({
        code: 'MCP_OAUTH_DYNAMIC_REGISTRATION_UNAVAILABLE',
        message: `${provider.displayName} does not advertise dynamic client registration`,
      });
    }

    const registration = await this.registration.register(
      registrationEndpoint,
      {
        clientName: oauth.dynamicClientRegistration.clientName,
        redirectUri,
        ...(oauth.dynamicClientRegistration.clientUri
          ? { clientUri: oauth.dynamicClientRegistration.clientUri }
          : {}),
      },
    );

    return {
      ...registration,
      dynamic: true,
    };
  }

  private resolveRefreshClient(
    provider: McpProviderAdapter,
    oauth: McpOAuthProviderConfig,
    credential: McpOAuthCredential,
  ): OAuthClientRegistration {
    if (oauth.clientId) {
      return {
        clientId: oauth.clientId,
        ...(oauth.clientSecret ? { clientSecret: oauth.clientSecret } : {}),
        dynamic: false,
      };
    }

    if (oauth.dynamicClientRegistration && credential.clientId) {
      return {
        clientId: credential.clientId,
        ...(credential.clientSecret
          ? { clientSecret: credential.clientSecret }
          : {}),
        dynamic: true,
      };
    }

    throw new UnauthorizedException({
      code: 'MCP_OAUTH_RECONNECT_REQUIRED',
      message: `${provider.displayName} authorization must be reconnected`,
    });
  }

  private toCredential(
    token: OAuthTokenPayload,
    dynamicClient?: { clientId: string; clientSecret?: string },
  ): McpOAuthCredential {
    return {
      kind: 'oauth',
      accessToken: token.accessToken,
      tokenType: 'Bearer',
      ...(token.refreshToken ? { refreshToken: token.refreshToken } : {}),
      ...(token.expiresAt ? { expiresAt: token.expiresAt } : {}),
      ...(token.scope ? { scope: token.scope } : {}),
      ...(dynamicClient
        ? {
            clientId: dynamicClient.clientId,
            ...(dynamicClient.clientSecret
              ? { clientSecret: dynamicClient.clientSecret }
              : {}),
          }
        : {}),
    };
  }

  private invalidState(): BadRequestException {
    return new BadRequestException({
      code: 'MCP_OAUTH_STATE_INVALID',
      message: 'OAuth authorization state is invalid',
    });
  }
}
