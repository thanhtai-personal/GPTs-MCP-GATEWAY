import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SecretCipherService } from '@server/root/common/security/secret-cipher.service';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';
import { AuthService } from '@server/root/modules/auth/auth.service';
import { AuditService } from '@server/root/modules/audit/audit.service';
import { McpProviderRegistry } from '@server/root/modules/mcp-gateway/providers/mcp-provider.registry';
import type { SaveMcpConnectionDto } from '@server/root/modules/mcp-connections/dto/save-mcp-connection.dto';

type ConnectionRow = {
  id: string;
  user_id: string;
  provider: string;
  status: 'connected' | 'invalid' | 'unavailable';
  credential_ciphertext: string;
  last_verified_at: string | null;
  last_error_code: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class McpConnectionsService {
  constructor(
    private readonly auth: AuthService,
    private readonly audit: AuditService,
    private readonly cipher: SecretCipherService,
    private readonly providers: McpProviderRegistry,
    private readonly supabase: SupabaseService,
  ) {}

  async listOwn(request: Request) {
    const user = await this.auth.requireUser(request);
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('mcp_connections')
      .select(
        'id,user_id,provider,status,credential_ciphertext,last_verified_at,last_error_code,created_at,updated_at',
      )
      .eq('user_id', user.id)
      .order('provider')
      .returns<ConnectionRow[]>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'MCP_CONNECTION_STORAGE_UNAVAILABLE',
        message: 'Could not load MCP connections',
      });
    }
    return (data ?? []).map((row) => this.toView(row));
  }

  async testOwn(request: Request, dto: SaveMcpConnectionDto) {
    const user = await this.auth.requireUser(request);
    const provider = this.providers.get(dto.provider);
    const startedAt = Date.now();
    try {
      await provider.testConnection(dto.apiKey);
      await this.audit.write({
        userId: user.id,
        eventType: 'mcp_connection.verified',
        provider: provider.id,
        success: true,
        durationMs: Date.now() - startedAt,
      });
      return { provider: provider.id, status: 'connected' as const };
    } catch (error) {
      await this.audit.write({
        userId: user.id,
        eventType: 'mcp_connection.failed',
        provider: provider.id,
        success: false,
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
  }

  async saveOwn(request: Request, dto: SaveMcpConnectionDto) {
    const user = await this.auth.requireUser(request);
    const provider = this.providers.get(dto.provider);
    await provider.testConnection(dto.apiKey);
    const now = new Date().toISOString();
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('mcp_connections')
      .upsert(
        {
          user_id: user.id,
          provider: provider.id,
          status: 'connected',
          credential_ciphertext: this.cipher.encrypt(dto.apiKey.trim()),
          credential_version: 1,
          last_verified_at: now,
          last_error_code: null,
          updated_at: now,
        },
        { onConflict: 'user_id,provider' },
      )
      .select(
        'id,user_id,provider,status,credential_ciphertext,last_verified_at,last_error_code,created_at,updated_at',
      )
      .single<ConnectionRow>();

    if (error) {
      throw new ServiceUnavailableException({
        code: 'MCP_CONNECTION_STORAGE_UNAVAILABLE',
        message: 'Could not save MCP connection',
      });
    }
    await this.audit.write({
      userId: user.id,
      eventType: 'mcp_connection.updated',
      provider: provider.id,
      success: true,
    });
    return this.toView(data);
  }

  async removeOwn(request: Request, providerId: string) {
    const user = await this.auth.requireUser(request);
    this.providers.get(providerId);
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('mcp_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', providerId)
      .select('id')
      .maybeSingle<{ id: string }>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'MCP_CONNECTION_STORAGE_UNAVAILABLE',
        message: 'Could not delete MCP connection',
      });
    }
    if (!data) {
      throw new NotFoundException({
        code: 'MCP_NOT_CONNECTED',
        message: `${providerId} is not connected`,
      });
    }
    await this.audit.write({
      userId: user.id,
      eventType: 'mcp_connection.deleted',
      provider: providerId,
      success: true,
    });
    return { deleted: true };
  }

  async getProviderApiKey(userId: string, providerId: string): Promise<string> {
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('mcp_connections')
      .select('credential_ciphertext,status')
      .eq('user_id', userId)
      .eq('provider', providerId)
      .maybeSingle<Pick<ConnectionRow, 'credential_ciphertext' | 'status'>>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'MCP_CONNECTION_STORAGE_UNAVAILABLE',
        message: 'Could not load MCP connection',
      });
    }
    if (!data || data.status !== 'connected') {
      throw new NotFoundException({
        code: 'MCP_NOT_CONNECTED',
        message: `${providerId} is not connected`,
      });
    }
    return this.cipher.decrypt(data.credential_ciphertext);
  }


  async listConnectedProviderIds(userId: string): Promise<string[]> {
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('mcp_connections')
      .select('provider')
      .eq('user_id', userId)
      .eq('status', 'connected')
      .returns<Array<{ provider: string }>>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'MCP_CONNECTION_STORAGE_UNAVAILABLE',
        message: 'Could not load MCP connection status',
      });
    }
    return (data ?? []).map((row) => row.provider);
  }

  private toView(row: ConnectionRow) {
    return {
      id: row.id,
      provider: row.provider,
      status: row.status,
      lastVerifiedAt: row.last_verified_at,
      lastErrorCode: row.last_error_code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
