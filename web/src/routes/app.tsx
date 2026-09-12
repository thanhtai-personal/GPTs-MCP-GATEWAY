import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/modules/dashboard/presentation/DashboardPage";
import { SupporterWidget } from "@/modules/supporter/presentation/SupporterWidget";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "MCP Gateway · App" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AppRoutePage,
});

function AppRoutePage() {
  return (
    <>
      <DashboardPage />
      <SupporterWidget />
    </>
  );
}
