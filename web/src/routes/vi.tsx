import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/modules/marketing/presentation/LandingPage";

const siteUrl =
  import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
  "http://127.0.0.1:5656";

export const Route = createFileRoute("/vi")({
  head: () => ({
    meta: [
      { title: "MCP Gateway cho Custom GPT | Kết nối GPT với MCP" },
      {
        name: "description",
        content:
          "Kết nối Custom GPT với các MCP service được hỗ trợ qua Open ID Gateway bảo mật. Discovery tool runtime và hỗ trợ Google Stitch.",
      },
      { property: "og:title", content: "MCP Gateway cho Custom GPT" },
      {
        property: "og:description",
        content: "Cho Custom GPT sử dụng MCP qua một Gateway có kiểm soát.",
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
