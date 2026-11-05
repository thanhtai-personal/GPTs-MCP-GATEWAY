import { GoogleSheetsMcpAdapter } from '@server/root/modules/mcp-gateway/providers/google/google-sheets-mcp.adapter';

describe('GoogleSheetsMcpAdapter', () => {
  it('uses the official Sheets API batchUpdate endpoint for structural edits', async () => {
    const api = {
      sendJson: jest.fn().mockResolvedValue({ spreadsheetId: 'sheet-1', replies: [] }),
    };
    const adapter = new GoogleSheetsMcpAdapter(api as never, { refresh: jest.fn() } as never);

    await expect(
      adapter.callTool(
        { kind: 'oauth', accessToken: 'token', tokenType: 'Bearer' },
        'batch_update_spreadsheet',
        {
          spreadsheetId: 'sheet-1',
          requests: [{ deleteDimension: { range: { dimension: 'COLUMNS', startIndex: 20, endIndex: 21 } } }],
        },
      ),
    ).resolves.toEqual({ spreadsheetId: 'sheet-1', replies: [] });

    expect(api.sendJson).toHaveBeenCalledWith(
      'sheets',
      'token',
      'POST',
      '/spreadsheets/sheet-1:batchUpdate',
      { requests: [{ deleteDimension: { range: { dimension: 'COLUMNS', startIndex: 20, endIndex: 21 } } }] },
    );
  });
});
