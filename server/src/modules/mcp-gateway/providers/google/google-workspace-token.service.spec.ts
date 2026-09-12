import type { AppConfigService } from '@server/root/common/config/app-config.service';
import { GoogleWorkspaceTokenService } from '@server/root/modules/mcp-gateway/providers/google/google-workspace-token.service';

describe('GoogleWorkspaceTokenService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('refreshes the encrypted Google provider credential', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'next-token',
          expires_in: 3600,
          scope: 'docs sheets',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    ) as typeof fetch;

    const config = {
      googleWorkspaceOAuthClientId: 'client',
      googleWorkspaceOAuthClientSecret: 'secret',
      upstreamTimeoutMs: 30_000,
    } as AppConfigService;

    const service = new GoogleWorkspaceTokenService(config);
    const refreshed = await service.refresh({
      kind: 'oauth',
      accessToken: 'old-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
    });

    expect(refreshed.accessToken).toBe('next-token');
    expect(refreshed.refreshToken).toBe('refresh-token');
    expect(refreshed.expiresAt).toBeDefined();
  });
});
