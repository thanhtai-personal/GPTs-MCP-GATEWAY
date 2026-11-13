import type { McpToolDefinition } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
const readOnly = { readOnlyHint: true, openWorldHint: true };
export const FACEBOOK_MCP_TOOLS: McpToolDefinition[] = [
  { name: 'facebook_get_identity', title: 'Get Facebook identity',
    description: 'Return the connected Facebook account identity. The ID is app-scoped and is not an access token.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: readOnly },
  { name: 'facebook_list_pages', title: 'List managed Facebook Pages',
    description: 'List Pages accessible to the connected account. Returns identifiers and tasks only; Page access tokens are never returned.',
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 } }, additionalProperties: false },
    annotations: readOnly },
];
