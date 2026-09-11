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

export type McpProvider = {
  id: string;
  name: string;
  status: "available";
  credential: {
    kind: "api_key";
    label: string;
    placeholder?: string;
  };
};
