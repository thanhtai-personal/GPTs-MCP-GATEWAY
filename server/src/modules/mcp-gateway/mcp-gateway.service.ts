import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '@server/root/modules/audit/audit.service';
import { LocalAgentService } from '@server/root/modules/local-agent/local-agent.service';
import { LOCAL_PC_SERVICE_ID } from '@server/root/modules/local-agent/local-agent.types';
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';
import { McpProviderRegistry } from '@server/root/modules/mcp-gateway/providers/mcp-provider.registry';
import type {
  McpToolArguments,
  McpToolDefinition,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
import type { ExecutionPrincipal } from '@server/root/modules/open-id/gateway-credential.service';

@Injectable()
export class McpGatewayService {
  constructor(
    private readonly audit: AuditService,
    private readonly connections: McpConnectionsService,
    private readonly providers: McpProviderRegistry,
    private readonly localAgents: LocalAgentService,
  ) {}

  async profile(principal: ExecutionPrincipal) {
    const [connected, localConnected] = await Promise.all([
      this.connections.listConnectedProviderIds(principal.user.id),
      this.localAgents.hasConnectedAgent(principal.user.id),
    ]);
    return {
      openId: principal.openId,
      entitlementKind: principal.kind,
      membership: principal.user.membershipTier,
      services: [
        ...this.providers.list().map((provider) => ({
          ...provider,
          connected: connected.includes(provider.id),
        })),
        {
          id: LOCAL_PC_SERVICE_ID,
          name: 'Local PC',
          status: 'available' as const,
          connected: localConnected,
        },
      ],
    };
  }

  async listServices(principal: ExecutionPrincipal) {
    return (await this.profile(principal)).services;
  }

  async listTools(principal: ExecutionPrincipal, providerId: string) {
    if (providerId === LOCAL_PC_SERVICE_ID) {
      return this.listLocalTools(principal);
    }

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
      return this.toolCatalog(provider.id, tools);
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
    principal: ExecutionPrincipal,
    providerId: string,
    toolName: string,
  ) {
    if (providerId === LOCAL_PC_SERVICE_ID) {
      const startedAt = Date.now();
      try {
        const tools = await this.localAgents.listTools(principal.user.id);
        const tool = this.requireTool(tools, toolName);
        await this.audit.write({
          userId: principal.user.id,
          credentialId: principal.credentialId,
          eventType: 'mcp_tool_schema.read',
          provider: LOCAL_PC_SERVICE_ID,
          operation: toolName,
          success: true,
          durationMs: Date.now() - startedAt,
        });
        return { service: LOCAL_PC_SERVICE_ID, tool };
      } catch (error) {
        await this.audit.write({
          userId: principal.user.id,
          credentialId: principal.credentialId,
          eventType: 'mcp_tool_schema.read_failed',
          provider: LOCAL_PC_SERVICE_ID,
          operation: toolName,
          success: false,
          durationMs: Date.now() - startedAt,
        });
        throw error;
      }
    }

    const provider = this.providers.get(providerId);
    const credential = await this.connections.getProviderCredential(
      principal.user.id,
      provider.id,
    );
    const startedAt = Date.now();

    try {
      const tools = await provider.listTools(credential);
      const tool = this.requireTool(tools, toolName);
      await this.audit.write({
        userId: principal.user.id,
        credentialId: principal.credentialId,
        eventType: 'mcp_tool_schema.read',
        provider: provider.id,
        operation: toolName,
        success: true,
        durationMs: Date.now() - startedAt,
      });

      return { service: provider.id, tool };
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
    principal: ExecutionPrincipal,
    providerId: string,
    toolName: string,
    argumentsValue: McpToolArguments,
  ) {
    if (providerId === LOCAL_PC_SERVICE_ID) {
      const startedAt = Date.now();
      try {
        const result = await this.localAgents.callTool(
          principal.user.id,
          toolName,
          argumentsValue,
        );
        await this.audit.write({
          userId: principal.user.id,
          credentialId: principal.credentialId,
          eventType: 'mcp_tool.called',
          provider: LOCAL_PC_SERVICE_ID,
          operation: toolName,
          success: !result.isError,
          durationMs: Date.now() - startedAt,
        });
        return { service: LOCAL_PC_SERVICE_ID, tool: toolName, result };
      } catch (error) {
        await this.audit.write({
          userId: principal.user.id,
          credentialId: principal.credentialId,
          eventType: 'mcp_tool.failed',
          provider: LOCAL_PC_SERVICE_ID,
          operation: toolName,
          success: false,
          durationMs: Date.now() - startedAt,
        });
        throw error;
      }
    }

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
        { userId: principal.user.id },
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

  private async listLocalTools(principal: ExecutionPrincipal) {
    const startedAt = Date.now();
    try {
      const tools = await this.localAgents.listTools(principal.user.id);
      await this.audit.write({
        userId: principal.user.id,
        credentialId: principal.credentialId,
        eventType: 'mcp_tools.listed',
        provider: LOCAL_PC_SERVICE_ID,
        operation: 'tools/list',
        success: true,
        durationMs: Date.now() - startedAt,
      });
      return this.toolCatalog(LOCAL_PC_SERVICE_ID, tools);
    } catch (error) {
      await this.audit.write({
        userId: principal.user.id,
        credentialId: principal.credentialId,
        eventType: 'mcp_tools.list_failed',
        provider: LOCAL_PC_SERVICE_ID,
        operation: 'tools/list',
        success: false,
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
  }

  private toolCatalog(service: string, tools: McpToolDefinition[]) {
    return {
      service,
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
  }

  private requireTool(tools: McpToolDefinition[], toolName: string) {
    const tool = tools.find((candidate) => candidate.name === toolName);
    if (!tool) {
      throw new NotFoundException({
        code: 'MCP_TOOL_NOT_FOUND',
        message: `MCP tool not found: ${toolName}`,
      });
    }
    return {
      name: tool.name,
      ...(tool.title ? { title: tool.title } : {}),
      ...(tool.description ? { description: tool.description } : {}),
      inputSchema: tool.inputSchema,
      ...(tool.outputSchema ? { outputSchema: tool.outputSchema } : {}),
      ...(tool.annotations ? { annotations: tool.annotations } : {}),
      ...(tool.meta ? { meta: tool.meta } : {}),
    };
  }

  private compactDescription(description: string): string {
    const normalized = description.replace(/\s+/gu, ' ').trim();
    const maxLength = 600;
    return normalized.length <= maxLength
      ? normalized
      : `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
  }
}
