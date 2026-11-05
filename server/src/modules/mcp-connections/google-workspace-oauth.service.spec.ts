import { SecretCipherService } from '@server/root/common/security/secret-cipher.service';
import { createHash } from 'node:crypto';
import { GoogleWorkspaceOAuthService } from '@server/root/modules/mcp-connections/google-workspace-oauth.service';

describe('GoogleWorkspaceOAuthService', () => {
  it('requests full Drive, Docs, and Sheets scopes while using PKCE', async () => {
    const config = {
      credentialEncryptionKey: Buffer.alloc(32, 8).toString('base64'),
      publicBaseUrl: 'https://gateway.example.com',
      googleWorkspaceOAuthClientId: 'google-client',
      googleWorkspaceOAuthClientSecret: 'google-secret',
      mcpOAuthStateTtlSeconds: 600,
    } as never;
    const transactions = {
      begin: jest.fn().mockResolvedValue({ id: 'transaction-1', browserNonce: 'nonce' }),
      consume: jest.fn().mockRejectedValue(new Error('different browser')),
    };
    const cipher = new SecretCipherService(config);
    const service = new GoogleWorkspaceOAuthService(
      {
        requireUser: jest.fn().mockResolvedValue({ id: 'user-1', email: 'user@example.com' }),
        getUserById: jest.fn().mockResolvedValue({ id: 'user-1' }),
      } as never,
      cipher,
      config,
      {} as never,
      transactions as never,
    );
    const fetchSpy = jest.spyOn(global, 'fetch');
    try {
      const started = await service.start({} as never);
      const url = new URL(started.authorizationUrl);
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/u);
      expect(started.browserNonce).toBe('nonce');
      const scopes = new Set(url.searchParams.get('scope')?.split(' '));
      expect(scopes).toEqual(new Set([
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/spreadsheets',
      ]));
      const state = url.searchParams.get('state')!;
      const { codeVerifier } = JSON.parse(cipher.decrypt(state)) as { codeVerifier: string };
      expect(url.searchParams.get('code_challenge')).toBe(
        createHash('sha256').update(codeVerifier).digest('base64url'),
      );

      await expect(
        service.complete('code', state, 'other-browser', 'user-1'),
      ).rejects.toThrow('different browser');
      await expect(
        service.complete('code', state, 'nonce', 'user-2'),
      ).rejects.toMatchObject({ response: { code: 'MCP_OAUTH_STATE_INVALID' } });
      expect(transactions.consume).toHaveBeenCalledTimes(1);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
