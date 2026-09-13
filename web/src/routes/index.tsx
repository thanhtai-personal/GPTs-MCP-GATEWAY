import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/modules/marketing/presentation/LandingPage";

const siteUrl =
  import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
  "http://127.0.0.1:5656";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Skill-Orchestrated MCP Gateway for Custom GPTs" },
      {
        name: "description",
        content:
          "Turn Custom GPT goals into disciplined MCP execution with Gateway Skills, runtime tool discovery, secure provider access, and outcome-based workflows.",
      },
      { property: "og:title", content: "Skill-Orchestrated MCP Gateway for Custom GPTs" },
      {
        property: "og:description",
        content: "MCP gives your GPT capabilities. Gateway Skills teach it how to use them together to complete real work.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Skill-Orchestrated MCP Gateway for Custom GPTs" },
      {
        name: "twitter:description",
        content: "Move from tool access to expert execution with Gateway Skills and runtime MCP discovery.",
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
