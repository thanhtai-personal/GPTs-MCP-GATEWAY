import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { SecretCipherService } from '@server/root/common/security/secret-cipher.service';
import { AuthService } from '@server/root/modules/auth/auth.service';
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';
import { OAuthTransactionService } from '@server/root/modules/mcp-connections/oauth-transaction.service';
import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import type { McpOAuthCredential } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

type FacebookOAuthState = { version: 1; userId: string; transactionId: string; issuedAt: number };

@Injectable()
export class FacebookOAuthService {
  constructor(private readonly auth: AuthService, private readonly cipher: SecretCipherService,
    private readonly config: AppConfigService, private readonly connections: McpConnectionsService,
    private readonly transactions: OAuthTransactionService) {}

  async start(request: Request) {
    const user = await this.auth.requireUser(request);
    const transaction = await this.transactions.begin(user.id, 'facebook');
    const state = this.cipher.encrypt(JSON.stringify({
      version: 1, userId: user.id, transactionId: transaction.id, issuedAt: Date.now(),
    } satisfies FacebookOAuthState));
    const url = new URL('https://www.facebook.com/' + this.config.metaGraphApiVersion + '/dialog/oauth');
    url.searchParams.set('client_id', this.requireConfig(this.config.metaAppId, 'META_APP_ID'));
    url.searchParams.set('redirect_uri', this.callbackUri());
    url.searchParams.set('config_id', this.requireConfig(this.config.metaFacebookLoginConfigId, 'META_FACEBOOK_LOGIN_CONFIG_ID'));
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('override_default_response_type', 'true');
    url.searchParams.set('state', state);
    return { provider: 'facebook', authorizationUrl: url.toString(), browserNonce: transaction.browserNonce };
  }

  async complete(code: string, stateValue: string, browserNonce: string | undefined, authenticatedUserId: string) {
    const state = this.readState(stateValue);
    if (state.userId !== authenticatedUserId) throw this.invalidState();
    await this.transactions.consume(state.transactionId, state.userId, 'facebook', browserNonce);
    await this.auth.getUserById(state.userId);
    const credential = await this.exchangeCode(code);
    const connection = await this.connections.connectFacebookCredential(state.userId, credential);
    return { connection };
  }

  callbackUri(): string {
    return this.config.publicBaseUrl.replace(/\/+$/u, '') + '/api/v1/mcp-connections/facebook/oauth/callback';
  }

  private async exchangeCode(code: string): Promise<McpOAuthCredential> {
    let response: Response;
    try {
      response = await fetch('https://graph.facebook.com/' + this.config.metaGraphApiVersion + '/oauth/access_token', {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.requireConfig(this.config.metaAppId, 'META_APP_ID'),
          client_secret: this.requireConfig(this.config.metaAppSecret, 'META_APP_SECRET'),
          redirect_uri: this.callbackUri(), code,
        }),
        signal: AbortSignal.timeout(this.config.upstreamTimeoutMs),
      });
    } catch (error) {
      throw new ServiceUnavailableException({ code: 'FACEBOOK_OAUTH_UNAVAILABLE', message: 'Meta OAuth token endpoint is unavailable',
        details: { cause: error instanceof Error ? error.name : 'network_error' } });
    }
    const payload = await this.readJson(response);
    if (!response.ok) throw new UnauthorizedException({ code: 'FACEBOOK_OAUTH_EXCHANGE_FAILED',
      message: 'Facebook authorization could not be completed', details: { status: response.status } });
    if (typeof payload.access_token !== 'string' || !payload.access_token) {
      throw new BadGatewayException({ code: 'FACEBOOK_OAUTH_INVALID_TOKEN_RESPONSE', message: 'Meta OAuth returned an invalid token response' });
    }
    return { kind: 'oauth', accessToken: payload.access_token, tokenType: 'Bearer',
      ...(typeof payload.expires_in === 'number' && Number.isFinite(payload.expires_in)
        ? { expiresAt: new Date(Date.now() + payload.expires_in * 1000).toISOString() } : {}),
      ...(typeof payload.scope === 'string' ? { scope: payload.scope } : {}) };
  }

  private readState(serialized: string): FacebookOAuthState {
    let parsed: unknown;
    try { parsed = JSON.parse(this.cipher.decrypt(serialized)); } catch { throw this.invalidState(); }
    if (!isJsonObject(parsed) || parsed.version !== 1 || typeof parsed.userId !== 'string' ||
      typeof parsed.transactionId !== 'string' || typeof parsed.issuedAt !== 'number') throw this.invalidState();
    const state = parsed as FacebookOAuthState;
    const age = Date.now() - state.issuedAt;
    if (age < 0 || age > this.config.mcpOAuthStateTtlSeconds * 1000) {
      throw new BadRequestException({ code: 'MCP_OAUTH_STATE_EXPIRED', message: 'Facebook OAuth authorization state expired' });
    }
    return state;
  }

  private async readJson(response: Response): Promise<Record<string, unknown>> {
    try { const value: unknown = await response.json(); return isJsonObject(value) ? value : {}; } catch { return {}; }
  }

  private requireConfig(value: string | undefined, name: string): string {
    if (!value) throw new ServiceUnavailableException({ code: 'FACEBOOK_OAUTH_NOT_CONFIGURED', message: name + ' must be configured on Gateway' });
    return value;
  }

  private invalidState(): BadRequestException {
    return new BadRequestException({ code: 'MCP_OAUTH_STATE_INVALID', message: 'Facebook OAuth state is invalid or belongs to another account' });
  }
}
