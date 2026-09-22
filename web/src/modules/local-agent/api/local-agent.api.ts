import type { LocalAgent } from "@/modules/local-agent/domain/local-agent.types";
import { gatewayRequest } from "@/shared/api/gateway-api";

export function listLocalAgents(accessToken: string) {
  return gatewayRequest<LocalAgent[]>("/local-agent", accessToken);
}

export function revokeLocalAgent(accessToken: string, agentId: string) {
  return gatewayRequest<{ revoked: boolean }>(
    `/local-agent/${encodeURIComponent(agentId)}`,
    accessToken,
    { method: "DELETE" },
  );
}
