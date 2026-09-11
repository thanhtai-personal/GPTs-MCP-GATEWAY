import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Request } from 'express';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';
import { AuditService } from '@server/root/modules/audit/audit.service';
import { AuthService } from '@server/root/modules/auth/auth.service';
import type { CreateGatewayTokenDto } from '@server/root/modules/open-id/dto/create-gateway-token.dto';
import type { CreateOpenIdDto } from '@server/root/modules/open-id/dto/create-open-id.dto';
import { GatewayCredentialService } from '@server/root/modules/open-id/gateway-credential.service';

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

@Injectable()
export class OpenIdService {
  constructor(
    private readonly auth: AuthService,
    private readonly audit: AuditService,
    private readonly credentials: GatewayCredentialService,
    private readonly supabase: SupabaseService,
  ) {}

  async listOwn(request: Request) {
    const user = await this.auth.requireUser(request);
    if (user.membershipTier !== 'member') return [];
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('open_ids')
      .select('id,user_id,open_id,kind,is_exportable,status,expires_at,revoked_at,created_at')
      .eq('user_id', user.id)
      .eq('kind', 'paid')
      .order('created_at', { ascending: false })
      .returns<OpenIdRow[]>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'OPEN_ID_STORAGE_UNAVAILABLE',
        message: 'Could not load Open IDs',
      });
    }
    return data ?? [];
  }

  async createPaid(request: Request, _dto: CreateOpenIdDto) {
    const user = await this.auth.requireUser(request);
    if (user.membershipTier !== 'member') {
      throw new BadRequestException({
        code: 'MEMBERSHIP_REQUIRED',
        message: 'Member access is required to create an Open ID',
      });
    }
    const client = this.supabase.createServiceRoleClient();
    const existing = await this.findPaidOpenId(user.id);
    if (existing) return existing;

    const openId = `oid_${randomBytes(18).toString('base64url')}`;
    const { data, error } = await client
      .from('open_ids')
      .insert({
        user_id: user.id,
        open_id: openId,
        kind: 'paid',
        is_exportable: true,
        status: 'active',
      })
      .select('id,user_id,open_id,kind,is_exportable,status,expires_at,revoked_at,created_at')
      .single<OpenIdRow>();
    if (error) {
      if (error.code === '23505') {
        const concurrent = await this.findPaidOpenId(user.id);
        if (concurrent) return concurrent;
      }
      throw new ServiceUnavailableException({
        code: 'OPEN_ID_STORAGE_UNAVAILABLE',
        message: 'Could not create Open ID',
      });
    }
    await this.audit.write({
      userId: user.id,
      eventType: 'open_id.created',
      success: true,
      metadata: { openId: data.open_id },
    });
    return data;
  }

  async createToken(
    request: Request,
    openIdId: string,
    dto: CreateGatewayTokenDto,
  ) {
    const user = await this.auth.requireUser(request);
    if (user.membershipTier !== 'member') {
      throw new BadRequestException({
        code: 'MEMBERSHIP_REQUIRED',
        message: 'Member access is required to create Gateway tokens',
      });
    }
    const openId = await this.requirePaidOpenId(user.id, openIdId);
    const token = this.credentials.createRawToken('paid', openId.open_id);
    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 86_400_000).toISOString()
      : null;
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('gateway_credentials')
      .insert({
        user_id: user.id,
        open_id_id: openId.id,
        label: dto.label?.trim() || null,
        token_hash: token.tokenHash,
        token_prefix: token.tokenPrefix,
        expires_at: expiresAt,
      })
      .select('id,user_id,open_id_id,label,token_prefix,expires_at,revoked_at,last_used_at,created_at')
      .single<CredentialRow>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'GATEWAY_TOKEN_STORAGE_UNAVAILABLE',
        message: 'Could not create Gateway token',
      });
    }
    await this.audit.write({
      userId: user.id,
      credentialId: data.id,
      eventType: 'gateway_token.created',
      success: true,
      metadata: { openId: openId.open_id },
    });
    return {
      ...data,
      accessToken: token.rawToken,
      notice: 'This token is shown once. Store it in your GPT Action authentication.',
    };
  }

  async listTokens(request: Request, openIdId: string) {
    const user = await this.auth.requireUser(request);
    if (user.membershipTier !== 'member') {
      throw new BadRequestException({
        code: 'MEMBERSHIP_REQUIRED',
        message: 'Member access is required to manage Gateway tokens',
      });
    }
    await this.requirePaidOpenId(user.id, openIdId);
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('gateway_credentials')
      .select('id,user_id,open_id_id,label,token_prefix,expires_at,revoked_at,last_used_at,created_at')
      .eq('user_id', user.id)
      .eq('open_id_id', openIdId)
      .order('created_at', { ascending: false })
      .returns<CredentialRow[]>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'GATEWAY_TOKEN_STORAGE_UNAVAILABLE',
        message: 'Could not load Gateway tokens',
      });
    }
    return data ?? [];
  }

  async revokeToken(request: Request, openIdId: string, tokenId: string) {
    const user = await this.auth.requireUser(request);
    await this.requirePaidOpenId(user.id, openIdId);
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('gateway_credentials')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', tokenId)
      .eq('user_id', user.id)
      .eq('open_id_id', openIdId)
      .is('revoked_at', null)
      .select('id')
      .maybeSingle<{ id: string }>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'GATEWAY_TOKEN_STORAGE_UNAVAILABLE',
        message: 'Could not revoke Gateway token',
      });
    }
    if (!data) {
      throw new NotFoundException({
        code: 'GATEWAY_TOKEN_NOT_FOUND',
        message: 'Gateway token was not found or is already revoked',
      });
    }
    await this.audit.write({
      userId: user.id,
      credentialId: tokenId,
      eventType: 'gateway_token.revoked',
      success: true,
    });
    return { revoked: true };
  }

  private async findPaidOpenId(userId: string): Promise<OpenIdRow | null> {
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('open_ids')
      .select('id,user_id,open_id,kind,is_exportable,status,expires_at,revoked_at,created_at')
      .eq('user_id', userId)
      .eq('kind', 'paid')
      .eq('status', 'active')
      .maybeSingle<OpenIdRow>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'OPEN_ID_STORAGE_UNAVAILABLE',
        message: 'Could not load Open ID',
      });
    }
    return data;
  }

  private async requirePaidOpenId(userId: string, openIdId: string) {
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('open_ids')
      .select('id,user_id,open_id,kind,is_exportable,status,expires_at,revoked_at,created_at')
      .eq('id', openIdId)
      .eq('user_id', userId)
      .eq('kind', 'paid')
      .eq('status', 'active')
      .maybeSingle<OpenIdRow>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'OPEN_ID_STORAGE_UNAVAILABLE',
        message: 'Could not load Open ID',
      });
    }
    if (!data) {
      throw new NotFoundException({
        code: 'OPEN_ID_NOT_FOUND',
        message: 'Open ID was not found',
      });
    }
    return data;
  }
}
