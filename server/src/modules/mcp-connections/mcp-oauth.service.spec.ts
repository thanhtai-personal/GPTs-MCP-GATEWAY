import { SecretCipherService } from '@server/root/common/security/secret-cipher.service';
import { McpOAuthService } from '@server/root/modules/mcp-connections/mcp-oauth.service';

describe('McpOAuthService browser binding', () => {
  it('rejects a callback from another browser before exchanging its code', async () => {
    const config = {
      credentialEncryptionKey: Buffer.alloc(32, 7).toString('base64'),
      publicBaseUrl: 'https://gateway.example.com',
      mcpOAuthStateTtlSeconds: 600,
    } as never;
    const protocol = {
      discoverAuthorizationServer: jest.fn().mockResolvedValue({
        authorizationEndpoint: 'https://github.com/login/oauth/authorize',
        tokenEndpoint: 'https://github.com/login/oauth/access_token',
        issuer: 'https://github.com',
        resource: 'https://api.githubcopilot.com/mcp',
        scopesSupported: [],
      }),
      exchangeAuthorizationCode: jest.fn(),
    };
    const transactions = {
      begin: jest.fn().mockResolvedValue({ id: 'transaction-1', browserNonce: 'nonce' }),
      consume: jest.fn().mockRejectedValue(new Error('different browser')),
    };
    const service = new McpOAuthService(
      config,
      new SecretCipherService(config),
      protocol as never,
      {} as never,
      transactions as never,
    );
    const provider = {
      id: 'github',
      displayName: 'GitHub',
      credential: { kind: 'oauth' },
      oauth: {
        resourceUrl: 'https://api.githubcopilot.com/mcp',
        protectedResourceMetadataUrl: 'https://api.githubcopilot.com/.well-known/oauth-protected-resource/mcp',
        authorizationServerOrigins: ['https://github.com'],
        clientId: 'client-id',
      },
    } as never;

    const started = await service.createAuthorizationRequest('user-1', provider);
    const state = new URL(started.authorizationUrl).searchParams.get('state')!;

    await expect(
      service.exchangeAuthorizationCode(provider, 'code', state, undefined, 'other-browser', 'user-1'),
    ).rejects.toThrow('different browser');
    await expect(
      service.exchangeAuthorizationCode(provider, 'code', state, undefined, 'nonce', 'user-2'),
    ).rejects.toMatchObject({ response: { code: 'MCP_OAUTH_STATE_INVALID' } });
    expect(transactions.consume).toHaveBeenCalledTimes(1);
    expect(started.browserNonce).toBe('nonce');
    expect(protocol.exchangeAuthorizationCode).not.toHaveBeenCalled();
  });
});
