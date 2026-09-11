import { BadRequestException, Injectable } from '@nestjs/common';
import { StitchMcpAdapter } from '@server/root/modules/mcp-gateway/providers/stitch/stitch-mcp.adapter';
import type {
  McpProviderAdapter,
  McpProviderId,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

@Injectable()
export class McpProviderRegistry {
  private readonly providers: Map<McpProviderId, McpProviderAdapter>;

  constructor(stitch: StitchMcpAdapter) {
    this.providers = new Map([[stitch.id, stitch]]);
  }

  list() {
    return [...this.providers.values()].map((provider) => ({
      id: provider.id,
      name: provider.displayName,
      status: 'available' as const,
    }));
  }

  get(providerId: string): McpProviderAdapter {
    const provider = this.providers.get(providerId as McpProviderId);
    if (!provider) {
      throw new BadRequestException({
        code: 'MCP_PROVIDER_UNSUPPORTED',
        message: `Unsupported MCP provider: ${providerId}`,
      });
    }
    return provider;
  }
}
