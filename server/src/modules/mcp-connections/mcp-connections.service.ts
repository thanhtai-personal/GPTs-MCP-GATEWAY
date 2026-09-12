import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';
import { AuthService } from '@server/root/modules/auth/auth.service';
import { AuditService } from '@server/root/modules/audit/audit.service';
import { resolveProviderAccessMode } from '@server/root/modules/mcp-connections/mcp-access-mode';
import { McpCredentialCodec } from '@server/root/modules/mcp-connections/mcp-credential-codec.service';
import { McpOAuthService } from '@server/root/modules/mcp-connections/mcp-oauth.service';
import type { ConnectGoogleWorkspaceDto } from '@server/root/modules/mcp-connections/dto/connect-google-workspace.dto';
import {
  groupProviderConnectionRows,
} from '@server/root/modules/mcp-connections/mcp-connection-grouping';
import {
  GOOGLE_WORKSPACE_PROVIDER_IDS,
  googleWorkspaceCredential,
} from '@server/root/modules/mcp-connections/google-workspace-connection';
import type { SaveMcpConnectionDto } from '@server/root/modules/mcp-connections/dto/save-mcp-connection.dto';
import type { StartMcpOAuthDto } from '@server/root/modules/mcp-connections/dto/start-mcp-oauth.dto';
import { McpProviderRegistry } from '@server/root/modules/mcp-gateway/providers/mcp-provider.registry';
import type {
  McpProviderAccessMode,
  McpProviderAdapter,
  McpProviderCredential,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

type ConnectionRow = {
  id: string;
  user_id: string;
  provider: string;
  status: 'connected' | 'invalid' | 'unavailable';
  credential_ciphertext: string;
  credential_version: number;
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
    private readonly codec: McpCredentialCodec,
    private readonly oauth: McpOAuthService,
    private readonly providers: McpProviderRegistry,
    private readonly supabase: SupabaseService,
  ) {}

  async listSupportedProviders(request: Request) {
    await this.auth.requireUser(request);
    return this.providers.listConfigurable();
  }

  async listOwn(request: Request) {
    const user = await this.auth.requireUser(request);
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('mcp_connections')
      .select(
        'id,user_id,provider,status,credential_ciphertext,credential_version,last_verified_at,last_error_code,created_at,updated_at',
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
    const rows = groupProviderConnectionRows<ConnectionRow>(
      data ?? [],
      (providerId) =>
        this.providers.credentialOwnerId(
          this.providers.getCredentialProvider(providerId),
        ),
    );
    return rows.map((row) => {
      const provider = this.providers.getCredentialProvider(row.provider);
      if (
        provider.credential.kind !== 'oauth' ||
        !provider.credential.accessModes
      ) {
        return this.toView(row);
      }
      const credential = this.codec.decode(
        row.credential_ciphertext,
        row.credential_version,
        provider,
      );
      return this.toView(
        row,
        credential.kind === 'oauth'
          ? credential.accessMode ?? provider.credential.accessModes.default
          : undefined,
      );
    });
  }

  async testOwn(request: Request, dto: SaveMcpConnectionDto) {
    const user = await this.auth.requireUser(request);
    const provider = this.providers.get(dto.provider);
    this.requireApiKeyProvider(provider);
    const startedAt = Date.now();
    try {
      await provider.testConnection(this.apiKeyCredential(dto.apiKey));
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
    this.requireApiKeyProvider(provider);
    const credential = this.apiKeyCredential(dto.apiKey);
    await provider.testConnection(credential);
    return this.saveCredential(user.id, provider, credential);
  }

  async startOAuth(
    request: Request,
    providerId: string,
    dto: StartMcpOAuthDto,
  ) {
    const user = await this.auth.requireUser(request);
    const provider = this.providers.get(providerId);
    if (provider.credential.kind !== 'oauth') {
      throw new BadRequestException({
        code: 'MCP_OAUTH_NOT_SUPPORTED',
        message: `${provider.displayName} does not use OAuth`,
      });
    }
    const accessMode = resolveProviderAccessMode(provider, dto.accessMode);
    return this.oauth.createAuthorizationRequest(user.id, provider, {
      ...(accessMode ? { accessMode } : {}),
      ...(dto.returnTo ? { returnTo: dto.returnTo } : {}),
    });
  }

  oauthReturnTo(providerId: string, state: string): string | undefined {
    return this.oauth.returnToFromState(this.providers.get(providerId), state);
  }

  async completeOAuth(
    providerId: string,
    code: string,
    state: string,
    issuer?: string,
  ) {
    const provider = this.providers.get(providerId);
    const result = await this.oauth.exchangeAuthorizationCode(
      provider,
      code,
      state,
      issuer,
    );
    await this.auth.getUserById(result.userId);
    const startedAt = Date.now();
    try {
      await provider.testConnection(result.credential);
      const connection = await this.saveCredential(
        result.userId,
        provider,
        result.credential,
      );
      await this.audit.write({
        userId: result.userId,
        eventType: 'mcp_connection.oauth_connected',
        provider: provider.id,
        success: true,
        durationMs: Date.now() - startedAt,
      });
      return connection;
    } catch (error) {
      await this.audit.write({
        userId: result.userId,
        eventType: 'mcp_connection.oauth_failed',
        provider: provider.id,
        success: false,
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
  }

  async connectGoogleWorkspace(
    request: Request,
    dto: ConnectGoogleWorkspaceDto,
  ) {
    const user = await this.auth.requireUser(request);
    const providers = GOOGLE_WORKSPACE_PROVIDER_IDS.map((id) =>
      this.providers.get(id),
    );
    const credential = googleWorkspaceCredential(dto);
    await Promise.all(
      providers.map((provider) => provider.testConnection(credential)),
    );
    const connection = await this.saveCredential(
      user.id,
      providers[0],
      credential,
    );
    return { connection, status: 'connected' as const };
  }

  async removeOwn(request: Request, providerId: string) {
    const user = await this.auth.requireUser(request);
    const provider = this.providers.getCredentialProvider(providerId);
    const ownerId = this.providers.credentialOwnerId(provider);
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('mcp_connections')
      .delete()
      .eq('user_id', user.id)
      .in('provider', this.providers.credentialStorageIds(providerId))
      .select('id')
      .returns<Array<{ id: string }>>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'MCP_CONNECTION_STORAGE_UNAVAILABLE',
        message: 'Could not delete MCP connection',
      });
    }
    if (!data?.length) {
      throw new NotFoundException({
        code: 'MCP_NOT_CONNECTED',
        message: `${providerId} is not connected`,
      });
    }
    await this.audit.write({
      userId: user.id,
      eventType: 'mcp_connection.deleted',
      provider: ownerId,
      success: true,
    });
    return { deleted: true };
  }

  async getProviderCredential(
    userId: string,
    providerId: string,
  ): Promise<McpProviderCredential> {
    const provider = this.providers.get(providerId);
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('mcp_connections')
      .select('id,credential_ciphertext,credential_version,status')
      .eq('user_id', userId)
      .in('provider', this.providers.credentialStorageIds(providerId))
      .limit(1)
      .maybeSingle<
        Pick<
          ConnectionRow,
          'id' | 'credential_ciphertext' | 'credential_version' | 'status'
        >
      >();
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
    const credential = this.codec.decode(
      data.credential_ciphertext,
      data.credential_version,
      provider,
    );
    if (
      credential.kind !== 'oauth' ||
      !this.codec.shouldRefresh(credential)
    ) {
      return credential;
    }
    const refreshed = provider.refreshCredential
      ? await provider.refreshCredential(credential)
      : await this.oauth.refreshCredential(provider, credential);
    const encoded = this.codec.encode(refreshed);
    const now = new Date().toISOString();
    const { error: updateError } = await client
      .from('mcp_connections')
      .update({
        credential_ciphertext: encoded.ciphertext,
        credential_version: encoded.version,
        last_verified_at: now,
        last_error_code: null,
        updated_at: now,
      })
      .eq('id', data.id);
    if (updateError) {
      throw new ServiceUnavailableException({
        code: 'MCP_CONNECTION_STORAGE_UNAVAILABLE',
        message: 'Could not persist refreshed MCP OAuth credential',
      });
    }
    return refreshed;
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
    const connected = new Set<string>();
    for (const row of data ?? []) {
      for (const serviceId of this.providers.runtimeServiceIdsForCredential(
        row.provider,
      )) {
        connected.add(serviceId);
      }
    }
    return [...connected];
  }

  private async saveCredential(
    userId: string,
    provider: McpProviderAdapter,
    credential: McpProviderCredential,
  ) {
    const now = new Date().toISOString();
    const encoded = this.codec.encode(credential);
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('mcp_connections')
      .upsert(
        {
          user_id: userId,
          provider: this.providers.credentialOwnerId(provider),
          status: 'connected',
          credential_ciphertext: encoded.ciphertext,
          credential_version: encoded.version,
          last_verified_at: now,
          last_error_code: null,
          updated_at: now,
        },
        { onConflict: 'user_id,provider' },
      )
      .select(
        'id,user_id,provider,status,credential_ciphertext,credential_version,last_verified_at,last_error_code,created_at,updated_at',
      )
      .single<ConnectionRow>();
    if (error) {
      throw new ServiceUnavailableException({
        code: 'MCP_CONNECTION_STORAGE_UNAVAILABLE',
        message: 'Could not save MCP connection',
      });
    }
    await this.audit.write({
      userId,
      eventType: 'mcp_connection.updated',
      provider: this.providers.credentialOwnerId(provider),
      success: true,
    });
    return this.toView(data);
  }

  private requireApiKeyProvider(provider: McpProviderAdapter): void {
    if (provider.credential.kind !== 'api_key') {
      throw new BadRequestException({
        code: 'MCP_CREDENTIAL_TYPE_MISMATCH',
        message: `${provider.displayName} must be connected with OAuth`,
      });
    }
  }

  private apiKeyCredential(value: string): McpProviderCredential {
    return {
      kind: 'api_key',
      value: value.trim(),
    };
  }

  private toView(
    row: ConnectionRow,
    accessMode?: McpProviderAccessMode,
  ) {
    return {
      id: row.id,
      provider: row.provider,
      status: row.status,
      lastVerifiedAt: row.last_verified_at,
      lastErrorCode: row.last_error_code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ...(accessMode ? { accessMode } : {}),
    };
  }
}
