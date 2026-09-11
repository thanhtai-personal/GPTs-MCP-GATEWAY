import { Injectable } from '@nestjs/common';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';

export type AuditEventInput = {
  userId?: string | null;
  credentialId?: string | null;
  eventType: string;
  provider?: string | null;
  operation?: string | null;
  success?: boolean | null;
  errorCode?: string | null;
  durationMs?: number | null;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(private readonly supabase: SupabaseService) {}

  async write(input: AuditEventInput): Promise<void> {
    const client = this.supabase.createServiceRoleClient();
    const { error } = await client.from('gateway_audit_events').insert({
      user_id: input.userId ?? null,
      credential_id: input.credentialId ?? null,
      event_type: input.eventType,
      provider: input.provider ?? null,
      operation: input.operation ?? null,
      success: input.success ?? null,
      error_code: input.errorCode ?? null,
      duration_ms: input.durationMs ?? null,
      metadata: input.metadata ?? {},
    });
    if (error) {
      console.error('[audit-write-failed]', {
        eventType: input.eventType,
        code: error.code,
      });
    }
  }
}
