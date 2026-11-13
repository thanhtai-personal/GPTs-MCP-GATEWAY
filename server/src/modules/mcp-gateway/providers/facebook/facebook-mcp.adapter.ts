import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { FacebookGraphApiClient } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-graph-api.client';
import { FACEBOOK_MCP_TOOLS } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-mcp.tools';
import type { JsonObject, McpProviderAdapter, McpProviderCredential, McpToolArguments, McpToolCallResult, McpToolDefinition } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

@Injectable()
export class FacebookMcpAdapter implements McpProviderAdapter {
  readonly id = 'facebook' as const;
  readonly displayName = 'Facebook';
  readonly credential: McpProviderAdapter['credential'];
  constructor(private readonly api: FacebookGraphApiClient, config: AppConfigService) {
    this.credential = { kind: 'oauth', label: 'Meta OAuth',
      connectLabel: { en: 'Connect Facebook', vi: 'Kết nối Facebook' },
      configured: Boolean(config.metaAppId && config.metaAppSecret && config.metaFacebookLoginConfigId),
      note: { en: 'Official Meta Login for Business and Graph API. Profile sharing remains user-confirmed; Page publishing follows the approval-based workflow.',
        vi: 'Dùng Meta Login for Business và Graph API chính thức. Chia sẻ profile cần người dùng xác nhận; đăng Page theo quy trình duyệt.' } };
  }
  async testConnection(credential: McpProviderCredential): Promise<void> {
    await this.api.get(this.accessToken(credential), '/me', { fields: 'id,name' });
  }
  async listTools(credential: McpProviderCredential): Promise<McpToolDefinition[]> {
    this.accessToken(credential); return FACEBOOK_MCP_TOOLS;
  }
  async callTool(credential: McpProviderCredential, toolName: string, args: McpToolArguments): Promise<McpToolCallResult> {
    const token = this.accessToken(credential);
    let result: JsonObject;
    if (toolName === 'facebook_get_identity') {
      result = await this.api.get(token, '/me', { fields: 'id,name' });
    } else if (toolName === 'facebook_list_pages') {
      const limit = typeof args.limit === 'number' ? Math.max(1, Math.min(100, Math.trunc(args.limit))) : 25;
      const response = await this.api.get(token, '/me/accounts', { fields: 'id,name,category,tasks', limit: String(limit) });
      const rows = Array.isArray(response.data) ? response.data : [];
      result = { data: rows.filter((item): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item))
        .map((item) => ({ id: typeof item.id === 'string' ? item.id : '', name: typeof item.name === 'string' ? item.name : '',
          ...(typeof item.category === 'string' ? { category: item.category } : {}),
          tasks: Array.isArray(item.tasks) ? item.tasks.filter((task): task is string => typeof task === 'string') : [] }))
        .filter((page) => page.id.length > 0 && page.name.length > 0), paging: response.paging ?? null };
    } else {
      throw new NotFoundException({ code: 'MCP_TOOL_NOT_FOUND', message: 'Facebook tool not found: ' + toolName });
    }
    return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: { result } };
  }
  private accessToken(credential: McpProviderCredential): string {
    if (credential.kind !== 'oauth') throw new UnauthorizedException({ code: 'MCP_INVALID_CREDENTIAL', message: 'Facebook requires an OAuth credential' });
    return credential.accessToken;
  }
}
