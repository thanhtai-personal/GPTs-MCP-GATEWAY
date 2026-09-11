import type {
  McpConnection,
  McpProvider,
} from "@/modules/mcp-connections/domain/mcp-connection.types";
import { gatewayRequest } from "@/shared/api/gateway-api";

export function listMcpProviders(accessToken: string) {
  return gatewayRequest<McpProvider[]>("/mcp-connections/providers", accessToken);
}

export function listMcpConnections(accessToken: string) {
  return gatewayRequest<McpConnection[]>("/mcp-connections", accessToken);
}

export function testMcpConnection(
  accessToken: string,
  provider: string,
  apiKey: string,
) {
  return gatewayRequest<{ provider: string; status: "connected" }>(
    "/mcp-connections/test",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ provider, apiKey }),
    },
  );
}

export function saveMcpConnection(
  accessToken: string,
  provider: string,
  apiKey: string,
) {
  return gatewayRequest<McpConnection>("/mcp-connections", accessToken, {
    method: "PUT",
    body: JSON.stringify({ provider, apiKey }),
  });
}

export function removeMcpConnection(accessToken: string, provider: string) {
  return gatewayRequest<{ deleted: boolean }>(
    `/mcp-connections/${encodeURIComponent(provider)}`,
    accessToken,
    {
      method: "DELETE",
    },
  );
}
