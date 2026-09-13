import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';

@Injectable()
export class OAuthTransactionService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: AppConfigService,
  ) {}

  async begin(userId: string, provider: string) {
    const id = randomUUID();
    const browserNonce = randomBytes(32).toString('base64url');
    const client = this.supabase.createServiceRoleClient();
    const now = new Date();
    await client
      .from('mcp_oauth_transactions')
      .delete()
      .lt('expires_at', now.toISOString());
    const { error } = await client.from('mcp_oauth_transactions').insert({
      id,
      user_id: userId,
      provider,
      browser_nonce_hash: this.hash(browserNonce),
      expires_at: new Date(
        now.getTime() + this.config.mcpOAuthStateTtlSeconds * 1_000,
      ).toISOString(),
    });
    if (error) throw this.storageUnavailable();
    return { id, browserNonce };
  }

  async consume(
    id: string,
    userId: string,
    provider: string,
    browserNonce: string | undefined,
  ): Promise<void> {
    if (!browserNonce || !/^[A-Za-z0-9_-]{43}$/u.test(browserNonce)) {
      throw this.invalidState();
    }
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('mcp_oauth_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('browser_nonce_hash', this.hash(browserNonce))
      .gt('expires_at', new Date().toISOString())
      .select('id')
      .maybeSingle<{ id: string }>();
    if (error) throw this.storageUnavailable();
    if (!data) throw this.invalidState();
  }

  setBrowserCookie(response: Response, provider: string, nonce: string): void {
    response.cookie(this.cookieName(provider), nonce, {
      httpOnly: true,
      secure: this.secureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: this.config.mcpOAuthStateTtlSeconds * 1_000,
    });
  }

  readBrowserCookie(request: Request, provider: string): string | undefined {
    const name = this.cookieName(provider);
    const values = (request.headers.cookie ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.startsWith(`${name}=`))
      .map((part) => part.slice(name.length + 1));
    return values.length === 1 ? values[0] : undefined;
  }

  clearBrowserCookie(response: Response, provider: string): void {
    response.clearCookie(this.cookieName(provider), {
      httpOnly: true,
      secure: this.secureCookie,
      sameSite: 'lax',
      path: '/',
    });
  }

  private get secureCookie(): boolean {
    return new URL(this.config.publicBaseUrl).protocol === 'https:';
  }

  private cookieName(provider: string): string {
    if (!/^[a-z0-9-]+$/u.test(provider)) throw this.invalidState();
    const prefix = this.secureCookie ? '__Host-' : '';
    return `${prefix}mcp-oauth-${provider}`;
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private invalidState(): BadRequestException {
    return new BadRequestException({
      code: 'MCP_OAUTH_STATE_INVALID',
      message: 'OAuth authorization state is invalid or already used',
    });
  }

  private storageUnavailable(): ServiceUnavailableException {
    return new ServiceUnavailableException({
      code: 'MCP_OAUTH_STORAGE_UNAVAILABLE',
      message: 'OAuth transaction storage is unavailable',
    });
  }
}
