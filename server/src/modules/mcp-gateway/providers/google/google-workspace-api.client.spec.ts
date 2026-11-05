import type { AppConfigService } from '@server/root/common/config/app-config.service';
import { GoogleWorkspaceApiClient } from '@server/root/modules/mcp-gateway/providers/google/google-workspace-api.client';

describe('GoogleWorkspaceApiClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('sends authenticated Google Sheets API requests with query parameters', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ spreadsheetId: 'sheet-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    global.fetch = fetchMock as typeof fetch;
    const client = new GoogleWorkspaceApiClient({ upstreamTimeoutMs: 5_000 } as AppConfigService);

    await expect(
      client.getJson('sheets', 'access-token', '/spreadsheets/sheet-1', { includeGridData: false }),
    ).resolves.toEqual({ spreadsheetId: 'sheet-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        href: 'https://sheets.googleapis.com/v4/spreadsheets/sheet-1?includeGridData=false',
      }),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      }),
    );
  });

  it('maps Google permission errors to a clear forbidden response', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'The caller does not have permission' } }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as typeof fetch;
    const client = new GoogleWorkspaceApiClient({ upstreamTimeoutMs: 5_000 } as AppConfigService);

    await expect(client.getJson('docs', 'token', '/documents/doc-1')).rejects.toMatchObject({
      response: { code: 'GOOGLE_WORKSPACE_API_PERMISSION_DENIED' },
    });
  });
});
