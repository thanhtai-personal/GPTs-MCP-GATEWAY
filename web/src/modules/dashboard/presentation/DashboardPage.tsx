import { Activity, Bell, Boxes, CreditCard, Download, KeyRound, LayoutDashboard, LogOut, Search, Settings, Sparkles } from "lucide-react";
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
import { AdminSiteSettingsPanel } from "@/modules/site-settings/presentation/AdminSiteSettingsPanel";
import "./DashboardPage.mobile.css";

type AppScreen = "overview" | "mcp-services" | "open-id" | "gpt-integration" | "settings";
const SCREEN_IDS = new Set<AppScreen>(["overview", "mcp-services", "open-id", "gpt-integration", "settings"]);

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

  if (isLoading) return <main className="app-loading">{t("Đang tải…", "Loading…")}</main>;
  if (!session) return <SignInExperience />;

  const setScreen = (screen: AppScreen) => {
    setActiveScreen(screen);
    window.history.replaceState(null, "", `#${screen}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <a className="brand brand--large" href="/"><BrandLogo /></a>
        <nav className="app-nav" aria-label={t("Điều hướng Console", "Console navigation")}>
          <span className="app-nav__group-label">{t("CHÍNH", "CORE", "核心", "핵심", "コア")}</span>
          <AppNavItem active={activeScreen === "overview"} icon={<LayoutDashboard size={18} />} label={t("Tổng quan", "Overview")} onSelect={() => setScreen("overview")} screen="overview" />
          <AppNavItem active={activeScreen === "mcp-services"} icon={<Boxes size={18} />} label="MCP Services" onSelect={() => setScreen("mcp-services")} screen="mcp-services" />
          <AppNavItem active={activeScreen === "open-id"} icon={<KeyRound size={18} />} label="Open ID" onSelect={() => setScreen("open-id")} screen="open-id" />
          <AppNavItem active={activeScreen === "gpt-integration"} icon={<Sparkles size={18} />} label="GPT Integration" onSelect={() => setScreen("gpt-integration")} screen="gpt-integration" />
          <div className="app-nav__secondary" aria-label={t("Thông tin bổ sung", "Additional console areas")}>
            <span className="app-nav__group-label">{t("CREDENTIAL & THỐNG KÊ", "CREDENTIALS & METRICS", "凭据与指标", "자격 증명 및 지표", "認証情報と指標")}</span>
            <span className="app-nav__item app-nav__item--disabled"><KeyRound size={18} /><span>{t("Gateway Token", "Gateway Tokens", "Gateway 令牌", "Gateway 토큰", "Gateway トークン")}</span><small>—</small></span>
            <span className="app-nav__item app-nav__item--disabled"><Activity size={18} /><span>{t("Mức sử dụng & Telemetry", "Usage & Telemetry", "使用量与遥测", "사용량 및 텔레메트리", "使用量とテレメトリ")}</span><small>—</small></span>
            <span className="app-nav__item app-nav__item--disabled"><CreditCard size={18} /><span>{t("Thanh toán / Hạn mức", "Billing / Quota", "计费 / 配额", "결제 / 할당량", "請求 / クォータ")}</span><small>—</small></span>
            {account.data?.systemRole === "admin" ? <AppNavItem active={activeScreen === "settings"} icon={<Settings size={18} />} label={t("Cài đặt", "Settings", "设置", "설정", "設定")} onSelect={() => setScreen("settings")} screen="settings" /> : <span className="app-nav__item app-nav__item--disabled"><Settings size={18} /><span>{t("Cài đặt", "Settings", "设置", "설정", "設定")}</span><small>ADMIN</small></span>}
          </div>
        </nav>
        <div className="sidebar-account">
          <div className="sidebar-account__avatar">{(session.user.email?.[0] ?? "U").toUpperCase()}</div>
          <div className="sidebar-account__meta"><strong>{session.user.email?.split("@")[0]}</strong><span>{session.user.email}</span></div>
          <button aria-label={t("Đăng xuất", "Sign out")} className="icon-button" onClick={() => void supabase.auth.signOut()} type="button"><LogOut size={17} /></button>
        </div>
      </aside>

      <section className="app-main">
        <header className="app-topbar app-topbar--dynamic">
          <div className="app-topbar__context"><code>mcp-prod-ap-9</code><span>/</span><strong>mcp-gateway</strong></div>
          <div className="app-topbar__search" role="search"><Search size={15} /><span>{t("Tìm endpoint, tool, Open ID…", "Quick search endpoints, tools, Open ID…", "快速搜索端点、工具、Open ID…", "엔드포인트, 도구, Open ID 빠른 검색…", "エンドポイント、ツール、Open ID を検索…")}</span><kbd>⌘K</kbd></div>
          <div className="app-topbar__actions">
            <span className="system-badge"><span /> {t("Tất cả node", "All Nodes", "所有节点", "모든 노드", "全ノード")} 99.99%</span>
            <button className="secondary compact-button" onClick={() => setScreen("gpt-integration")} type="button"><Download size={14} /> {t("Tải Kit", "Download Kit")}</button>
            <button className="compact-button" onClick={() => setScreen("open-id")} type="button"><KeyRound size={14} /> {t("Tạo Token", "Generate Token")}</button>
            <button aria-label={t("Thông báo", "Notifications")} className="icon-button" type="button"><Bell size={16} /></button>
            <ThemeToggle compact /><LanguageSwitcher />
          </div>
        </header>

        <div className="app-content app-content--screen">
          {account.isLoading ? <p>{t("Đang tải tài khoản…", "Loading account…")}</p> : null}
          {account.error ? <p className="notice error">{account.error.message}</p> : null}
          {activeScreen === "overview" ? <CinematicOverview isMember={account.data?.membershipTier === "member"} onNavigate={setScreen} /> : null}
          {activeScreen === "mcp-services" ? <ConsoleScreenHeader eyebrow={t("MCP SERVICES", "MCP SERVICES")} title={t("Kết nối provider", "Provider connections", "Provider 连接", "Provider 연결", "Provider 接続")} description={t("Kết nối credential của bạn với các MCP provider được Gateway hỗ trợ. Phase 1 dùng Google Stitch.", "Connect your provider credentials to MCP services supported by Gateway. Phase 1 starts with Google Stitch.", "将你的凭据连接到 Gateway 支持的 MCP Provider。第一阶段从 Google Stitch 开始。", "자격 증명을 Gateway가 지원하는 MCP Provider에 연결합니다. 1단계는 Google Stitch로 시작합니다.", "認証情報を Gateway 対応の MCP Provider に接続します。フェーズ1は Google Stitch から開始します。")} badge={t("Credential đã mã hóa", "Encrypted credentials")}><McpConnectionsPanel accessToken={accessToken} /></ConsoleScreenHeader> : null}
          {activeScreen === "open-id" && account.data ? <ConsoleScreenHeader eyebrow={t("OPEN ID HUB", "OPEN ID HUB")} title={t("Quyền truy cập Gateway", "Gateway access")} description={t("Open ID là entitlement kiểm soát mọi MCP execution. Trial chỉ bắt đầu khi bạn chủ động tạo Trial Token.", "Open ID is the entitlement controlling every MCP execution. Trial starts only when you explicitly create a Trial Token.", "Open ID 是控制所有 MCP 执行的 entitlement。只有在你主动创建 Trial Token 时试用才开始。", "Open ID는 모든 MCP 실행을 제어하는 entitlement입니다. Trial Token을 직접 생성할 때만 체험이 시작됩니다.", "Open ID はすべての MCP 実行を制御する entitlement です。Trial Token を明示的に作成した時点でトライアルが始まります。")} badge={account.data.membershipTier === "member" ? t("THÀNH VIÊN", "MEMBER", "会员", "멤버", "メンバー") : t("KHÁCH", "GUEST", "访客", "게스트", "ゲスト")}><OpenIdPanel accessToken={accessToken} account={account.data} /></ConsoleScreenHeader> : null}
          {activeScreen === "gpt-integration" ? <ConsoleScreenHeader eyebrow="CUSTOM GPT" title="GPT Integration" description={t("Cấu hình một Custom GPT dùng Gateway Action, instructions tối giản và Knowledge để tự discovery MCP tools.", "Configure a Custom GPT with the Gateway Action, minimal instructions, and Knowledge for runtime MCP tool discovery.", "配置 Custom GPT，使用 Gateway Action、精简 Instructions 和 Knowledge 在运行时发现 MCP 工具。", "Gateway Action, 최소 Instructions 및 Knowledge를 사용해 런타임에 MCP 도구를 검색하도록 Custom GPT를 구성합니다.", "Gateway Action、最小限の Instructions、Knowledge を使い、実行時に MCP ツールを発見する Custom GPT を設定します。")} badge={t("ACTION SẴN SÀNG", "ACTION READY", "ACTION 就绪", "ACTION 준비됨", "ACTION 準備完了")}><GptIntegrationPanel accessToken={accessToken} isMember={account.data?.membershipTier === "member"} /></ConsoleScreenHeader> : null}
          {activeScreen === "settings" && account.data?.systemRole === "admin" ? <AdminSiteSettingsPanel accessToken={accessToken} /> : null}
        </div>
      </section>
    </main>
  );
}

function AppNavItem({ active, icon, label, onSelect, screen }: { active: boolean; icon: ReactNode; label: string; onSelect: () => void; screen: AppScreen }) {
  return <a className={`app-nav__item ${active ? "active" : ""}`} href={`#${screen}`} onClick={(event) => { event.preventDefault(); onSelect(); }}>{icon}<span>{label}</span></a>;
}

function ConsoleScreenHeader({ badge, children, description, eyebrow, title }: { badge: string; children: ReactNode; description: string; eyebrow: string; title: string }) {
  return <section className="console-screen"><header className="console-screen__header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="lead small">{description}</p></div><span className="status">{badge}</span></header><div className="console-screen__body">{children}</div></section>;
}
