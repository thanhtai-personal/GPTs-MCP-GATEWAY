import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  MCP_PROVIDER_ADAPTERS,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.tokens';
import type {
  McpProviderAdapter,
  McpProviderCatalogStatus,
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
      status: this.status(provider),
    }));
  }

  listConfigurable() {
    const groups = new Map<
      string,
      {
        id: string;
        name: string;
        serviceIds: string[];
        provider: McpProviderAdapter;
      }
    >();

    for (const provider of this.providers.values()) {
      const ownerId = this.credentialOwnerId(provider);
      const current = groups.get(ownerId);
      if (current) {
        current.serviceIds.push(provider.id);
        continue;
      }

      groups.set(ownerId, {
        id: ownerId,
        name: provider.credentialOwner?.displayName ?? provider.displayName,
        serviceIds: [provider.id],
        provider,
      });
    }

    return [...groups.values()].map((group) => ({
      id: group.id,
      name: group.name,
      serviceIds: group.serviceIds,
      status: this.status(group.provider),
      credential: group.provider.credential,
    }));
  }

  credentialOwnerId(provider: McpProviderAdapter): string {
    return provider.credentialOwner?.id ?? provider.id;
  }

  getCredentialProvider(providerOrOwnerId: string): McpProviderAdapter {
    const direct = this.providers.get(providerOrOwnerId);
    if (direct) return direct;

    const grouped = [...this.providers.values()].find(
      (provider) => provider.credentialOwner?.id === providerOrOwnerId,
    );
    if (grouped) return grouped;

    throw this.unsupported(providerOrOwnerId);
  }

  credentialStorageIds(providerOrOwnerId: string): string[] {
    const provider = this.getCredentialProvider(providerOrOwnerId);
    const ownerId = this.credentialOwnerId(provider);
    const serviceIds = [...this.providers.values()]
      .filter((candidate) => this.credentialOwnerId(candidate) === ownerId)
      .map((candidate) => candidate.id);

    return [...new Set([ownerId, ...serviceIds])];
  }

  runtimeServiceIdsForCredential(providerOrOwnerId: string): string[] {
    const provider = this.getCredentialProvider(providerOrOwnerId);
    const ownerId = this.credentialOwnerId(provider);

    return [...this.providers.values()]
      .filter((candidate) => this.credentialOwnerId(candidate) === ownerId)
      .map((candidate) => candidate.id);
  }

  private status(provider: McpProviderAdapter): McpProviderCatalogStatus {
    if (provider.catalogStatus) {
      return provider.catalogStatus;
    }

    return provider.credential.kind === 'oauth' &&
      !provider.credential.configured
      ? 'requires_configuration'
      : 'available';
  }

  get(providerId: string): McpProviderAdapter {
    const provider = this.providers.get(providerId);
    if (!provider) throw this.unsupported(providerId);
    return provider;
  }

  private unsupported(providerId: string): BadRequestException {
    return new BadRequestException({
      code: 'MCP_PROVIDER_UNSUPPORTED',
      message: `Unsupported MCP provider: ${providerId}`,
    });
  }
}
