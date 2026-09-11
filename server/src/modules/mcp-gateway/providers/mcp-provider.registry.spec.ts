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
