import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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

const DOCUMENTS_API = 'docs';
const DOCUMENT_ID = { type: 'string', description: 'Google Docs document ID.' };
const REQUESTS_SCHEMA = {
  type: 'array',
  items: { type: 'object', additionalProperties: true },
  description: 'Google Docs API batchUpdate request objects.',
};

export const GOOGLE_DOCS_TOOLS: McpToolDefinition[] = [
  {
    name: 'get_document',
    title: 'Get Google Doc',
    description: 'Read a Google Docs document using the official Google Docs API.',
    inputSchema: {
      type: 'object',
      properties: { documentId: DOCUMENT_ID, includeTabsContent: { type: 'boolean' } },
      required: ['documentId'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  {
    name: 'create_document',
    title: 'Create Google Doc',
    description: 'Create a new Google Docs document.',
    inputSchema: {
      type: 'object',
      properties: { title: { type: 'string' } },
      required: ['title'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  },
  {
    name: 'batch_update_document',
    title: 'Edit Google Doc',
    description: 'Apply Google Docs API batchUpdate requests to insert, replace, format, or delete document content.',
    inputSchema: {
      type: 'object',
      properties: { documentId: DOCUMENT_ID, requests: REQUESTS_SCHEMA },
      required: ['documentId', 'requests'],
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
export class GoogleDocsMcpAdapter implements McpProviderAdapter {
  readonly id = 'google-docs' as const;
  readonly credentialOwner = { id: 'google-workspace', displayName: 'Google Workspace' } as const;
  readonly displayName = 'Google Docs';
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
        en: 'Uses the official Google Docs API. Reconnect after changing Google Workspace OAuth scopes.',
        vi: 'Sử dụng Google Docs API chính thức. Hãy kết nối lại sau khi thay đổi OAuth scope của Google Workspace.',
      },
    };
  }

  async testConnection(credential: McpProviderCredential): Promise<void> {
    this.oauthCredential(credential);
  }

  async listTools(credential: McpProviderCredential): Promise<McpToolDefinition[]> {
    this.oauthCredential(credential);
    return GOOGLE_DOCS_TOOLS;
  }

  async callTool(
    credential: McpProviderCredential,
    toolName: string,
    args: McpToolArguments,
  ): Promise<McpToolCallResult> {
    const token = this.oauthCredential(credential).accessToken;
    switch (toolName) {
      case 'get_document': {
        const documentId = encodeURIComponent(requiredString(args, 'documentId'));
        const includeTabsContent = args.includeTabsContent;
        return this.api.getJson(DOCUMENTS_API, token, `/documents/${documentId}`, {
          ...(typeof includeTabsContent === 'boolean' ? { includeTabsContent } : {}),
        });
      }
      case 'create_document':
        return this.api.sendJson(DOCUMENTS_API, token, 'POST', '/documents', {
          title: requiredString(args, 'title'),
        });
      case 'batch_update_document': {
        const documentId = encodeURIComponent(requiredString(args, 'documentId'));
        return this.api.sendJson(
          DOCUMENTS_API,
          token,
          'POST',
          `/documents/${documentId}:batchUpdate`,
          { requests: requestArray(args) },
        );
      }
      default:
        throw new BadRequestException({
          code: 'MCP_TOOL_NOT_FOUND',
          message: `Google Docs tool not found: ${toolName}`,
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
        message: 'Google Docs requires a Google OAuth credential',
      });
    }
    return credential;
  }
}
