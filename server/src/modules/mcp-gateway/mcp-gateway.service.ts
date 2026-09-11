import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '@server/root/modules/audit/audit.service';
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';
import { McpProviderRegistry } from '@server/root/modules/mcp-gateway/providers/mcp-provider.registry';
import type {
  McpToolArguments,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
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
    const credential = await this.connections.getProviderCredential(
      principal.user.id,
      provider.id,
    );
    const startedAt = Date.now();
    try {
      const tools = await provider.listTools(credential);
      await this.audit.write({
        userId: principal.user.id,
        credentialId: principal.credentialId,
        eventType: 'mcp_tools.listed',
        provider: provider.id,
        operation: 'tools/list',
        success: true,
        durationMs: Date.now() - startedAt,
      });
      return {
        service: provider.id,
        total: tools.length,
        schemaMode: 'lazy' as const,
        tools: tools.map((tool) => ({
          name: tool.name,
          ...(tool.title ? { title: tool.title } : {}),
          ...(tool.description
            ? { description: this.compactDescription(tool.description) }
            : {}),
          hasInputSchema: Boolean(tool.inputSchema),
        })),
      };
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

  async getToolSchema(
    principal: GatewayPrincipal,
    providerId: string,
    toolName: string,
  ) {
    const provider = this.providers.get(providerId);
    const credential = await this.connections.getProviderCredential(
      principal.user.id,
      provider.id,
    );
    const startedAt = Date.now();

    try {
      const tools = await provider.listTools(credential);
      const tool = tools.find((candidate) => candidate.name === toolName);
      if (!tool) {
        throw new NotFoundException({
          code: 'MCP_TOOL_NOT_FOUND',
          message: `MCP tool not found: ${toolName}`,
        });
      }

      await this.audit.write({
        userId: principal.user.id,
        credentialId: principal.credentialId,
        eventType: 'mcp_tool_schema.read',
        provider: provider.id,
        operation: toolName,
        success: true,
        durationMs: Date.now() - startedAt,
      });

      return {
        service: provider.id,
        tool: {
          name: tool.name,
          ...(tool.title ? { title: tool.title } : {}),
          ...(tool.description ? { description: tool.description } : {}),
          inputSchema: tool.inputSchema,
          ...(tool.outputSchema ? { outputSchema: tool.outputSchema } : {}),
          ...(tool.annotations ? { annotations: tool.annotations } : {}),
          ...(tool.meta ? { meta: tool.meta } : {}),
        },
      };
    } catch (error) {
      await this.audit.write({
        userId: principal.user.id,
        credentialId: principal.credentialId,
        eventType: 'mcp_tool_schema.read_failed',
        provider: provider.id,
        operation: toolName,
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
    argumentsValue: McpToolArguments,
  ) {
    const provider = this.providers.get(providerId);
    const credential = await this.connections.getProviderCredential(
      principal.user.id,
      provider.id,
    );
    const startedAt = Date.now();
    try {
      const result = await provider.callTool(
        credential,
        toolName,
        argumentsValue,
      );
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

  private compactDescription(description: string): string {
    const normalized = description.replace(/\s+/gu, ' ').trim();
    const maxLength = 600;
    return normalized.length <= maxLength
      ? normalized
      : `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
  }
}
