import { createFileRoute } from "@tanstack/react-router";
import { OAuthCallbackPage } from "@/modules/auth/presentation/pages/OAuthCallbackPage";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "MCP Gateway · Google OAuth" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OAuthCallbackPage,
});
