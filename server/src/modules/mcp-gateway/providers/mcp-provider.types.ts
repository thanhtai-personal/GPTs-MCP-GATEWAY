export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | JsonObject;

export type JsonObject = {
  [key: string]: JsonValue;
};

export type McpToolArguments = JsonObject;
export type McpJsonSchema = JsonObject;

export type McpProviderCredential =
  | {
      kind: 'api_key';
      value: string;
    };

export type McpProviderCredentialDefinition = {
  kind: McpProviderCredential['kind'];
  label: string;
  placeholder?: string;
};

export type McpToolDefinition = {
  name: string;
  title?: string;
  description?: string;
  inputSchema: McpJsonSchema;
  outputSchema?: McpJsonSchema;
  annotations?: JsonObject;
  meta?: JsonObject;
};

export type McpToolCallResult = JsonObject & {
  isError?: boolean;
};

export interface McpProviderAdapter {
  readonly id: string;
  readonly displayName: string;
  readonly credential: McpProviderCredentialDefinition;

  testConnection(credential: McpProviderCredential): Promise<void>;
  listTools(credential: McpProviderCredential): Promise<McpToolDefinition[]>;
  callTool(
    credential: McpProviderCredential,
    toolName: string,
    argumentsValue: McpToolArguments,
  ): Promise<McpToolCallResult>;
}
