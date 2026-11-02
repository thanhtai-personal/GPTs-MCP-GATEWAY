import { createFileRoute } from "@tanstack/react-router";
import { McpOAuthCompletePage } from "@/modules/mcp-connections/presentation/McpOAuthCompletePage";

export const Route = createFileRoute("/oauth/complete")({
  head: () => ({
    meta: [
      { title: "MCP Gateway · Connect provider" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: McpOAuthCompletePage,
});
