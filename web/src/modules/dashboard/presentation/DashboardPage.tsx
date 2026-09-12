import {
  Boxes,
  KeyRound,
  LayoutDashboard,
  LogOut,
  PlugZap,
  Sparkles,
} from "lucide-react";
import { useAccount } from "@/modules/account/queries/account.queries";
import { AuthPanel } from "@/modules/auth/presentation/components/AuthPanel";
import { useSession } from "@/modules/auth/presentation/hooks/useSession";
import { supabase } from "@/modules/auth/infrastructure/supabase-browser";
import { GptIntegrationPanel } from "@/modules/gpt-integration/presentation/GptIntegrationPanel";
import { McpConnectionsPanel } from "@/modules/mcp-connections/presentation/McpConnectionsPanel";
import { OpenIdPanel } from "@/modules/open-id/presentation/OpenIdPanel";
import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export function DashboardPage() {
  const { t } = useUiLanguage();
  const { session, isLoading } = useSession();
  const accessToken = session?.access_token ?? "";
  const account = useAccount(accessToken);

  if (isLoading) {
    return <main className="app-loading">{t("Đang tải…", "Loading…")}</main>;
  }

  if (!session) {
    return (
      <main className="auth-page">
        <div className="auth-page__bar">
          <a className="brand brand--large" href="/">
            <span className="brand-mark"><PlugZap size={18} /></span>
            MCP Gateway
          </a>
          <LanguageSwitcher />
        </div>
        <div className="auth-page__content"><AuthPanel /></div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <a className="brand brand--large" href="/">
          <span className="brand-mark"><PlugZap size={18} /></span>
          MCP Gateway
        </a>

        <nav className="app-nav" aria-label="Dashboard">
          <a className="app-nav__item active" href="#overview"><LayoutDashboard size={18} />{t("Tổng quan", "Overview")}</a>
          <a className="app-nav__item" href="#mcp-services"><Boxes size={18} />MCP Services</a>
          <a className="app-nav__item" href="#open-id"><KeyRound size={18} />Open ID</a>
          <a className="app-nav__item" href="#gpt-integration"><Sparkles size={18} />GPT Integration</a>
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
        <header className="app-topbar">
          <div>
            <span className="topbar-kicker">CONTROL PLANE</span>
            <strong>{t("MCP Gateway Console", "MCP Gateway Console")}</strong>
          </div>
          <LanguageSwitcher />
        </header>

        <div className="app-content">
          <section className="dashboard-intro" id="overview">
            <div>
              <span className="eyebrow">CONTROL PLANE</span>
              <h1>{t("Kết nối GPT với MCP.", "Connect GPT to MCP.")}</h1>
              <p className="lead small">
                {t(
                  "Quản lý provider, quyền Gateway và bộ tích hợp Custom GPT từ một control plane.",
                  "Manage providers, Gateway entitlement, and your Custom GPT integration from one control plane.",
                )}
              </p>
            </div>
            <div className="system-badge"><span /> {t("Gateway hoạt động", "Gateway operational")}</div>
          </section>

          {account.isLoading ? <p>{t("Đang tải tài khoản…", "Loading account…")}</p> : null}
          {account.error ? <p className="notice error">{account.error.message}</p> : null}

          <section className="dashboard-section" id="mcp-services">
            <div className="section-heading">
              <div><span className="eyebrow">MCP SERVICES</span><h2>{t("Kết nối provider", "Provider connections")}</h2></div>
              <span className="section-index">01</span>
            </div>
            <div className="dashboard-grid dashboard-grid--providers">
              <McpConnectionsPanel accessToken={accessToken} />
            </div>
          </section>

          <section className="dashboard-section" id="open-id">
            <div className="section-heading">
              <div><span className="eyebrow">OPEN ID HUB</span><h2>{t("Quyền truy cập Gateway", "Gateway access")}</h2></div>
              <span className="section-index">02</span>
            </div>
            {account.data ? <OpenIdPanel accessToken={accessToken} account={account.data} /> : null}
          </section>

          <section className="dashboard-section" id="gpt-integration">
            <div className="section-heading">
              <div><span className="eyebrow">CUSTOM GPT</span><h2>{t("Tích hợp GPT", "GPT integration")}</h2></div>
              <span className="section-index">03</span>
            </div>
            <GptIntegrationPanel accessToken={accessToken} />
          </section>
        </div>
      </section>
    </main>
  );
}
