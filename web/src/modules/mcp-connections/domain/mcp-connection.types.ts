export type McpConnectionStatus = "connected" | "invalid" | "unavailable";
export type McpProviderAccessMode = "read" | "write";

export type McpConnection = {
  id: string;
  provider: string;
  status: McpConnectionStatus;
  lastVerifiedAt: string | null;
  lastErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
  accessMode?: McpProviderAccessMode;
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
      accessModes?: {
        default: McpProviderAccessMode;
        options: Array<{
          id: McpProviderAccessMode;
          label: { en: string; vi: string };
          description: { en: string; vi: string };
        }>;
      };
    };

export type McpProvider = {
  id: string;
  name: string;
  serviceIds: string[];
  status: "available" | "requires_configuration" | "pending_review" | "provider_restricted";
  credential: McpProviderCredential;
};
