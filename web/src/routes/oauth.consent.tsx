import { createFileRoute } from "@tanstack/react-router";
import { OAuthConsentPage } from "@/modules/auth/presentation/pages/OAuthConsentPage";

export const Route = createFileRoute("/oauth/consent")({
  head: () => ({
    meta: [
      { title: "MCP Gateway · Connect app" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: OAuthConsentPage,
});
