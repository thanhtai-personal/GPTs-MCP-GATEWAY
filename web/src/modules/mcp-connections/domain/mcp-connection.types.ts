export type McpConnection = {
  id: string;
  provider: "stitch";
  status: "connected" | "invalid" | "unavailable";
  lastVerifiedAt: string | null;
  lastErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
};
