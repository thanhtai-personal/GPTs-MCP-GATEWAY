import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/modules/marketing/presentation/LandingPage";

const siteUrl =
  import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
  "http://127.0.0.1:5656";

export const Route = createFileRoute("/vi")({
  head: () => ({
    meta: [
      { title: "MCP Gateway điều phối bằng Skill cho Custom GPT" },
      {
        name: "description",
        content:
          "Biến mục tiêu của Custom GPT thành MCP execution có kỷ luật với Gateway Skills, runtime tool discovery, provider access bảo mật và workflow theo outcome.",
      },
      { property: "og:title", content: "MCP Gateway điều phối bằng Skill cho Custom GPT" },
      {
        property: "og:description",
        content: "MCP trao capability cho GPT. Gateway Skills dạy GPT cách phối hợp các capability để hoàn thành công việc thực tế.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MCP Gateway điều phối bằng Skill cho Custom GPT" },
      {
        name: "twitter:description",
        content: "Từ tool access đến expert execution với Gateway Skills và runtime MCP discovery.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${siteUrl}/vi` },
    ],
    links: [
      { rel: "canonical", href: `${siteUrl}/vi` },
      { rel: "alternate", hrefLang: "en", href: `${siteUrl}/` },
      { rel: "alternate", hrefLang: "vi", href: `${siteUrl}/vi` },
    ],
  }),
  component: () => <LandingPage language="vi" />,
});
