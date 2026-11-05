import { GoogleDocsMcpAdapter } from '@server/root/modules/mcp-gateway/providers/google/google-docs-mcp.adapter';

describe('GoogleDocsMcpAdapter', () => {
  it('uses the official Docs API batchUpdate endpoint', async () => {
    const api = {
      sendJson: jest.fn().mockResolvedValue({ documentId: 'doc-1', replies: [] }),
    };
    const adapter = new GoogleDocsMcpAdapter(api as never, { refresh: jest.fn() } as never);

    await expect(
      adapter.callTool(
        { kind: 'oauth', accessToken: 'token', tokenType: 'Bearer' },
        'batch_update_document',
        { documentId: 'doc-1', requests: [{ insertText: { location: { index: 1 }, text: 'Hello' } }] },
      ),
    ).resolves.toEqual({ documentId: 'doc-1', replies: [] });

    expect(api.sendJson).toHaveBeenCalledWith(
      'docs',
      'token',
      'POST',
      '/documents/doc-1:batchUpdate',
      { requests: [{ insertText: { location: { index: 1 }, text: 'Hello' } }] },
    );
  });
});
