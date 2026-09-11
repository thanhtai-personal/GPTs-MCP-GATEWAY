export type McpConnectionStatus = "connected" | "invalid" | "unavailable";

export type McpConnection = {
  id: string;
  provider: string;
  status: McpConnectionStatus;
  lastVerifiedAt: string | null;
  lastErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type McpProviderCredential =
  | {
      kind: "api_key";
      label: string;
      placeholder?: string;
    }
  | {
      kind: "oauth";
      label: string;
      connectLabel: { en: string; vi: string };
      configured: boolean;
      note?: { en: string; vi: string };
    };

export type McpProvider = {
  id: string;
  name: string;
  status: "available" | "requires_configuration";
  credential: McpProviderCredential;
};
