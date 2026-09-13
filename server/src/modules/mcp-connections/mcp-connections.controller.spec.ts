import { McpConnectionsController } from '@server/root/modules/mcp-connections/mcp-connections.controller';

describe('McpConnectionsController OAuth boundary', () => {
  it('keeps the browser nonce out of the start response and requires its cookie at callback', async () => {
    const connections = {
      startOAuth: jest.fn().mockResolvedValue({
        provider: 'github',
        authorizationUrl: 'https://github.com/authorize',
        browserNonce: 'browser-secret',
      }),
      oauthReturnTo: jest.fn().mockReturnValue('#mcp-services'),
      completeOAuth: jest.fn().mockResolvedValue({}),
    };
    const transactions = {
      setBrowserCookie: jest.fn(),
      readBrowserCookie: jest.fn().mockReturnValue('browser-secret'),
      clearBrowserCookie: jest.fn(),
    };
    const controller = new McpConnectionsController(
      { webBaseUrl: 'https://web.example.com' } as never,
      connections as never,
      {} as never,
      transactions as never,
    );
    const response = { setHeader: jest.fn(), redirect: jest.fn() };

    const started = await controller.startOAuth(
      {} as never,
      'github',
      {} as never,
      response as never,
    );
    expect(started).toEqual({
      provider: 'github',
      authorizationUrl: 'https://github.com/authorize',
    });
    expect(transactions.setBrowserCookie).toHaveBeenCalledWith(
      response, 'github', 'browser-secret',
    );

    await controller.oauthCallback(
      {} as never,
      'github',
      'authorization-code',
      'state',
      undefined,
      undefined,
      response as never,
    );
    expect(connections.completeOAuth).toHaveBeenCalledWith(
      'github', 'authorization-code', 'state', undefined, 'browser-secret',
    );
    expect(transactions.clearBrowserCookie).toHaveBeenCalledWith(response, 'github');
    expect(response.redirect).toHaveBeenCalledWith(
      'https://web.example.com/app?mcpOAuth=github&status=connected#mcp-services',
    );
  });
});
