import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';
import { AuthService } from '@server/root/modules/auth/auth.service';
import type { AppUser } from '@server/root/modules/auth/auth.types';

type CredentialRow = {
  id: string;
  user_id: string;
  open_id_id: string;
  label: string | null;
  token_prefix: string;
  expires_at: string | null;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

type OpenIdRow = {
  id: string;
  user_id: string;
  open_id: string;
  kind: 'trial' | 'paid';
  is_exportable: boolean;
  status: 'active' | 'revoked';
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type GatewayPrincipal = {
  credentialId: string;
  openIdId: string;
  openId: string;
  user: AppUser;
  kind: 'trial' | 'paid';
};

/**
 * Principal allowed to execute MCP tools: a Gateway token (Custom GPT, always
 * bound to an Open ID) or an MCP plugin OAuth session (account entitlement).
 */
export type ExecutionPrincipal = {
  credentialId: string | null;
  openIdId: string | null;
  openId: string | null;
  user: AppUser;
  kind: 'trial' | 'paid' | 'member';
};

@Injectable()
export class GatewayCredentialService {
  constructor(
    private readonly auth: AuthService,
    private readonly supabase: SupabaseService,
  ) {}

  createRawToken(kind: 'trial' | 'paid', openId: string) {
    const prefix = kind === 'trial' ? 'mcp_trial_' : 'mcp_gw_';
    const rawToken = `${prefix}${openId}_${randomBytes(32).toString('base64url')}`;
    return {
      rawToken,
      tokenHash: this.hashToken(rawToken),
      tokenPrefix: `${rawToken.slice(0, 30)}…`,
    };
  }

  async authenticate(rawToken: string): Promise<GatewayPrincipal> {
    const now = new Date().toISOString();
    const client = this.supabase.createServiceRoleClient();
    const { data: credential, error } = await client
      .from('gateway_credentials')
      .select('id,user_id,open_id_id,label,token_prefix,expires_at,revoked_at,last_used_at,created_at')
      .eq('token_hash', this.hashToken(rawToken))
      .is('revoked_at', null)
      .maybeSingle<CredentialRow>();

    if (error) {
      throw new ServiceUnavailableException({
        code: 'GATEWAY_AUTH_STORAGE_UNAVAILABLE',
        message: 'Gateway credential storage is unavailable',
      });
    }
    if (!credential) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Gateway token is invalid or revoked',
      });
    }
    if (credential.expires_at && credential.expires_at <= now) {
      throw new UnauthorizedException({
        code: 'TOKEN_EXPIRED',
        message: 'Gateway token has expired',
      });
    }

    const { data: openId, error: openIdError } = await client
      .from('open_ids')
      .select('id,user_id,open_id,kind,is_exportable,status,expires_at,revoked_at,created_at')
      .eq('id', credential.open_id_id)
      .maybeSingle<OpenIdRow>();
    if (openIdError) {
      throw new ServiceUnavailableException({
        code: 'OPEN_ID_STORAGE_UNAVAILABLE',
        message: 'Open ID storage is unavailable',
      });
    }
    if (
      !openId ||
      openId.status !== 'active' ||
      openId.revoked_at ||
      (openId.expires_at && openId.expires_at <= now)
    ) {
      throw new UnauthorizedException({
        code: 'OPEN_ID_REQUIRED',
        message: 'An active Open ID is required to use MCP Gateway',
      });
    }

    const user = await this.auth.getUserById(credential.user_id);
    if (openId.kind === 'paid' && user.membershipTier !== 'member') {
      throw new UnauthorizedException({
        code: 'OPEN_ID_REQUIRED',
        message: 'A member Open ID is required to use MCP Gateway',
      });
    }

    const { data: usedRow, error: usageError } = await client
      .from('gateway_credentials')
      .update({ last_used_at: now })
      .eq('id', credential.id)
      .is('revoked_at', null)
      .select('id')
      .maybeSingle<{ id: string }>();
    if (usageError || !usedRow) {
      throw new ServiceUnavailableException({
        code: 'GATEWAY_AUTH_STORAGE_UNAVAILABLE',
        message: 'Could not record Gateway credential usage',
      });
    }

    return {
      credentialId: credential.id,
      openIdId: openId.id,
      openId: openId.open_id,
      user,
      kind: openId.kind,
    };
  }

  /**
   * Entitlement for an MCP plugin (OAuth) session. Open IDs belong to the
   * Custom GPT Action flow; plugin access is decided by the account itself:
   * members are always allowed, guests while their one-time trial is active.
   */
  async principalForUser(user: AppUser): Promise<ExecutionPrincipal> {
    if (user.membershipTier === 'member') {
      return { credentialId: null, openIdId: null, openId: null, user, kind: 'member' };
    }

    const now = new Date().toISOString();
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('open_ids')
      .select('id,user_id,open_id,kind,is_exportable,status,expires_at,revoked_at,created_at')
      .eq('user_id', user.id)
      .eq('kind', 'trial')
      .eq('status', 'active')
      .is('revoked_at', null)
      .gt('expires_at', now)
      .limit(1)
      .maybeSingle<OpenIdRow>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'ENTITLEMENT_STORAGE_UNAVAILABLE',
        message: 'Account entitlement storage is unavailable',
      });
    }
    if (!data) {
      throw new ForbiddenException({
        code: 'MEMBERSHIP_REQUIRED',
        message:
          'This MCP Gateway account needs member access or an active trial. Upgrade to member or start the 7-day trial in the Gateway web app.',
      });
    }
    return { credentialId: null, openIdId: data.id, openId: data.open_id, user, kind: 'trial' };
  }

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
