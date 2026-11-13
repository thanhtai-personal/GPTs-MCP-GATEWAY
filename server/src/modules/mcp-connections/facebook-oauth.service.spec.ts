import { SecretCipherService } from '@server/root/common/security/secret-cipher.service';
import { FacebookOAuthService } from '@server/root/modules/mcp-connections/facebook-oauth.service';

describe('FacebookOAuthService', () => {
  const setup = () => {
    const config = {
      credentialEncryptionKey: Buffer.alloc(32, 7).toString('base64'),
      publicBaseUrl: 'https://gateway.example.com',
      metaAppId: 'meta-app-id',
      metaAppSecret: 'server-secret',
      metaFacebookLoginConfigId: 'login-config-id',
      metaGraphApiVersion: 'v27.0',
      mcpOAuthStateTtlSeconds: 600,
      upstreamTimeoutMs: 1000,
    } as never;
    const cipher = new SecretCipherService(config);
    const transactions = {
      begin: jest.fn().mockResolvedValue({ id: 'tx-1', browserNonce: 'browser-nonce' }),
      consume: jest.fn().mockResolvedValue(undefined),
    };
    const auth = { requireUser: jest.fn().mockResolvedValue({ id: 'user-1' }), getUserById: jest.fn().mockResolvedValue({ id: 'user-1' }) };
    const connections = { connectFacebookCredential: jest.fn().mockResolvedValue({ provider: 'facebook', status: 'connected' }) };
    return { service: new FacebookOAuthService(auth as never, cipher, config, connections as never, transactions as never), cipher, transactions, connections };
  };

  it('creates Login for Business URL with encrypted user-bound state', async () => {
    const { service, cipher, transactions } = setup();
    const result = await service.start({} as never);
    const url = new URL(result.authorizationUrl);
    expect(url.origin).toBe('https://www.facebook.com');
    expect(url.searchParams.get('config_id')).toBe('login-config-id');
    expect(url.searchParams.get('client_id')).toBe('meta-app-id');
    const state = JSON.parse(cipher.decrypt(url.searchParams.get('state')!));
    expect(state.userId).toBe('user-1');
    expect(state.transactionId).toBe('tx-1');
    expect(transactions.begin).toHaveBeenCalledWith('user-1', 'facebook');
  });

  it('rejects a state belonging to another Gateway user', async () => {
    const { service, cipher, transactions } = setup();
    const state = cipher.encrypt(JSON.stringify({ version: 1, userId: 'other', transactionId: 'tx-1', issuedAt: Date.now() }));
    await expect(service.complete('code', state, 'browser-nonce', 'user-1')).rejects.toMatchObject({ response: { code: 'MCP_OAUTH_STATE_INVALID' } });
    expect(transactions.consume).not.toHaveBeenCalled();
  });

  it('stores exchanged token without returning it to the client', async () => {
    const { service, cipher, transactions, connections } = setup();
    const state = cipher.encrypt(JSON.stringify({ version: 1, userId: 'user-1', transactionId: 'tx-1', issuedAt: Date.now() }));
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'private-token', expires_in: 3600 }),
    } as Response);
    try {
      const result = await service.complete('code', state, 'browser-nonce', 'user-1');
      expect(transactions.consume).toHaveBeenCalledWith('tx-1', 'user-1', 'facebook', 'browser-nonce');
      expect(connections.connectFacebookCredential).toHaveBeenCalledWith('user-1', expect.objectContaining({ accessToken: 'private-token' }));
      expect(JSON.stringify(result)).not.toContain('private-token');
    } finally { fetchSpy.mockRestore(); }
  });
});
