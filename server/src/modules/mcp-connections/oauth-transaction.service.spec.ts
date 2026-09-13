import { OAuthTransactionService } from '@server/root/modules/mcp-connections/oauth-transaction.service';

describe('OAuthTransactionService', () => {
  it('rejects a callback from another browser without consuming the transaction', async () => {
    const rows = new Map<string, Record<string, string>>();
    const client = fakeClient(rows);
    const service = new OAuthTransactionService({
      createServiceRoleClient: () => client,
    } as never, { mcpOAuthStateTtlSeconds: 600 } as never);

    const transaction = await service.begin('user-1', 'github');

    await expect(
      service.consume(transaction.id, 'user-1', 'github', 'wrong-browser'),
    ).rejects.toMatchObject({ status: 400 });
    expect(rows.size).toBe(1);

    await service.consume(
      transaction.id,
      'user-1',
      'github',
      transaction.browserNonce,
    );
    expect(rows.size).toBe(0);
  });

  it('consumes an OAuth transaction only once', async () => {
    const client = fakeClient(new Map());
    const service = new OAuthTransactionService({
      createServiceRoleClient: () => client,
    } as never, { mcpOAuthStateTtlSeconds: 600 } as never);

    const transaction = await service.begin('user-1', 'github');
    await service.consume(transaction.id, 'user-1', 'github', transaction.browserNonce);

    await expect(
      service.consume(transaction.id, 'user-1', 'github', transaction.browserNonce),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('uses a host-only secure browser cookie and rejects duplicate cookie values', () => {
    const service = new OAuthTransactionService({} as never, {
      publicBaseUrl: 'https://gateway.example.com',
      mcpOAuthStateTtlSeconds: 600,
    } as never);
    const response = { cookie: jest.fn(), clearCookie: jest.fn() };

    service.setBrowserCookie(response as never, 'github', 'nonce');
    expect(response.cookie).toHaveBeenCalledWith(
      '__Host-mcp-oauth-github',
      'nonce',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      }),
    );
    expect(service.readBrowserCookie({ headers: {
      cookie: '__Host-mcp-oauth-github=first; __Host-mcp-oauth-github=second',
    } } as never, 'github')).toBeUndefined();
    service.clearBrowserCookie(response as never, 'github');
    expect(response.clearCookie).toHaveBeenCalledWith(
      '__Host-mcp-oauth-github',
      expect.objectContaining({ httpOnly: true, secure: true, path: '/' }),
    );
  });
});

function fakeClient(rows: Map<string, Record<string, string>>) {
  return {
    from: () => ({
      insert: async (row: Record<string, string>) => {
        rows.set(row.id, row);
        return { error: null };
      },
      delete: () => {
        const filters: Record<string, string> = {};
        const query = {
          async lt(key: string, value: string) {
            for (const [id, row] of rows) {
              if (row[key] < value) rows.delete(id);
            }
            return { error: null };
          },
          eq(key: string, value: string) {
            filters[key] = value;
            return query;
          },
          gt(key: string, value: string) {
            filters[`gt:${key}`] = value;
            return query;
          },
          select() { return query; },
          async maybeSingle() {
            const row = rows.get(filters.id);
            if (
              row &&
              Object.entries(filters).every(([key, value]) =>
                key.startsWith('gt:')
                  ? row[key.slice(3)] > value
                  : row[key] === value,
              )
            ) {
              rows.delete(filters.id);
              return { data: { id: row.id }, error: null };
            }
            return { data: null, error: null };
          },
        };
        return query;
      },
    }),
  };
}
