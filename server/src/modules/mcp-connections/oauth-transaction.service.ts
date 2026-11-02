import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';

/**
 * Short-lived OAuth transactions. The browser nonce returned by `begin` is
 * kept by the web app (sessionStorage on the web origin) and sent back with
 * the authenticated completion request, so the flow works when the web app
 * and the Gateway API are on different sites.
 */
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
