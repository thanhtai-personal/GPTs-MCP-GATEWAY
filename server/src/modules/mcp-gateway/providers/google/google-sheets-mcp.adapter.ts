import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { GoogleWorkspaceTokenService } from '@server/root/modules/mcp-gateway/providers/google/google-workspace-token.service';
import { GoogleWorkspaceApiClient } from '@server/root/modules/mcp-gateway/providers/google/google-workspace-api.client';
import type {
  JsonValue,
  McpOAuthCredential,
  McpProviderAdapter,
  McpProviderCredential,
  McpProviderCredentialDefinition,
  McpToolArguments,
  McpToolCallResult,
  McpToolDefinition,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

const SHEETS_API = 'sheets';
const SPREADSHEET_ID = { type: 'string', description: 'Google Sheets spreadsheet ID.' };
const RANGE = { type: 'string', description: 'A1 notation range, for example Sheet1!A1:Z100.' };
const VALUES = {
  type: 'array',
  items: { type: 'array', items: {} },
  description: 'Two-dimensional cell values array.',
};
const REQUESTS_SCHEMA = {
  type: 'array',
  items: { type: 'object', additionalProperties: true },
  description: 'Google Sheets API batchUpdate request objects.',
};

export const GOOGLE_SHEETS_TOOLS: McpToolDefinition[] = [
  {
    name: 'get_spreadsheet',
    title: 'Get spreadsheet',
    description: 'Read spreadsheet metadata and sheet structure through the official Google Sheets API.',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: SPREADSHEET_ID,
        includeGridData: { type: 'boolean' },
        range: { type: 'string', description: 'Optional A1 notation range to limit returned grid data.' },
      },
      required: ['spreadsheetId'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  {
    name: 'get_values',
    title: 'Read cell values',
    description: 'Read a cell range using A1 notation.',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
        majorDimension: { type: 'string', enum: ['ROWS', 'COLUMNS'] },
        valueRenderOption: { type: 'string', enum: ['FORMATTED_VALUE', 'UNFORMATTED_VALUE', 'FORMULA'] },
      },
      required: ['spreadsheetId', 'range'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  {
    name: 'update_values',
    title: 'Update cell values',
    description: 'Write values to a cell range. Choose RAW to preserve literal values or USER_ENTERED to parse formulas and dates.',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
        values: VALUES,
        valueInputOption: { type: 'string', enum: ['RAW', 'USER_ENTERED'], default: 'USER_ENTERED' },
      },
      required: ['spreadsheetId', 'range', 'values'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
  {
    name: 'append_values',
    title: 'Append rows',
    description: 'Append rows after the last row of a table in a cell range.',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
        values: VALUES,
        valueInputOption: { type: 'string', enum: ['RAW', 'USER_ENTERED'], default: 'USER_ENTERED' },
        insertDataOption: { type: 'string', enum: ['OVERWRITE', 'INSERT_ROWS'], default: 'INSERT_ROWS' },
      },
      required: ['spreadsheetId', 'range', 'values'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
  {
    name: 'clear_values',
    title: 'Clear cell values',
    description: 'Clear values in a cell range without deleting its formatting.',
    inputSchema: {
      type: 'object',
      properties: { spreadsheetId: SPREADSHEET_ID, range: RANGE },
      required: ['spreadsheetId', 'range'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
  {
    name: 'batch_update_spreadsheet',
    title: 'Edit spreadsheet structure and formatting',
    description: 'Apply Google Sheets API batchUpdate requests for dimensions, formatting, formulas, sheet structure, and other supported spreadsheet operations.',
    inputSchema: {
      type: 'object',
      properties: { spreadsheetId: SPREADSHEET_ID, requests: REQUESTS_SCHEMA },
      required: ['spreadsheetId', 'requests'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
];

function requiredString(args: McpToolArguments, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException({
      code: 'MCP_TOOL_ARGUMENTS_INVALID',
      message: `${key} must be a non-empty string`,
    });
  }
  return value;
}

function valuesArray(args: McpToolArguments): JsonValue[] {
  const value = args.values;
  if (!Array.isArray(value) || value.some((row) => !Array.isArray(row))) {
    throw new BadRequestException({
      code: 'MCP_TOOL_ARGUMENTS_INVALID',
      message: 'values must be a two-dimensional array',
    });
  }
  return value;
}

function requestArray(args: McpToolArguments): JsonValue[] {
  const value = args.requests;
  if (!Array.isArray(value)) {
    throw new BadRequestException({
      code: 'MCP_TOOL_ARGUMENTS_INVALID',
      message: 'requests must be an array',
    });
  }
  return value;
}

@Injectable()
export class GoogleSheetsMcpAdapter implements McpProviderAdapter {
  readonly id = 'google-sheets' as const;
  readonly credentialOwner = { id: 'google-workspace', displayName: 'Google Workspace' } as const;
  readonly displayName = 'Google Sheets';
  readonly credential: McpProviderCredentialDefinition;

  constructor(
    private readonly api: GoogleWorkspaceApiClient,
    private readonly tokens: GoogleWorkspaceTokenService,
  ) {
    this.credential = {
      kind: 'oauth',
      label: 'Google Workspace OAuth',
      connectLabel: { en: 'Grant Google Docs + Sheets access', vi: 'Cấp quyền Google Docs + Sheets' },
      configured: tokens.configured,
      note: {
        en: 'Uses the official Google Sheets API. Reconnect after changing Google Workspace OAuth scopes.',
        vi: 'Sử dụng Google Sheets API chính thức. Hãy kết nối lại sau khi thay đổi OAuth scope của Google Workspace.',
      },
    };
  }

  async testConnection(credential: McpProviderCredential): Promise<void> {
    this.oauthCredential(credential);
  }

  async listTools(credential: McpProviderCredential): Promise<McpToolDefinition[]> {
    this.oauthCredential(credential);
    return GOOGLE_SHEETS_TOOLS;
  }

  async callTool(
    credential: McpProviderCredential,
    toolName: string,
    args: McpToolArguments,
  ): Promise<McpToolCallResult> {
    const token = this.oauthCredential(credential).accessToken;
    const spreadsheetId = encodeURIComponent(requiredString(args, 'spreadsheetId'));
    const range = typeof args.range === 'string' ? args.range : undefined;
    switch (toolName) {
      case 'get_spreadsheet': {
        return this.api.getJson(SHEETS_API, token, `/spreadsheets/${spreadsheetId}`, {
          ...(typeof args.includeGridData === 'boolean' ? { includeGridData: args.includeGridData } : {}),
          ...(typeof args.range === 'string' ? { ranges: args.range } : {}),
        });
      }
      case 'get_values':
        return this.api.getJson(
          SHEETS_API,
          token,
          `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(requiredRange(range))}`,
          {
            ...(typeof args.majorDimension === 'string' ? { majorDimension: args.majorDimension } : {}),
            ...(typeof args.valueRenderOption === 'string' ? { valueRenderOption: args.valueRenderOption } : {}),
          },
        );
      case 'update_values':
        return this.api.sendJson(
          SHEETS_API,
          token,
          'PUT',
          `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(requiredRange(range))}`,
          { values: valuesArray(args) },
          { valueInputOption: typeof args.valueInputOption === 'string' ? args.valueInputOption : 'USER_ENTERED' },
        );
      case 'append_values':
        return this.api.sendJson(
          SHEETS_API,
          token,
          'POST',
          `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(requiredRange(range))}:append`,
          { values: valuesArray(args) },
          {
            valueInputOption: typeof args.valueInputOption === 'string' ? args.valueInputOption : 'USER_ENTERED',
            insertDataOption: typeof args.insertDataOption === 'string' ? args.insertDataOption : 'INSERT_ROWS',
          },
        );
      case 'clear_values':
        return this.api.sendJson(
          SHEETS_API,
          token,
          'POST',
          `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(requiredRange(range))}:clear`,
          {},
        );
      case 'batch_update_spreadsheet':
        return this.api.sendJson(
          SHEETS_API,
          token,
          'POST',
          `/spreadsheets/${spreadsheetId}:batchUpdate`,
          { requests: requestArray(args) },
        );
      default:
        throw new BadRequestException({
          code: 'MCP_TOOL_NOT_FOUND',
          message: `Google Sheets tool not found: ${toolName}`,
        });
    }
  }

  refreshCredential(credential: McpOAuthCredential): Promise<McpOAuthCredential> {
    return this.tokens.refresh(credential);
  }

  private oauthCredential(credential: McpProviderCredential): McpOAuthCredential {
    if (credential.kind !== 'oauth') {
      throw new UnauthorizedException({
        code: 'MCP_INVALID_CREDENTIAL',
        message: 'Google Sheets requires a Google OAuth credential',
      });
    }
    return credential;
  }
}

function requiredRange(value: string | undefined): string {
  if (!value?.trim()) {
    throw new BadRequestException({
      code: 'MCP_TOOL_ARGUMENTS_INVALID',
      message: 'range must be a non-empty string',
    });
  }
  return value;
}
