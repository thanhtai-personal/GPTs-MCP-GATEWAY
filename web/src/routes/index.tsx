import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/modules/marketing/presentation/LandingPage";

const siteUrl =
  import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
  "http://127.0.0.1:5656";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MCP Gateway for Custom GPTs | Connect GPT to MCP" },
      {
        name: "description",
        content:
          "Connect Custom GPTs to supported MCP services through a secure Open ID gateway. Runtime tool discovery, encrypted provider credentials, and Google Stitch support.",
      },
      { property: "og:title", content: "MCP Gateway for Custom GPTs" },
      {
        property: "og:description",
        content: "Give Custom GPT agent-like MCP access through one secure Gateway.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${siteUrl}/` },
    ],
    links: [
      { rel: "canonical", href: `${siteUrl}/` },
      { rel: "alternate", hrefLang: "en", href: `${siteUrl}/` },
      { rel: "alternate", hrefLang: "vi", href: `${siteUrl}/vi` },
    ],
  }),
  component: () => <LandingPage language="en" />,
});
