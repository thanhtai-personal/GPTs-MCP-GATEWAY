import { AppConfigService } from '@server/root/common/config/app-config.service';
import { McpOAuthClientRegistrationClient } from '@server/root/modules/mcp-connections/mcp-oauth-client-registration.client';

describe('McpOAuthClientRegistrationClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('registers a PKCE-compatible dynamic OAuth client', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          client_id: 'dynamic-client',
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    ) as typeof fetch;

    const client = new McpOAuthClientRegistrationClient(
      new AppConfigService(),
    );
    const result = await client.register(
      'https://mcp.notion.com/register',
      {
        clientName: 'MCP Gateway',
        redirectUri:
          'https://gateway.example/api/v1/mcp-connections/notion/oauth/callback',
      },
    );

    expect(result).toEqual({ clientId: 'dynamic-client' });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(String(init.body))).toMatchObject({
      client_name: 'MCP Gateway',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    });
  });
});
