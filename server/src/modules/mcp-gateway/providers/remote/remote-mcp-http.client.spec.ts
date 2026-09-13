import type { AppConfigService } from '@server/root/common/config/app-config.service';
import { RemoteMcpHttpClient } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.client';
import { RemoteMcpHttpTransport } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.transport';

describe('RemoteMcpHttpClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('mirrors schema-declared tool arguments into modern MCP headers', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        jsonRpcResult({
          supportedVersions: ['2026-07-28'],
          capabilities: { tools: {} },
        }),
      )
      .mockResolvedValueOnce(
        jsonRpcResult({
          tools: [
            {
              name: 'get_file_contents',
              inputSchema: {
                type: 'object',
                properties: {
                  owner: { type: 'string', 'x-mcp-header': 'owner' },
                  repo: { type: 'string', 'x-mcp-header': 'repo' },
                  path: { type: 'string' },
                },
                required: ['owner', 'repo'],
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonRpcResult({
          content: [{ type: 'text', text: 'README' }],
        }),
      ) as typeof fetch;

    const config = { upstreamTimeoutMs: 30_000 } as AppConfigService;
    const client = new RemoteMcpHttpClient(
      new RemoteMcpHttpTransport(config),
    );

    await client.callTool(
      'https://api.githubcopilot.com/mcp/x/all/readonly',
      {
        kind: 'oauth',
        accessToken: 'token',
        tokenType: 'Bearer',
      },
      'GitHub',
      'get_file_contents',
      {
        owner: 'thanhtai-personal',
        repo: 'GPTs-MCP-GATEWAY',
        path: 'README.md',
      },
    );

    expect(global.fetch).toHaveBeenCalledTimes(3);
    const [, callInit] = (global.fetch as jest.Mock).mock.calls[2] as [
      string,
      RequestInit,
    ];
    const headers = new Headers(callInit.headers);
    expect(headers.get('Mcp-Param-owner')).toBe('thanhtai-personal');
    expect(headers.get('Mcp-Param-repo')).toBe('GPTs-MCP-GATEWAY');
  });

  it('does not call a tool omitted from the provider tool list', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonRpcResult({
        supportedVersions: ['2026-07-28'],
        capabilities: { tools: {} },
      }))
      .mockResolvedValueOnce(jsonRpcResult({
        tools: [{ name: 'get_file_contents', inputSchema: { type: 'object' } }],
      }))
      .mockResolvedValueOnce(jsonRpcResult({ content: [] })) as typeof fetch;

    const client = new RemoteMcpHttpClient(
      new RemoteMcpHttpTransport({ upstreamTimeoutMs: 30_000 } as AppConfigService),
    );

    await expect(client.callTool(
      'https://api.githubcopilot.com/mcp/x/all/readonly',
      { kind: 'oauth', accessToken: 'token', tokenType: 'Bearer' },
      'GitHub',
      'delete_repository',
      {},
    )).rejects.toMatchObject({ status: 404 });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

function jsonRpcResult(result: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      result,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
