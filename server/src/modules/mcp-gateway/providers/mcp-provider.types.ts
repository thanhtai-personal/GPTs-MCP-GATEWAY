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

export type McpProviderCatalogStatus =
  | 'available'
  | 'requires_configuration'
  | 'pending_review'
  | 'provider_restricted';

export type McpApiKeyCredential = {
  kind: 'api_key';
  value: string;
};

export type McpProviderAccessMode = 'read' | 'write';

export type McpOAuthCredential = {
  kind: 'oauth';
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresAt?: string;
  scope?: string;
  clientId?: string;
  clientSecret?: string;
  accessMode?: McpProviderAccessMode;
};

export type McpProviderCredential =
  | McpApiKeyCredential
  | McpOAuthCredential;

export type McpProviderCredentialDefinition =
  | {
      kind: 'api_key';
      label: string;
      placeholder?: string;
    }
  | {
      kind: 'oauth';
      label: string;
      connectLabel: { en: string; vi: string };
      configured: boolean;
      note?: { en: string; vi: string };
      accessModes?: {
        default: McpProviderAccessMode;
        options: Array<{
          id: McpProviderAccessMode;
          label: { en: string; vi: string };
          description: { en: string; vi: string };
        }>;
      };
    };

export type McpOAuthProviderConfig = {
  resourceUrl: string;
  protectedResourceMetadataUrl: string;
  authorizationServerOrigins: string[];
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  dynamicClientRegistration?: {
    clientName: string;
    clientUri?: string;
  };
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
  readonly credentialOwner?: {
    id: string;
    displayName: string;
  };
  readonly oauth?: McpOAuthProviderConfig;
  readonly catalogStatus?: McpProviderCatalogStatus;

  testConnection(credential: McpProviderCredential): Promise<void>;
  listTools(credential: McpProviderCredential): Promise<McpToolDefinition[]>;
  callTool(
    credential: McpProviderCredential,
    toolName: string,
    argumentsValue: McpToolArguments,
  ): Promise<McpToolCallResult>;
  refreshCredential?(
    credential: McpOAuthCredential,
  ): Promise<McpOAuthCredential>;
}
