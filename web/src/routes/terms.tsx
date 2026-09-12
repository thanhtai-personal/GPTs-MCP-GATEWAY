import { createFileRoute } from "@tanstack/react-router";
import { TermsOfServicePage } from "@/modules/legal/presentation/TermsOfServicePage";

const siteUrl =
  import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
  "http://127.0.0.1:5656";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · MCP Gateway" },
      {
        name: "description",
        content:
          "Terms for MCP Gateway accounts, Open ID entitlements, provider permissions, and MCP execution.",
      },
      { property: "og:title", content: "Terms of Service · MCP Gateway" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${siteUrl}/terms` },
    ],
    links: [{ rel: "canonical", href: `${siteUrl}/terms` }],
  }),
  component: TermsOfServicePage,
});
