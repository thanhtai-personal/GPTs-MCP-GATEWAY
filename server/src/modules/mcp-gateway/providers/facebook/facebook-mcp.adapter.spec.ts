import { FacebookMcpAdapter } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-mcp.adapter';
describe('FacebookMcpAdapter', () => {
  const config = { metaAppId: 'id', metaAppSecret: 'secret', metaFacebookLoginConfigId: 'config' } as never;
  it('lists Pages without returning Page access tokens', async () => {
    const api = { get: jest.fn().mockResolvedValue({ data: [{ id: 'page-1', name: 'Test Page', tasks: ['CREATE_CONTENT'], access_token: 'must-not-leak' }] }) };
    const adapter = new FacebookMcpAdapter(api as never, { createDraft: jest.fn(), approveDraft: jest.fn(), listPosts: jest.fn() } as never, { validatePageAccess: jest.fn(), publish: jest.fn() } as never, config);
    const result = await adapter.callTool({ kind: 'oauth', accessToken: 'user-token', tokenType: 'Bearer' }, 'facebook_list_pages', {});
    const serialized = JSON.stringify(result);
    expect(serialized).toContain('page-1'); expect(serialized).toContain('CREATE_CONTENT');
    expect(serialized).not.toContain('must-not-leak'); expect(serialized).not.toContain('access_token');
  });
  it('rejects API-key credentials', async () => {
    const adapter = new FacebookMcpAdapter({ get: jest.fn() } as never, { createDraft: jest.fn(), approveDraft: jest.fn(), listPosts: jest.fn() } as never, { validatePageAccess: jest.fn(), publish: jest.fn() } as never, config);
    await expect(adapter.listTools({ kind: 'api_key', value: 'secret' })).rejects.toMatchObject({ response: { code: 'MCP_INVALID_CREDENTIAL' } });
  });
  it('returns identity using the connected user token', async () => {
    const api = { get: jest.fn().mockResolvedValue({ id: 'app-scoped-id', name: 'Test User' }) };
    const adapter = new FacebookMcpAdapter(api as never, config);
    const result = await adapter.callTool({ kind: 'oauth', accessToken: 'user-token', tokenType: 'Bearer' }, 'facebook_get_identity', {});
    expect(api.get).toHaveBeenCalledWith('user-token', '/me', { fields: 'id,name' });
    expect(JSON.stringify(result)).toContain('app-scoped-id');
  });
});
