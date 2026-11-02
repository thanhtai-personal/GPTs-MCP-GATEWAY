import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { AuthService } from '@server/root/modules/auth/auth.service';

const AUTHORIZATION_ID = /^[A-Za-z0-9_-]{1,128}$/u;

/**
 * Consent backend for the Supabase OAuth 2.1 server. The web page
 * /oauth/consent calls these endpoints with the signed-in user's session;
 * the server forwards to Supabase and refuses clients whose redirect target
 * is not an allowlisted HTTPS host (ChatGPT, Claude, ...).
 */
@Injectable()
export class OAuthAuthorizationService {
  constructor(
    private readonly config: AppConfigService,
    private readonly auth: AuthService,
  ) {}

  async details(request: Request, authorizationId: string): Promise<unknown> {
    await this.auth.requireUser(request);
    const payload = await this.call(request, this.id(authorizationId), 'GET');
    this.assertAllowedClient(payload);
    return payload;
  }

  async decide(
    request: Request,
    authorizationId: string,
    action: 'approve' | 'deny',
  ): Promise<unknown> {
    await this.auth.requireUser(request);
    const id = this.id(authorizationId);
    if (action === 'approve') {
      this.assertAllowedClient(await this.call(request, id, 'GET'));
    }
    return this.call(request, `${id}/consent`, 'POST', { action });
  }

  private id(value: string): string {
    if (!AUTHORIZATION_ID.test(value)) {
      throw new BadRequestException({
        code: 'OAUTH_AUTHORIZATION_INVALID',
        message: 'Invalid authorization_id',
      });
    }
    return value;
  }

  private assertAllowedClient(payload: unknown): void {
    const record =
      payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : {};
    const candidate =
      typeof record.redirect_uri === 'string'
        ? record.redirect_uri
        : typeof record.redirect_url === 'string'
          ? record.redirect_url
          : null;
    if (!candidate || !this.isAllowedRedirect(candidate)) {
      throw new BadRequestException({
        code: 'OAUTH_CLIENT_REDIRECT_NOT_ALLOWED',
        message: 'This OAuth client redirect target is not allowed',
      });
    }
  }

  private isAllowedRedirect(value: string): boolean {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return false;
      const hostname = url.hostname.toLowerCase();
      return this.config.mcpOAuthAllowedRedirectHosts.some(
        (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
      );
    } catch {
      return false;
    }
  }

  private async call(
    request: Request,
    path: string,
    method: 'GET' | 'POST',
    body?: Record<string, unknown>,
  ): Promise<unknown> {
    const token = request.headers.authorization?.replace(/^Bearer\s+/iu, '') ?? '';
    let response: Response;
    try {
      response = await fetch(
        `${this.config.supabaseOAuthIssuerUrl}/oauth/authorizations/${path}`,
        {
          method,
          headers: {
            apikey: this.config.supabaseAnonKey,
            Authorization: `Bearer ${token}`,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(this.config.upstreamTimeoutMs),
        },
      );
    } catch {
      throw new ServiceUnavailableException({
        code: 'OAUTH_SERVER_UNAVAILABLE',
        message: 'Supabase OAuth server is unavailable',
      });
    }
    const payload = (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!response.ok) {
      throw new BadRequestException({
        code: 'OAUTH_AUTHORIZATION_FAILED',
        message:
          typeof payload?.message === 'string'
            ? payload.message
            : typeof payload?.msg === 'string'
              ? payload.msg
              : 'OAuth authorization request failed',
      });
    }
    return payload;
  }
}
