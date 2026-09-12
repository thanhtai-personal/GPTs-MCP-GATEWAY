import {
  Activity,
  Bell,
  Boxes,
  CreditCard,
  Download,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAccount } from "@/modules/account/queries/account.queries";
import { SignInExperience } from "@/modules/auth/presentation/components/SignInExperience";
import { supabase } from "@/modules/auth/infrastructure/supabase-browser";
import { useSession } from "@/modules/auth/presentation/hooks/useSession";
import { GptIntegrationPanel } from "@/modules/gpt-integration/presentation/GptIntegrationPanel";
import { McpConnectionsPanel } from "@/modules/mcp-connections/presentation/McpConnectionsPanel";
import { OpenIdPanel } from "@/modules/open-id/presentation/OpenIdPanel";
import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher";
import { useUiLanguage } from "@/shared/i18n/ui-language";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";
import { BrandLogo } from "@/shared/branding/BrandLogo";
import { CinematicOverview } from "@/modules/dashboard/presentation/CinematicOverview";

type AppScreen = "overview" | "mcp-services" | "open-id" | "gpt-integration";
const SCREEN_IDS = new Set<AppScreen>([
  "overview",
  "mcp-services",
  "open-id",
  "gpt-integration",
]);

function getScreenFromHash(): AppScreen {
  if (typeof window === "undefined") return "overview";
  const value = window.location.hash.replace(/^#/, "") as AppScreen;
  return SCREEN_IDS.has(value) ? value : "overview";
}

export function DashboardPage() {
  const { t } = useUiLanguage();
  const { session, isLoading } = useSession();
  const accessToken = session?.access_token ?? "";
  const account = useAccount(accessToken);
  const [activeScreen, setActiveScreen] = useState<AppScreen>(getScreenFromHash);
  useEffect(() => {
    const onHashChange = () => setActiveScreen(getScreenFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (isLoading) {
    return <main className="app-loading">{t("Đang tải…", "Loading…")}</main>;
  }

  if (!session) return <SignInExperience />;
  const setScreen = (screen: AppScreen) => {
    setActiveScreen(screen);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${screen}`);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <a className="brand brand--large" href="/">
          <BrandLogo />
        </a>

        <nav className="app-nav" aria-label={t("Điều hướng Console", "Console navigation")}>
          <span className="app-nav__group-label">CORE</span>
          <AppNavItem
            active={activeScreen === "overview"}
            icon={<LayoutDashboard size={18} />}
            label={t("Tổng quan", "Overview")}
            onSelect={() => setScreen("overview")}
            screen="overview"
          />
          <AppNavItem
            active={activeScreen === "mcp-services"}
            icon={<Boxes size={18} />}
            label="MCP Services"
            onSelect={() => setScreen("mcp-services")}
            screen="mcp-services"
          />
          <AppNavItem
            active={activeScreen === "open-id"}
            icon={<KeyRound size={18} />}
            label="Open ID"
            onSelect={() => setScreen("open-id")}
            screen="open-id"
          />
          <AppNavItem
            active={activeScreen === "gpt-integration"}
            icon={<Sparkles size={18} />}
            label="GPT Integration"
            onSelect={() => setScreen("gpt-integration")}
            screen="gpt-integration"
          />
          <div className="app-nav__secondary" aria-label={t("Thông tin bổ sung", "Additional console areas")}>
            <span className="app-nav__group-label">CREDENTIALS &amp; METRICS</span>
            <span className="app-nav__item app-nav__item--disabled"><KeyRound size={18} /><span>Gateway Tokens</span><small>—</small></span>
            <span className="app-nav__item app-nav__item--disabled"><Activity size={18} /><span>Usage &amp; Telemetry</span><small>—</small></span>
            <span className="app-nav__item app-nav__item--disabled"><CreditCard size={18} /><span>Billing / Quota</span><small>—</small></span>
            <span className="app-nav__item app-nav__item--disabled"><Settings size={18} /><span>Settings</span><small>—</small></span>
          </div>
        </nav>

        <div className="sidebar-account">
          <div className="sidebar-account__avatar">
            {(session.user.email?.[0] ?? "U").toUpperCase()}
          </div>
          <div className="sidebar-account__meta">
            <strong>{session.user.email?.split("@")[0]}</strong>
            <span>{session.user.email}</span>
          </div>
          <button
            aria-label={t("Đăng xuất", "Sign out")}
            className="icon-button"
            onClick={() => void supabase.auth.signOut()}
            type="button"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <section className="app-main">
        <header className="app-topbar app-topbar--dynamic">
          <div className="app-topbar__context">
            <code>mcp-prod-ap-9</code>
            <span>/</span>
            <strong>mcp-gateway</strong>
          </div>
          <div className="app-topbar__search" role="search">
            <Search size={15} />
            <span>{t("Tìm endpoint, tool, Open ID…", "Quick search endpoints, tools, Open ID…")}</span>
            <kbd>⌘K</kbd>
          </div>

          <div className="app-topbar__actions">
            <span className="system-badge"><span /> All Nodes 99.99%</span>
            <button className="secondary compact-button" onClick={() => setScreen("gpt-integration")} type="button">
              <Download size={14} /> {t("Tải Kit", "Download Kit")}
            </button>
            <button className="compact-button" onClick={() => setScreen("open-id")} type="button">
              <KeyRound size={14} /> {t("Tạo Token", "Generate Token")}
            </button>
            <button aria-label={t("Thông báo", "Notifications")} className="icon-button" type="button"><Bell size={16} /></button>
            <ThemeToggle compact />
            <LanguageSwitcher />
          </div>
        </header>

        <div className="app-content app-content--screen">
          {account.isLoading ? <p>{t("Đang tải tài khoản…", "Loading account…")}</p> : null}
          {account.error ? <p className="notice error">{account.error.message}</p> : null}

          {activeScreen === "overview" ? (
            <CinematicOverview
              isMember={account.data?.membershipTier === "member"}
              onNavigate={setScreen}
            />
          ) : null}

          {activeScreen === "mcp-services" ? (
            <ConsoleScreenHeader
              eyebrow="MCP SERVICES"
              title={t("Provider connections", "Provider connections")}
              description={t(
                "Kết nối credential của bạn với các MCP provider được Gateway hỗ trợ. Phase 1 dùng Google Stitch.",
                "Connect your provider credentials to MCP services supported by Gateway. Phase 1 starts with Google Stitch.",
              )}
              badge={t("Credential mã hóa", "Encrypted credentials")}
            >
              <McpConnectionsPanel accessToken={accessToken} />
            </ConsoleScreenHeader>
          ) : null}

          {activeScreen === "open-id" && account.data ? (
            <ConsoleScreenHeader
              eyebrow="OPEN ID HUB"
              title={t("Gateway access", "Gateway access")}
              description={t(
                "Open ID là entitlement kiểm soát mọi MCP execution. Trial chỉ bắt đầu khi bạn chủ động tạo Trial Token.",
                "Open ID is the entitlement controlling every MCP execution. Trial starts only when you explicitly create a Trial Token.",
              )}
              badge={account.data.membershipTier === "member" ? "MEMBER" : "GUEST"}
            >
              <OpenIdPanel accessToken={accessToken} account={account.data} />
            </ConsoleScreenHeader>
          ) : null}

          {activeScreen === "gpt-integration" ? (
            <ConsoleScreenHeader
              eyebrow="CUSTOM GPT"
              title={t("GPT Integration", "GPT Integration")}
              description={t(
                "Cấu hình một Custom GPT dùng Gateway Action, instructions tối giản và Knowledge để tự discovery MCP tools.",
                "Configure a Custom GPT with the Gateway Action, minimal instructions, and Knowledge for runtime MCP tool discovery.",
              )}
              badge="ACTION READY"
            >
              <GptIntegrationPanel
                accessToken={accessToken}
                isMember={account.data?.membershipTier === "member"}
              />
            </ConsoleScreenHeader>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function AppNavItem({
  active,
  icon,
  label,
  onSelect,
  screen,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onSelect: () => void;
  screen: AppScreen;
}) {
  return (
    <a
      className={`app-nav__item ${active ? "active" : ""}`}
      href={`#${screen}`}
      onClick={(event) => {
        event.preventDefault();
        onSelect();
      }}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}



function ConsoleScreenHeader({
  badge,
  children,
  description,
  eyebrow,
  title,
}: {
  badge: string;
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="console-screen">
      <header className="console-screen__header">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="lead small">{description}</p>
        </div>
        <span className="status">{badge}</span>
      </header>
      <div className="console-screen__body">{children}</div>
    </section>
  );
}

function screenLabel(
  screen: AppScreen,
  t: (vi: string, en: string) => string,
) {
  if (screen === "mcp-services") return "MCP Services";
  if (screen === "open-id") return "Open ID Hub";
  if (screen === "gpt-integration") return "GPT Integration";
  return t("Tổng quan", "Overview");
}
