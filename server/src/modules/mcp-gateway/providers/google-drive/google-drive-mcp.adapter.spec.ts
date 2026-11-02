import type { AppConfigService } from '@server/root/common/config/app-config.service';
import { GoogleDriveMcpAdapter } from '@server/root/modules/mcp-gateway/providers/google-drive/google-drive-mcp.adapter';
import type { RemoteMcpHttpClient } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.client';

describe('GoogleDriveMcpAdapter', () => {
  const url = 'https://drive.example.com/api/mcp';

  it('sends the saved API key as a Bearer token to the configured endpoint', async () => {
    const client = {
      listTools: jest.fn().mockResolvedValue([]),
    } as unknown as RemoteMcpHttpClient;
    const adapter = new GoogleDriveMcpAdapter(
      { googleDriveMcpUrl: url } as AppConfigService,
      client,
    );

    await adapter.listTools({ kind: 'api_key', value: 'secret' });

    expect(adapter.catalogStatus).toBe('available');
    expect(client.listTools).toHaveBeenCalledWith(
      url,
      { kind: 'oauth', accessToken: 'secret', tokenType: 'Bearer' },
      'Google Drive',
    );
  });

  it('reports requires_configuration and refuses calls without a URL', async () => {
    const client = { listTools: jest.fn() } as unknown as RemoteMcpHttpClient;
    const adapter = new GoogleDriveMcpAdapter({} as AppConfigService, client);

    expect(adapter.catalogStatus).toBe('requires_configuration');
    await expect(
      adapter.listTools({ kind: 'api_key', value: 'secret' }),
    ).rejects.toMatchObject({ response: { code: 'MCP_PROVIDER_NOT_CONFIGURED' } });
    expect(client.listTools).not.toHaveBeenCalled();
  });

  it('rejects OAuth credentials', () => {
    const adapter = new GoogleDriveMcpAdapter(
      { googleDriveMcpUrl: url } as AppConfigService,
      {} as RemoteMcpHttpClient,
    );

    expect(() =>
      adapter.callTool(
        { kind: 'oauth', accessToken: 't', tokenType: 'Bearer' },
        'search_files',
        { query: 'x' },
      ),
    ).toThrow('Google Drive MCP requires an API key credential');
  });
});
