import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { Request } from 'express';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';
import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import type {
  McpToolArguments,
  McpToolCallResult,
  McpToolDefinition,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
import type { GatewayPrincipal } from '@server/root/modules/open-id/gateway-credential.service';
import {
  LOCAL_PC_SERVICE_ID,
  type CompleteLocalAgentJobInput,
  type LocalAgentTool,
  type RegisterLocalAgentInput,
} from '@server/root/modules/local-agent/local-agent.types';

type LocalAgentRow = {
  id: string;
  user_id: string;
  name: string;
  token_hash: string;
  status: 'online' | 'offline' | 'revoked';
  tools: unknown;
  last_seen_at: string;
};

type LocalAgentJobRow = {
  id: string;
  status: 'pending' | 'claimed' | 'completed' | 'failed' | 'expired';
  result: unknown;
  error_message: string | null;
};

@Injectable()
export class LocalAgentService {
  private readonly onlineWindowMs = 90_000;
  private readonly callTimeoutMs = 25_000;

  constructor(private readonly supabase: SupabaseService) {}

  async register(
    principal: GatewayPrincipal,
    inputValue: unknown,
  ): Promise<{ agentId: string; agentToken: string; service: string }> {
    const input = this.parseRegistration(inputValue);
    const token = `lap_${randomBytes(32).toString('base64url')}`;
    const now = new Date().toISOString();
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('local_agents')
      .upsert(
        {
          user_id: principal.user.id,
          name: input.name,
          token_hash: this.hashToken(token),
          status: 'online',
          tools: input.tools,
          last_seen_at: now,
          updated_at: now,
        },
        { onConflict: 'user_id,name' },
      )
      .select('id')
      .single<{ id: string }>();

    if (error || !data) {
      throw new ServiceUnavailableException({
        code: 'LOCAL_AGENT_STORAGE_UNAVAILABLE',
        message: 'Could not register local agent',
      });
    }

    return { agentId: data.id, agentToken: token, service: LOCAL_PC_SERVICE_ID };
  }

  async poll(request: Request) {
    const agent = await this.authenticateAgent(request);
    const now = new Date().toISOString();
    const client = this.supabase.createServiceRoleClient();
    await client
      .from('local_agents')
      .update({ status: 'online', last_seen_at: now, updated_at: now })
      .eq('id', agent.id);

    const { data, error } = await client.rpc('claim_local_agent_job', {
      p_agent_id: agent.id,
    });
    if (error) {
      throw new ServiceUnavailableException({
        code: 'LOCAL_AGENT_JOB_STORAGE_UNAVAILABLE',
        message: 'Could not poll local agent jobs',
      });
    }

    const row = Array.isArray(data) ? data[0] : undefined;
    return row
      ? {
          job: {
            id: String(row.id),
            toolName: String(row.tool_name),
            arguments: isJsonObject(row.arguments) ? row.arguments : {},
            expiresAt: String(row.expires_at),
          },
        }
      : { job: null };
  }

  async complete(request: Request, jobId: string, inputValue: unknown) {
    const agent = await this.authenticateAgent(request);
    const input = this.parseCompletion(inputValue);
    const now = new Date().toISOString();
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('local_agent_jobs')
      .update({
        status: input.result.isError ? 'failed' : 'completed',
        result: input.result,
        error_message: input.result.isError
          ? 'Local MCP tool returned an error'
          : null,
        completed_at: now,
      })
      .eq('id', jobId)
      .eq('agent_id', agent.id)
      .eq('status', 'claimed')
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new ServiceUnavailableException({
        code: 'LOCAL_AGENT_JOB_STORAGE_UNAVAILABLE',
        message: 'Could not complete local agent job',
      });
    }
    if (!data) {
      throw new NotFoundException({
        code: 'LOCAL_AGENT_JOB_NOT_FOUND',
        message: 'Local agent job was not found or is no longer claimable',
      });
    }

    return { completed: true };
  }

  async hasConnectedAgent(userId: string): Promise<boolean> {
    try {
      return Boolean(await this.findActiveAgent(userId));
    } catch (error) {
      if (error instanceof ServiceUnavailableException) return false;
      throw error;
    }
  }

  async listTools(userId: string): Promise<McpToolDefinition[]> {
    const agent = await this.requireActiveAgent(userId);
    return this.parseStoredTools(agent.tools);
  }

  async callTool(
    userId: string,
    toolName: string,
    argumentsValue: McpToolArguments,
  ): Promise<McpToolCallResult> {
    const agent = await this.requireActiveAgent(userId);
    const tools = this.parseStoredTools(agent.tools);
    if (!tools.some((tool) => tool.name === toolName)) {
      throw new NotFoundException({
        code: 'MCP_TOOL_NOT_FOUND',
        message: `MCP tool not found: ${toolName}`,
      });
    }

    const expiresAt = new Date(Date.now() + this.callTimeoutMs).toISOString();
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('local_agent_jobs')
      .insert({
        user_id: userId,
        agent_id: agent.id,
        tool_name: toolName,
        arguments: argumentsValue,
        expires_at: expiresAt,
      })
      .select('id')
      .single<{ id: string }>();
    if (error || !data) {
      throw new ServiceUnavailableException({
        code: 'LOCAL_AGENT_JOB_STORAGE_UNAVAILABLE',
        message: 'Could not queue local MCP tool call',
      });
    }

    const deadline = Date.now() + this.callTimeoutMs;
    while (Date.now() < deadline) {
      const { data: job, error: readError } = await client
        .from('local_agent_jobs')
        .select('id,status,result,error_message')
        .eq('id', data.id)
        .single<LocalAgentJobRow>();
      if (readError) break;
      if (job.status === 'completed' || job.status === 'failed') {
        if (!isJsonObject(job.result)) {
          throw new ServiceUnavailableException({
            code: 'LOCAL_AGENT_RESULT_INVALID',
            message: 'Local agent returned an invalid MCP result',
          });
        }
        return job.result as McpToolCallResult;
      }
      if (job.status === 'expired') break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    await client
      .from('local_agent_jobs')
      .update({ status: 'expired' })
      .eq('id', data.id)
      .in('status', ['pending', 'claimed']);

    throw new ServiceUnavailableException({
      code: 'LOCAL_AGENT_TIMEOUT',
      message: 'Local PC did not complete the MCP tool call in time',
    });
  }

  private async authenticateAgent(request: Request): Promise<LocalAgentRow> {
    const token = this.readBearerToken(request);
    if (!token) {
      throw new UnauthorizedException({
        code: 'LOCAL_AGENT_UNAUTHORIZED',
        message: 'Missing local agent bearer token',
      });
    }
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('local_agents')
      .select('id,user_id,name,token_hash,status,tools,last_seen_at')
      .eq('token_hash', this.hashToken(token))
      .maybeSingle<LocalAgentRow>();
    if (error || !data || data.status === 'revoked') {
      throw new UnauthorizedException({
        code: 'LOCAL_AGENT_UNAUTHORIZED',
        message: 'Local agent token is invalid',
      });
    }
    return data;
  }

  private async requireActiveAgent(userId: string): Promise<LocalAgentRow> {
    const agent = await this.findActiveAgent(userId);
    if (!agent) {
      throw new NotFoundException({
        code: 'MCP_NOT_CONNECTED',
        message: 'local-pc is not connected',
      });
    }
    return agent;
  }

  private async findActiveAgent(userId: string): Promise<LocalAgentRow | null> {
    const client = this.supabase.createServiceRoleClient();
    const cutoff = new Date(Date.now() - this.onlineWindowMs).toISOString();
    const { data, error } = await client
      .from('local_agents')
      .select('id,user_id,name,token_hash,status,tools,last_seen_at')
      .eq('user_id', userId)
      .eq('status', 'online')
      .gte('last_seen_at', cutoff)
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle<LocalAgentRow>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'LOCAL_AGENT_STORAGE_UNAVAILABLE',
        message: 'Could not load local agent',
      });
    }
    return data ?? null;
  }

  private parseRegistration(value: unknown): RegisterLocalAgentInput {
    if (!isJsonObject(value)) throw this.invalidRegistration();
    const name = typeof value.name === 'string' ? value.name.trim() : '';
    if (
      !name ||
      name.length > 80 ||
      !Array.isArray(value.tools) ||
      value.tools.length > 250
    ) {
      throw this.invalidRegistration();
    }
    return { name, tools: value.tools.map((tool) => this.parseTool(tool)) };
  }

  private parseTool(value: unknown): LocalAgentTool {
    if (
      !isJsonObject(value) ||
      typeof value.name !== 'string' ||
      !value.name.trim() ||
      !isJsonObject(value.inputSchema)
    ) {
      throw this.invalidRegistration();
    }
    return {
      name: value.name.trim(),
      inputSchema: value.inputSchema,
      ...(typeof value.title === 'string' && value.title.trim()
        ? { title: value.title.trim() }
        : {}),
      ...(typeof value.description === 'string' && value.description.trim()
        ? { description: value.description.trim() }
        : {}),
    };
  }

  private parseStoredTools(value: unknown): McpToolDefinition[] {
    if (!Array.isArray(value)) return [];
    return value.map((tool) => this.parseTool(tool));
  }

  private parseCompletion(value: unknown): CompleteLocalAgentJobInput {
    if (!isJsonObject(value) || !isJsonObject(value.result)) {
      throw new BadRequestException({
        code: 'LOCAL_AGENT_RESULT_INVALID',
        message: 'Local agent result must be a JSON object',
      });
    }
    return { result: value.result as McpToolCallResult };
  }

  private invalidRegistration(): BadRequestException {
    return new BadRequestException({
      code: 'LOCAL_AGENT_REGISTRATION_INVALID',
      message: 'Local agent registration payload is invalid',
    });
  }

  private readBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && token?.trim()
      ? token.trim()
      : null;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
