import type { AppConfigService } from '@server/root/common/config/app-config.service';
import { GithubMcpAdapter } from '@server/root/modules/mcp-gateway/providers/github/github-mcp.adapter';
import type { RemoteMcpHttpClient } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.client';

describe('GithubMcpAdapter', () => {
  const config = {
    githubMcpOAuthClientId: 'client',
    githubMcpOAuthClientSecret: 'secret',
  } as AppConfigService;

  it('uses GitHub MCP read-only endpoint by default', async () => {
    const client = {
      listTools: jest.fn().mockResolvedValue([]),
    } as unknown as RemoteMcpHttpClient;
    const adapter = new GithubMcpAdapter(config, client);

    await adapter.listTools({
      kind: 'oauth',
      accessToken: 'token',
      tokenType: 'Bearer',
    });

    expect(client.listTools).toHaveBeenCalledWith(
      'https://api.githubcopilot.com/mcp/x/all/readonly',
      expect.objectContaining({ accessToken: 'token' }),
      'GitHub',
    );
  });

  it('uses the normal endpoint only for explicit write mode', async () => {
    const client = {
      listTools: jest.fn().mockResolvedValue([]),
    } as unknown as RemoteMcpHttpClient;
    const adapter = new GithubMcpAdapter(config, client);

    await adapter.listTools({
      kind: 'oauth',
      accessToken: 'token',
      tokenType: 'Bearer',
      accessMode: 'write',
    });

    expect(client.listTools).toHaveBeenCalledWith(
      'https://api.githubcopilot.com/mcp',
      expect.objectContaining({ accessMode: 'write' }),
      'GitHub',
    );
  });
});
