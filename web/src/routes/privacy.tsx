import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPolicyPage } from "@/modules/legal/presentation/PrivacyPolicyPage";

const siteUrl =
  import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
  "http://127.0.0.1:5656";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · MCP Gateway" },
      {
        name: "description",
        content:
          "Privacy Policy for MCP Gateway, including account data, encrypted provider credentials, Google Workspace access, and MCP execution data.",
      },
      { property: "og:title", content: "Privacy Policy · MCP Gateway" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${siteUrl}/privacy` },
    ],
    links: [{ rel: "canonical", href: `${siteUrl}/privacy` }],
  }),
  component: PrivacyPolicyPage,
});
