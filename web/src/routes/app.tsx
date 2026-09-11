import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/modules/dashboard/presentation/DashboardPage";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "MCP Gateway · App" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DashboardPage,
});
