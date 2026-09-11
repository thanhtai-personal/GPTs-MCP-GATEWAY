import { Injectable } from '@nestjs/common';
import { AuditService } from '@server/root/modules/audit/audit.service';
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';
import { McpProviderRegistry } from '@server/root/modules/mcp-gateway/providers/mcp-provider.registry';
import type { GatewayPrincipal } from '@server/root/modules/open-id/gateway-credential.service';

@Injectable()
export class McpGatewayService {
  constructor(
    private readonly audit: AuditService,
    private readonly connections: McpConnectionsService,
    private readonly providers: McpProviderRegistry,
  ) {}

  async profile(principal: GatewayPrincipal) {
    const connected = await this.connections.listConnectedProviderIds(
      principal.user.id,
    );
    return {
      openId: principal.openId,
      entitlementKind: principal.kind,
      membership: principal.user.membershipTier,
      services: this.providers.list().map((provider) => ({
        ...provider,
        connected: connected.includes(provider.id),
      })),
    };
  }

  async listServices(principal: GatewayPrincipal) {
    return (await this.profile(principal)).services;
  }

  async listTools(principal: GatewayPrincipal, providerId: string) {
    const provider = this.providers.get(providerId);
    const apiKey = await this.connections.getProviderApiKey(
      principal.user.id,
      provider.id,
    );
    const startedAt = Date.now();
    try {
      const tools = await provider.listTools(apiKey);
      await this.audit.write({
        userId: principal.user.id,
        credentialId: principal.credentialId,
        eventType: 'mcp_tools.listed',
        provider: provider.id,
        operation: 'tools/list',
        success: true,
        durationMs: Date.now() - startedAt,
      });
      return { service: provider.id, tools };
    } catch (error) {
      await this.audit.write({
        userId: principal.user.id,
        credentialId: principal.credentialId,
        eventType: 'mcp_tools.list_failed',
        provider: provider.id,
        operation: 'tools/list',
        success: false,
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
  }

  async callTool(
    principal: GatewayPrincipal,
    providerId: string,
    toolName: string,
    argumentsValue: Record<string, unknown>,
  ) {
    const provider = this.providers.get(providerId);
    const apiKey = await this.connections.getProviderApiKey(
      principal.user.id,
      provider.id,
    );
    const startedAt = Date.now();
    try {
      const result = await provider.callTool(apiKey, toolName, argumentsValue);
      await this.audit.write({
        userId: principal.user.id,
        credentialId: principal.credentialId,
        eventType: 'mcp_tool.called',
        provider: provider.id,
        operation: toolName,
        success: !result.isError,
        durationMs: Date.now() - startedAt,
      });
      return { service: provider.id, tool: toolName, result };
    } catch (error) {
      await this.audit.write({
        userId: principal.user.id,
        credentialId: principal.credentialId,
        eventType: 'mcp_tool.failed',
        provider: provider.id,
        operation: toolName,
        success: false,
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
  }
}
