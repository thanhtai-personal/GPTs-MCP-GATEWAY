import { McpProtocolShapeError } from '@server/root/modules/mcp-gateway/providers/mcp-provider-boundary';
import { buildMcpParamHeaders } from '@server/root/modules/mcp-gateway/providers/remote/mcp-param-headers';

describe('buildMcpParamHeaders', () => {
  it('mirrors top-level and nested primitive arguments', () => {
    const headers = buildMcpParamHeaders(
      {
        type: 'object',
        properties: {
          owner: { type: 'string', 'x-mcp-header': 'owner' },
          options: {
            type: 'object',
            properties: {
              page: { type: 'integer', 'x-mcp-header': 'page' },
              enabled: { type: 'boolean', 'x-mcp-header': 'enabled' },
            },
          },
        },
      },
      {
        owner: 'thanhtai-personal',
        options: { page: 2, enabled: false },
      },
    );

    expect(headers).toEqual({
      'Mcp-Param-owner': 'thanhtai-personal',
      'Mcp-Param-page': '2',
      'Mcp-Param-enabled': 'false',
    });
  });

  it('base64-encodes values that are unsafe or ambiguous in HTTP headers', () => {
    const headers = buildMcpParamHeaders(
      {
        type: 'object',
        properties: {
          greeting: { type: 'string', 'x-mcp-header': 'greeting' },
          padded: { type: 'string', 'x-mcp-header': 'padded' },
          sentinel: { type: 'string', 'x-mcp-header': 'sentinel' },
        },
      },
      {
        greeting: 'Hello, thế giới',
        padded: ' padded ',
        sentinel: '=?base64?literal?=',
      },
    );

    expect(headers).toEqual({
      'Mcp-Param-greeting': encoded('Hello, thế giới'),
      'Mcp-Param-padded': encoded(' padded '),
      'Mcp-Param-sentinel': encoded('=?base64?literal?='),
    });
  });

  it('rejects malformed or duplicated schema header declarations', () => {
    expect(() =>
      buildMcpParamHeaders(
        {
          type: 'object',
          properties: {
            owner: { type: 'string', 'x-mcp-header': 'repo' },
            repo: { type: 'string', 'x-mcp-header': 'Repo' },
          },
        },
        {},
      ),
    ).toThrow(McpProtocolShapeError);
  });
});

function encoded(value: string): string {
  return `=?base64?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}
