import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/modules/marketing/presentation/LandingPage";
export const Route = createFileRoute("/zh")({ head: () => ({ meta: [{ title: "Custom GPT MCP Gateway | 安全连接 GPT 与 MCP" }, { name: "description", content: "通过安全的 Open ID Gateway 将 Custom GPT 连接到支持的 MCP 服务。" }] }), component: () => <LandingPage language="zh" /> });
