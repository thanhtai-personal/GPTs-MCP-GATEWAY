import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/modules/marketing/presentation/LandingPage";
export const Route = createFileRoute("/ko")({ head: () => ({ meta: [{ title: "Custom GPT MCP Gateway | GPT와 MCP 안전 연결" }, { name: "description", content: "안전한 Open ID Gateway를 통해 Custom GPT를 지원되는 MCP 서비스에 연결합니다." }] }), component: () => <LandingPage language="ko" /> });
