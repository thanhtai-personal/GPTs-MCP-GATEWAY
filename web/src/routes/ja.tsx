import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/modules/marketing/presentation/LandingPage";
export const Route = createFileRoute("/ja")({ head: () => ({ meta: [{ title: "Custom GPT MCP Gateway | GPT と MCP を安全に接続" }, { name: "description", content: "安全な Open ID Gateway を通じて Custom GPT を対応 MCP サービスに接続します。" }] }), component: () => <LandingPage language="ja" /> });
