import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  MCP_PROVIDER_ADAPTERS,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.tokens';
import type {
  McpProviderAdapter,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

@Injectable()
export class McpProviderRegistry {
  private readonly providers: Map<string, McpProviderAdapter>;

  constructor(
    @Inject(MCP_PROVIDER_ADAPTERS)
    adapters: McpProviderAdapter[],
  ) {
    this.providers = new Map(
      adapters.map((adapter) => [adapter.id, adapter] as const),
    );

    if (this.providers.size !== adapters.length) {
      throw new Error('Duplicate MCP provider id registered');
    }
  }

  list() {
    return [...this.providers.values()].map((provider) => ({
      id: provider.id,
      name: provider.displayName,
      status: 'available' as const,
    }));
  }

  listConfigurable() {
    return [...this.providers.values()].map((provider) => ({
      id: provider.id,
      name: provider.displayName,
      status: 'available' as const,
      credential: provider.credential,
    }));
  }

  get(providerId: string): McpProviderAdapter {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new BadRequestException({
        code: 'MCP_PROVIDER_UNSUPPORTED',
        message: `Unsupported MCP provider: ${providerId}`,
      });
    }
    return provider;
  }
}
