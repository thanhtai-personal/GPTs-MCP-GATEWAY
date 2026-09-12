import type { SecretCipherService } from '@server/root/common/security/secret-cipher.service';
import { McpCredentialCodec } from '@server/root/modules/mcp-connections/mcp-credential-codec.service';
import type {
  McpProviderAdapter,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

const cipher = {
  encrypt: (value: string) => `encrypted:${Buffer.from(value).toString('base64url')}`,
  decrypt: (value: string) =>
    Buffer.from(value.slice('encrypted:'.length), 'base64url').toString('utf8'),
} as SecretCipherService;

function provider(
  kind: 'api_key' | 'oauth',
): McpProviderAdapter {
  return {
    id: 'test',
    displayName: 'Test',
    credential:
      kind === 'api_key'
        ? { kind: 'api_key', label: 'API Key' }
        : {
            kind: 'oauth',
            label: 'OAuth',
            connectLabel: { en: 'Connect', vi: 'Kết nối' },
            configured: true,
          },
    ...(kind === 'oauth'
      ? {
          oauth: {
            resourceUrl: 'https://mcp.example.test/mcp',
            protectedResourceMetadataUrl:
              'https://mcp.example.test/.well-known/oauth-protected-resource',
            authorizationServerOrigins: ['https://mcp.example.test'],
            clientId: 'client',
          },
        }
      : {}),
    testConnection: async () => undefined,
    listTools: async () => [],
    callTool: async () => ({ content: [] }),
  };
}

describe('McpCredentialCodec', () => {
  const codec = new McpCredentialCodec(cipher);

  it('keeps legacy API-key rows compatible with credential version 1', () => {
    const encoded = codec.encode({ kind: 'api_key', value: 'secret-key' });

    expect(encoded.version).toBe(1);
    expect(codec.decode(encoded.ciphertext, encoded.version, provider('api_key'))).toEqual({
      kind: 'api_key',
      value: 'secret-key',
    });
  });

  it('round-trips encrypted OAuth access and refresh tokens as version 2', () => {
    const credential = {
      kind: 'oauth' as const,
      accessToken: 'access',
      refreshToken: 'refresh',
      tokenType: 'Bearer' as const,
      expiresAt: '2099-01-01T00:00:00.000Z',
      scope: 'read write',
    };

    const encoded = codec.encode(credential);

    expect(encoded.version).toBe(2);
    expect(codec.decode(encoded.ciphertext, encoded.version, provider('oauth'))).toEqual(
      credential,
    );
  });
});
