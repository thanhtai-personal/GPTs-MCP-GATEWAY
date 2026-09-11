import type { McpConnection } from "@/modules/mcp-connections/domain/mcp-connection.types";
import { gatewayRequest } from "@/shared/api/gateway-api";

export function listMcpConnections(accessToken: string) {
  return gatewayRequest<McpConnection[]>("/mcp-connections", accessToken);
}

export function testStitch(accessToken: string, apiKey: string) {
  return gatewayRequest<{ provider: "stitch"; status: "connected" }>(
    "/mcp-connections/test",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ provider: "stitch", apiKey }),
    },
  );
}

export function saveStitch(accessToken: string, apiKey: string) {
  return gatewayRequest<McpConnection>("/mcp-connections", accessToken, {
    method: "PUT",
    body: JSON.stringify({ provider: "stitch", apiKey }),
  });
}

export function removeStitch(accessToken: string) {
  return gatewayRequest<{ deleted: boolean }>("/mcp-connections/stitch", accessToken, {
    method: "DELETE",
  });
}
