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
    return <main className="container dashboard"><p>{t("Đang tải…", "Loading…")}</p></main>;
  }

  if (!session) {
    return (
      <main className="container dashboard narrow">
        <div className="dashboard-top">
          <a className="brand" href="/">MCP Gateway</a>
          <LanguageSwitcher />
        </div>
        <AuthPanel />
      </main>
    );
  }

  return (
    <main className="container dashboard">
      <div className="dashboard-top">
        <div>
          <a className="brand" href="/">MCP Gateway</a>
          <p className="muted">{session.user.email}</p>
        </div>
        <div className="row">
          <LanguageSwitcher />
          <button className="secondary" onClick={() => void supabase.auth.signOut()} type="button">
            {t("Đăng xuất", "Sign out")}
          </button>
        </div>
      </div>

      <section className="dashboard-intro">
        <span className="eyebrow">CONTROL PLANE</span>
        <h1>{t("Kết nối GPT của bạn với MCP.", "Connect your GPT to MCP.")}</h1>
        <p className="lead small">
          {t(
            "Cấu hình provider, tải GPT Kit, rồi kích hoạt trial hoặc Open ID.",
            "Configure a provider, download the GPT Kit, then activate a trial or paid Open ID.",
          )}
        </p>
      </section>

      {account.isLoading ? <p>{t("Đang tải tài khoản…", "Loading account…")}</p> : null}
      {account.error ? <p className="notice error">{account.error.message}</p> : null}

      <div className="dashboard-grid">
        <McpConnectionsPanel accessToken={accessToken} />
        {account.data ? <OpenIdPanel accessToken={accessToken} account={account.data} /> : null}
        <GptIntegrationPanel accessToken={accessToken} />
      </div>
    </main>
  );
}
