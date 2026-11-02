import { McpConnectionsController } from '@server/root/modules/mcp-connections/mcp-connections.controller';

function setup() {
  const connections = {
    startOAuth: jest.fn().mockResolvedValue({
      provider: 'github',
      authorizationUrl: 'https://github.com/authorize?state=s',
      browserNonce: 'browser-secret',
    }),
    completeOAuth: jest.fn().mockResolvedValue({
      connection: {},
      returnTo: '#mcp-services',
    }),
  };
  const googleWorkspaceOAuth = {
    complete: jest.fn().mockResolvedValue({ connection: {} }),
  };
  const auth = { requireUser: jest.fn().mockResolvedValue({ id: 'user-1' }) };
  const controller = new McpConnectionsController(
    { webBaseUrl: 'https://web.example.com/' } as never,
    connections as never,
    googleWorkspaceOAuth as never,
    auth as never,
  );
  const response = { setHeader: jest.fn(), redirect: jest.fn() };
  return { controller, connections, googleWorkspaceOAuth, auth, response };
}

const NONCE = 'a'.repeat(43);

describe('McpConnectionsController OAuth boundary', () => {
  it('returns the browser nonce to the web app instead of setting a cross-site cookie', async () => {
    const { controller, response } = setup();

    const started = await controller.startOAuth(
      {} as never,
      'github',
      {} as never,
      response as never,
    );

    expect(started).toEqual({
      provider: 'github',
      authorizationUrl: 'https://github.com/authorize?state=s',
      browserNonce: 'browser-secret',
    });
    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });

  it('forwards the provider callback to the web app without completing it', () => {
    const { controller, connections, response } = setup();

    controller.oauthCallback(
      'github',
      { code: 'authorization-code', state: 'state', iss: 'https://issuer', extra: 'x' },
      response as never,
    );

    expect(connections.completeOAuth).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(
      303,
      'https://web.example.com/oauth/complete?provider=github&code=authorization-code&state=state&iss=https%3A%2F%2Fissuer',
    );
  });

  it('forwards provider errors so the web app can display them', () => {
    const { controller, response } = setup();

    controller.googleWorkspaceOAuthCallback(
      { error: 'access_denied' },
      response as never,
    );

    expect(response.redirect).toHaveBeenCalledWith(
      303,
      'https://web.example.com/oauth/complete?provider=google-workspace&error=access_denied',
    );
  });

  it('completes OAuth only for the signed-in user with the browser nonce', async () => {
    const { controller, connections, auth, response } = setup();
    const request = { headers: { authorization: 'Bearer t' } };

    const result = await controller.completeOAuth(
      request as never,
      'github',
      { code: 'c', state: 's', browserNonce: NONCE },
      response as never,
    );

    expect(auth.requireUser).toHaveBeenCalledWith(request);
    expect(connections.completeOAuth).toHaveBeenCalledWith(
      'github', 'c', 's', undefined, NONCE, 'user-1',
    );
    expect(result).toEqual({
      provider: 'github',
      status: 'connected',
      returnTo: '#mcp-services',
    });
  });

  it('completes Google Workspace OAuth for the signed-in user', async () => {
    const { controller, googleWorkspaceOAuth, response } = setup();

    const result = await controller.completeGoogleWorkspaceOAuth(
      {} as never,
      { code: 'c', state: 's', browserNonce: NONCE },
      response as never,
    );

    expect(googleWorkspaceOAuth.complete).toHaveBeenCalledWith('c', 's', NONCE, 'user-1');
    expect(result.status).toBe('connected');
  });

  it('does not complete when the caller is not signed in', async () => {
    const { controller, connections, auth, response } = setup();
    auth.requireUser.mockRejectedValue(new Error('unauthorized'));

    await expect(
      controller.completeOAuth(
        {} as never,
        'github',
        { code: 'c', state: 's', browserNonce: NONCE },
        response as never,
      ),
    ).rejects.toThrow('unauthorized');
    expect(connections.completeOAuth).not.toHaveBeenCalled();
  });
});
