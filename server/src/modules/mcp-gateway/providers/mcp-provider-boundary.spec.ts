import {
  McpProtocolShapeError,
  parseMcpToolCallResult,
  parseMcpToolListPage,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider-boundary';

describe('MCP provider protocol boundary', () => {
  it('parses a generic tool with nested JSON Schema metadata', () => {
    const page = parseMcpToolListPage({
      tools: [
        {
          name: 'search',
          title: 'Search',
          description: 'Search anything',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              filters: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                },
              },
            },
            required: ['query'],
          },
          outputSchema: {
            type: 'array',
            items: { type: 'object' },
          },
          annotations: {
            readOnlyHint: true,
          },
          _meta: {
            providerData: {
              nested: ['anything', 42, true, null],
            },
          },
        },
      ],
      nextCursor: '',
    });

    expect(page.nextCursor).toBe('');
    expect(page.tools[0]?.name).toBe('search');
    expect(page.tools[0]?.inputSchema).toMatchObject({ type: 'object' });
    expect(page.tools[0]?.meta).toEqual({
      providerData: {
        nested: ['anything', 42, true, null],
      },
    });
  });

  it('accepts generic JSON tool results', () => {
    const result = parseMcpToolCallResult({
      content: [
        {
          type: 'text',
          text: 'ok',
        },
      ],
      structuredContent: {
        nested: {
          ids: ['a', 'b'],
          count: 2,
        },
      },
      isError: false,
    });

    expect(result.structuredContent).toEqual({
      nested: {
        ids: ['a', 'b'],
        count: 2,
      },
    });
  });

  it('rejects a tool without an MCP inputSchema', () => {
    expect(() =>
      parseMcpToolListPage({
        tools: [{ name: 'broken' }],
      }),
    ).toThrow(McpProtocolShapeError);
  });
});
