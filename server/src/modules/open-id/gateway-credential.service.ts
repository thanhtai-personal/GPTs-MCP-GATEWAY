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

/** Principal allowed to execute MCP tools: Gateway token or MCP OAuth session. */
export type ExecutionPrincipal = Omit<GatewayPrincipal, 'credentialId'> & {
  credentialId: string | null;
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
   * Entitlement for an MCP OAuth session (no Gateway token involved): the
   * user's active Open ID, preferring a paid one for members, else an
   * unexpired trial. Same rules as `authenticate`.
   */
  async principalForUser(user: AppUser): Promise<ExecutionPrincipal> {
    const now = new Date().toISOString();
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('open_ids')
      .select('id,user_id,open_id,kind,is_exportable,status,expires_at,revoked_at,created_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .returns<OpenIdRow[]>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'OPEN_ID_STORAGE_UNAVAILABLE',
        message: 'Open ID storage is unavailable',
      });
    }
    const usable = (data ?? []).filter(
      (row) =>
        (!row.expires_at || row.expires_at > now) &&
        (row.kind === 'trial' || user.membershipTier === 'member'),
    );
    const openId =
      usable.find((row) => row.kind === 'paid') ??
      usable.find((row) => row.kind === 'trial');
    if (!openId) {
      throw new ForbiddenException({
        code: 'OPEN_ID_REQUIRED',
        message:
          'An active Open ID is required. Start the trial or activate membership in the Gateway web app.',
      });
    }
    return {
      credentialId: null,
      openIdId: openId.id,
      openId: openId.open_id,
      user,
      kind: openId.kind,
    };
  }

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
