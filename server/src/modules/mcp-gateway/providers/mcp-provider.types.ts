export type McpProviderId = 'stitch';

export type McpToolDefinition = {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

export type McpToolCallResult = {
  content?: unknown;
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

export interface McpProviderAdapter {
  readonly id: McpProviderId;
  readonly displayName: string;
  testConnection(apiKey: string): Promise<void>;
  listTools(apiKey: string): Promise<McpToolDefinition[]>;
  callTool(
    apiKey: string,
    toolName: string,
    argumentsValue: Record<string, unknown>,
  ): Promise<McpToolCallResult>;
}
