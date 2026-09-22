export type LocalAgentStatus = "online" | "offline" | "revoked";

export type LocalAgent = {
  id: string;
  name: string;
  status: LocalAgentStatus;
  toolCount: number;
  toolNames: string[];
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
};
