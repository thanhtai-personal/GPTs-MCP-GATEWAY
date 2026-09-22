import type { McpJsonSchema, McpToolCallResult } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

export const LOCAL_PC_SERVICE_ID = 'local-pc';

export type LocalAgentTool = {
  name: string;
  title?: string;
  description?: string;
  inputSchema: McpJsonSchema;
};

export type RegisterLocalAgentInput = {
  name: string;
  tools: LocalAgentTool[];
};

export type CompleteLocalAgentJobInput = {
  result: McpToolCallResult;
};
