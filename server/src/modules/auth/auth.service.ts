import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';
import type { AppUser } from '@server/root/modules/auth/auth.types';
import { isOAuthClientToken } from '@server/root/modules/auth/oauth-token-claims';

type AppUserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  membership_tier: AppUser['membershipTier'];
  system_role: AppUser['systemRole'];
  status: AppUser['status'];
};

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Dashboard/REST authentication. OAuth access tokens issued to MCP clients
   * are rejected here so a connector cannot call account APIs (for example
   * create Gateway tokens); they are only valid on /api/v1/mcp.
   */
  async requireUser(request: Request): Promise<AppUser> {
    const token = this.readBearerToken(request);
    if (token && isOAuthClientToken(token)) {
      throw new UnauthorizedException({
        code: 'OAUTH_CLIENT_TOKEN_NOT_ALLOWED',
        message: 'MCP OAuth tokens can only be used with the MCP endpoint',
      });
    }
    return this.userFromToken(token);
  }

  /** Authenticates an MCP OAuth access token (claims checked by the caller). */
  requireMcpOAuthUser(token: string): Promise<AppUser> {
    return this.userFromToken(token);
  }

  private async userFromToken(token: string | null): Promise<AppUser> {
    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing user access token',
      });
    }

    const anon = this.supabase.createAnonClient();
    const { data, error } = await anon.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'User access token is invalid or expired',
      });
    }

    const client = this.supabase.createServiceRoleClient();
    const { data: row, error: profileError } = await client
      .from('app_users')
      .select('id,email,display_name,membership_tier,system_role,status')
      .eq('id', data.user.id)
      .maybeSingle<AppUserRow>();

    if (profileError) {
      throw new ServiceUnavailableException({
        code: 'AUTH_STORAGE_UNAVAILABLE',
        message: 'Account storage is unavailable',
      });
    }
    if (!row || row.status !== 'active') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Account is unavailable',
      });
    }

    return this.toUser(row);
  }

  async getUserById(userId: string): Promise<AppUser> {
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('app_users')
      .select('id,email,display_name,membership_tier,system_role,status')
      .eq('id', userId)
      .maybeSingle<AppUserRow>();
    if (error || !data || data.status !== 'active') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Gateway account is unavailable',
      });
    }
    return this.toUser(data);
  }

  private readBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
    return token.trim() || null;
  }

  private toUser(row: AppUserRow): AppUser {
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      membershipTier: row.membership_tier,
      systemRole: row.system_role,
      status: row.status,
    };
  }
}
