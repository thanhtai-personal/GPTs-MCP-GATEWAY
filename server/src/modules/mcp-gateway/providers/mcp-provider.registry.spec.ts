import { BadRequestException } from '@nestjs/common';
import { McpProviderRegistry } from '@server/root/modules/mcp-gateway/providers/mcp-provider.registry';
import type {
  McpProviderAdapter,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

function provider(id: string): McpProviderAdapter {
  return {
    id,
    displayName: id.toUpperCase(),
    credential: {
      kind: 'api_key',
      label: `${id} API Key`,
    },
    testConnection: async () => undefined,
    listTools: async () => [],
    callTool: async () => ({ content: [] }),
  };
}

describe('McpProviderRegistry', () => {
  it('accepts arbitrary registered provider ids', () => {
    const registry = new McpProviderRegistry([
      provider('stitch'),
      provider('github'),
      provider('figma'),
    ]);

    expect(registry.get('github').id).toBe('github');
    expect(registry.list().map((item) => item.id)).toEqual([
      'stitch',
      'github',
      'figma',
    ]);
  });


  it('marks an OAuth provider without a configured client as requiring configuration', () => {
    const oauthProvider: McpProviderAdapter = {
      ...provider('figma'),
      credential: {
        kind: 'oauth',
        label: 'Figma OAuth',
        connectLabel: { en: 'Connect Figma', vi: 'Kết nối Figma' },
        configured: false,
      },
      oauth: {
        resourceUrl: 'https://mcp.figma.com/mcp',
        protectedResourceMetadataUrl:
          'https://mcp.figma.com/.well-known/oauth-protected-resource',
      },
    };
    const registry = new McpProviderRegistry([oauthProvider]);

    expect(registry.listConfigurable()[0]?.status).toBe(
      'requires_configuration',
    );
  });

  it('preserves an explicit pending-review provider status', () => {
    const figmaProvider: McpProviderAdapter = {
      ...provider('figma'),
      catalogStatus: 'pending_review',
      credential: {
        kind: 'oauth',
        label: 'Figma OAuth',
        connectLabel: { en: 'Connect Figma', vi: 'Kết nối Figma' },
        configured: false,
      },
      oauth: {
        resourceUrl: 'https://mcp.figma.com/mcp',
        protectedResourceMetadataUrl:
          'https://mcp.figma.com/.well-known/oauth-protected-resource',
      },
    };
    const registry = new McpProviderRegistry([figmaProvider]);

    expect(registry.listConfigurable()[0]?.status).toBe('pending_review');
  });

  it('preserves an explicit provider-restricted status', () => {
    const lovableProvider: McpProviderAdapter = {
      ...provider('lovable'),
      catalogStatus: 'provider_restricted',
      credential: {
        kind: 'oauth',
        label: 'Lovable OAuth',
        connectLabel: { en: 'Connect Lovable', vi: 'Kết nối Lovable' },
        configured: false,
      },
      oauth: {
        resourceUrl: 'https://mcp.lovable.dev',
        protectedResourceMetadataUrl:
          'https://mcp.lovable.dev/.well-known/oauth-protected-resource',
      },
    };
    const registry = new McpProviderRegistry([lovableProvider]);

    expect(registry.listConfigurable()[0]?.status).toBe('provider_restricted');
  });

  it('rejects unsupported providers instead of accepting arbitrary URLs', () => {
    const registry = new McpProviderRegistry([provider('stitch')]);

    expect(() => registry.get('unknown')).toThrow(BadRequestException);
  });

  it('rejects duplicate provider ids during bootstrap', () => {
    expect(
      () => new McpProviderRegistry([provider('same'), provider('same')]),
    ).toThrow('Duplicate MCP provider id registered');
  });
});
