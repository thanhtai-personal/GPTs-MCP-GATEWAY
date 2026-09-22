import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';
import { AuthService } from '@server/root/modules/auth/auth.service';

type LocalAgentManagementRow = {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'revoked';
  tools: unknown;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class LocalAgentManagementService {
  private readonly onlineWindowMs = 90_000;

  constructor(
    private readonly auth: AuthService,
    private readonly supabase: SupabaseService,
  ) {}

  async listOwn(request: Request) {
    const user = await this.auth.requireUser(request);
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('local_agents')
      .select('id,name,status,tools,last_seen_at,created_at,updated_at')
      .eq('user_id', user.id)
      .order('last_seen_at', { ascending: false })
      .returns<LocalAgentManagementRow[]>();

    if (error) {
      throw new ServiceUnavailableException({
        code: 'LOCAL_AGENT_STORAGE_UNAVAILABLE',
        message: 'Could not load local agents',
      });
    }

    const onlineCutoff = Date.now() - this.onlineWindowMs;
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      status:
        row.status === 'revoked'
          ? 'revoked'
          : new Date(row.last_seen_at).getTime() >= onlineCutoff
            ? 'online'
            : 'offline',
      toolCount: Array.isArray(row.tools) ? row.tools.length : 0,
      toolNames: Array.isArray(row.tools)
        ? row.tools
            .map((tool) =>
              typeof tool === 'object' && tool !== null && 'name' in tool && typeof tool.name === 'string'
                ? tool.name
                : null,
            )
            .filter((name): name is string => Boolean(name))
        : [],
      lastSeenAt: row.last_seen_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async revokeOwn(request: Request, agentId: string) {
    const user = await this.auth.requireUser(request);
    const now = new Date().toISOString();
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('local_agents')
      .update({ status: 'revoked', updated_at: now })
      .eq('id', agentId)
      .eq('user_id', user.id)
      .neq('status', 'revoked')
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new ServiceUnavailableException({
        code: 'LOCAL_AGENT_STORAGE_UNAVAILABLE',
        message: 'Could not revoke local agent',
      });
    }
    if (!data) {
      throw new NotFoundException({
        code: 'LOCAL_AGENT_NOT_FOUND',
        message: 'Local agent was not found or is already revoked',
      });
    }

    await client
      .from('local_agent_jobs')
      .update({ status: 'expired' })
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .in('status', ['pending', 'claimed']);

    return { revoked: true };
  }
}
