import type { AppConfigService } from '@server/root/common/config/app-config.service';
import type { GoogleWorkspaceTokenService } from '@server/root/modules/mcp-gateway/providers/google/google-workspace-token.service';
import { GoogleDriveApiClient } from '@server/root/modules/mcp-gateway/providers/google-drive/google-drive-api.client';
import { GoogleDriveAdapter } from '@server/root/modules/mcp-gateway/providers/google-drive/google-drive.adapter';
import { buildDriveQuery } from '@server/root/modules/mcp-gateway/providers/google-drive/google-drive.operations';
import type { McpOAuthCredential } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

const credential: McpOAuthCredential = {
  kind: 'oauth',
  accessToken: 'access-token',
  tokenType: 'Bearer',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function setup() {
  const config = {
    upstreamTimeoutMs: 5_000,
    upstreamMaxResponseBytes: 1_000_000,
  } as AppConfigService;
  const tokens = {
    configured: true,
    refresh: jest.fn(),
  } as unknown as GoogleWorkspaceTokenService;
  const adapter = new GoogleDriveAdapter(new GoogleDriveApiClient(config), tokens);
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  return { adapter, fetchMock, tokens };
}

function calledUrl(fetchMock: jest.SpyInstance, index = 0): URL {
  return new URL(String(fetchMock.mock.calls[index][0]));
}

describe('GoogleDriveAdapter', () => {
  afterEach(() => jest.restoreAllMocks());

  it('shares the google-workspace credential and exposes a static tool catalog', async () => {
    const { adapter, fetchMock } = setup();

    const tools = await adapter.listTools(credential);

    expect(adapter.credentialOwner.id).toBe('google-workspace');
    expect(tools.map((tool) => tool.name)).toEqual([
      'search_files',
      'list_files',
      'get_file_metadata',
      'read_file_content',
      'create_file',
      'update_file',
      'trash_file',
      'share_file',
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects API key credentials', async () => {
    const { adapter } = setup();

    await expect(
      adapter.listTools({ kind: 'api_key', value: 'x' }),
    ).rejects.toMatchObject({ response: { code: 'MCP_INVALID_CREDENTIAL' } });
  });

  it('searches with the user access token and a keyword query', async () => {
    const { adapter, fetchMock } = setup();
    fetchMock.mockResolvedValue(jsonResponse({ files: [{ id: '1', name: 'Q4' }] }));

    const result = await adapter.callTool(credential, 'search_files', {
      query: "Q4 board's deck",
      pageSize: 5,
    });

    const url = calledUrl(fetchMock);
    expect(url.pathname).toBe('/drive/v3/files');
    expect(url.searchParams.get('q')).toBe(
      "((name contains 'Q4 board\\'s deck' or fullText contains 'Q4 board\\'s deck')) and trashed = false",
    );
    expect(url.searchParams.get('pageSize')).toBe('5');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer access-token',
    );
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({
      result: { files: [{ id: '1', name: 'Q4' }] },
    });
  });

  it('exports Google Docs as text and truncates to maxChars', async () => {
    const { adapter, fetchMock } = setup();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ id: 'doc1', mimeType: 'application/vnd.google-apps.document' }),
      )
      .mockResolvedValueOnce(new Response('x'.repeat(150)));

    const result = await adapter.callTool(credential, 'read_file_content', {
      fileId: 'doc1',
      maxChars: 100,
    });

    const exportUrl = calledUrl(fetchMock, 1);
    expect(exportUrl.pathname).toBe('/drive/v3/files/doc1/export');
    expect(exportUrl.searchParams.get('mimeType')).toBe('text/plain');
    const value = (result.structuredContent as unknown as { result: { content: string; note: string } }).result;
    expect(value.content).toHaveLength(100);
    expect(value.note).toContain('Truncated to 100 of 150');
  });

  it('creates a Google Doc with a multipart upload', async () => {
    const { adapter, fetchMock } = setup();
    fetchMock.mockResolvedValue(jsonResponse({ id: 'new', webViewLink: 'https://docs/new' }));

    await adapter.callTool(credential, 'create_file', {
      name: 'Notes',
      content: '# Hello',
      mimeType: 'text/markdown',
      googleType: 'doc',
    });

    const url = calledUrl(fetchMock);
    expect(url.pathname).toBe('/upload/drive/v3/files');
    expect(url.searchParams.get('uploadType')).toBe('multipart');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(String(init.body)).toContain(
      '"mimeType":"application/vnd.google-apps.document"',
    );
    expect(String(init.body)).toContain('Content-Type: text/markdown');
    expect(String(init.body)).toContain('# Hello');
  });

  it('returns a tool error explaining drive.file limits on 403', async () => {
    const { adapter, fetchMock } = setup();
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { message: 'Insufficient permissions' } }, 403),
    );

    const result = await adapter.callTool(credential, 'trash_file', { fileId: 'f1' });

    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toContain('only modify files it created');
  });

  it('asks for reconnection on 401', async () => {
    const { adapter, fetchMock } = setup();
    fetchMock.mockResolvedValue(jsonResponse({ error: { message: 'bad token' } }, 401));

    await expect(
      adapter.callTool(credential, 'get_file_metadata', { fileId: 'f1' }),
    ).rejects.toMatchObject({ response: { code: 'MCP_OAUTH_RECONNECT_REQUIRED' } });
  });

  it('validates arguments before calling Drive', async () => {
    const { adapter, fetchMock } = setup();

    await expect(
      adapter.callTool(credential, 'share_file', { fileId: 'f1' }),
    ).rejects.toMatchObject({ response: { code: 'MCP_TOOL_ARGUMENTS_INVALID' } });
    await expect(
      adapter.callTool(credential, 'unknown_tool', {}),
    ).rejects.toMatchObject({ response: { code: 'MCP_TOOL_NOT_FOUND' } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshes through the shared Google Workspace token service', async () => {
    const { adapter, tokens } = setup();

    await adapter.refreshCredential(credential);

    expect(tokens.refresh).toHaveBeenCalledWith(credential);
  });
});

describe('buildDriveQuery', () => {
  it('passes raw Drive queries through and keeps explicit trashed filters', () => {
    expect(buildDriveQuery("name contains 'x'")).toBe(
      "(name contains 'x') and trashed = false",
    );
    expect(buildDriveQuery('trashed = true')).toBe('trashed = true');
  });
});
