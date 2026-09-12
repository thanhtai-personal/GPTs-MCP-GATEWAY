import { Boxes, KeyRound, PlugZap, ShieldCheck, Sparkles } from "lucide-react";
import { AuthPanel } from "@/modules/auth/presentation/components/AuthPanel";
import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export function SignInExperience() {
  const { t } = useUiLanguage();

  return (
    <main className="auth-page auth-page--stitch">
      <section className="auth-showcase">
        <div className="auth-showcase__top">
          <a className="brand brand--large" href="/">
            <span className="brand-mark"><PlugZap size={18} /></span>
            MCP Gateway
          </a>
          <span className="status good"><span className="status-dot status-dot--success" /> LIVE</span>
        </div>

        <div className="auth-showcase__content">
          <span className="eyebrow">CONTROL PLANE ACCESS</span>
          <h1>{t("Truy cập MCP Gateway.", "Access your MCP Gateway.")}</h1>
          <p className="lead small">
            {t(
              "Quản lý Open ID, MCP connections, Gateway tokens và Custom GPT integration từ một control plane bảo mật.",
              "Manage Open ID, MCP connections, Gateway tokens, and your Custom GPT integration from one secure control plane.",
            )}
          </p>

          <div className="auth-route-preview" aria-label="Gateway access flow">
            <div><Sparkles size={16} /><span>Custom GPT</span></div>
            <i>↓</i>
            <div className="active"><PlugZap size={16} /><span>Gateway</span></div>
            <i>↓</i>
            <div><KeyRound size={16} /><span>Open ID</span></div>
            <i>↓</i>
            <div><Boxes size={16} /><span>MCP Services</span></div>
          </div>

          <div className="auth-system-grid">
            <div><span>Gateway</span><strong><i className="status-dot status-dot--success" /> OPERATIONAL</strong></div>
            <div><span>Open ID</span><strong><i className="status-dot status-dot--success" /> ENFORCED</strong></div>
            <div><span>Google Stitch</span><strong><i className="status-dot status-dot--cyan" /> AVAILABLE</strong></div>
          </div>
        </div>

        <div className="auth-showcase__foot">
          <ShieldCheck size={15} />
          {t("Provider credentials luôn được mã hóa phía Gateway.", "Provider credentials stay encrypted inside Gateway.")}
        </div>
      </section>

      <section className="auth-form-pane">
        <div className="auth-form-pane__top">
          <a href="/" className="auth-back-link">← {t("Về trang chủ", "Back to homepage")}</a>
          <LanguageSwitcher />
        </div>
        <div className="auth-form-pane__content">
          <AuthPanel />
        </div>
      </section>
    </main>
  );
}
