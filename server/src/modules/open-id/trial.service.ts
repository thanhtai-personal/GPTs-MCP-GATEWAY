import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Request } from 'express';
import { AuditService } from '@server/root/modules/audit/audit.service';
import { AuthService } from '@server/root/modules/auth/auth.service';
import { GatewayCredentialService } from '@server/root/modules/open-id/gateway-credential.service';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';

type TrialRow = {
  id: string;
  trial_claimed_at: string;
  expires_at: string;
};

@Injectable()
export class TrialService {
  constructor(
    private readonly auth: AuthService,
    private readonly audit: AuditService,
    private readonly credentials: GatewayCredentialService,
    private readonly supabase: SupabaseService,
  ) {}

  async status(request: Request) {
    const user = await this.auth.requireUser(request);
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('trial_entitlements')
      .select('id,trial_claimed_at,expires_at')
      .eq('user_id', user.id)
      .maybeSingle<TrialRow>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'TRIAL_STORAGE_UNAVAILABLE',
        message: 'Could not load trial status',
      });
    }

    if (!data) {
      return {
        status: user.membershipTier === 'guest' ? 'available' : 'not_applicable',
        claimedAt: null,
        expiresAt: null,
      };
    }

    return {
      status: data.expires_at > new Date().toISOString() ? 'active' : 'consumed',
      claimedAt: data.trial_claimed_at,
      expiresAt: data.expires_at,
    };
  }

  async claim(request: Request) {
    const user = await this.auth.requireUser(request);
    if (user.membershipTier !== 'guest') {
      throw new BadRequestException({
        code: 'TRIAL_GUEST_ONLY',
        message: 'Trial is only available to guest accounts',
      });
    }

    const openId = `oid_trial_${randomBytes(16).toString('base64url')}`;
    const token = this.credentials.createRawToken('trial', openId);
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client.rpc('claim_gateway_trial', {
      p_user_id: user.id,
      p_open_id: openId,
      p_token_hash: token.tokenHash,
      p_token_prefix: token.tokenPrefix,
    });

    if (error) {
      const message = `${error.message ?? ''} ${error.details ?? ''}`;
      if (message.includes('TRIAL_ALREADY_USED')) {
        throw new BadRequestException({
          code: 'TRIAL_ALREADY_USED',
          message: 'This account has already used its trial',
        });
      }
      throw new ServiceUnavailableException({
        code: 'TRIAL_STORAGE_UNAVAILABLE',
        message: 'Could not create trial',
      });
    }

    const row = Array.isArray(data) ? data[0] : data;
    await this.audit.write({
      userId: user.id,
      eventType: 'trial.claimed',
      credentialId: row?.credential_id ?? null,
      success: true,
      metadata: { expiresAt: row?.trial_expires_at ?? null },
    });

    return {
      accessToken: token.rawToken,
      tokenPrefix: token.tokenPrefix,
      expiresAt: row?.trial_expires_at ?? null,
      notice: 'This token is shown once. Store it in your GPT Action authentication.',
    };
  }
}
