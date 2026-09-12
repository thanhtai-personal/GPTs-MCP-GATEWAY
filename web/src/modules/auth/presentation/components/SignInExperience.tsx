import { Boxes, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { AuthPanel } from "@/modules/auth/presentation/components/AuthPanel";
import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher";
import { useUiLanguage } from "@/shared/i18n/ui-language";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";
import { BrandLogo } from "@/shared/branding/BrandLogo";

export function SignInExperience() {
  const { t } = useUiLanguage();
  return (
    <main className="auth-page auth-page--stitch auth-page--cinematic-v2">
      <section className="auth-showcase">
        <div className="auth-showcase__top"><a className="brand brand--large auth-brand-lockup" href="/"><BrandLogo variant="lockup" /></a><span className="status good"><span className="status-dot status-dot--success" /> {t("TRỰC TUYẾN", "LIVE", "在线", "라이브", "ライブ")}</span></div>
        <div className="auth-showcase__content">
          <span className="eyebrow">{t("TRUY CẬP CONTROL PLANE", "CONTROL PLANE ACCESS", "CONTROL PLANE 访问", "CONTROL PLANE 액세스", "CONTROL PLANE アクセス")}</span>
          <h1>{t("Truy cập MCP Gateway.", "Access your MCP Gateway.")}</h1>
          <p className="lead small">{t("Quản lý Open ID, MCP connections, Gateway tokens và Custom GPT integration từ một control plane bảo mật.", "Manage Open ID, MCP connections, Gateway tokens, and your Custom GPT integration from one secure control plane.", "在一个安全的 control plane 中管理 Open ID、MCP 连接、Gateway 令牌和 Custom GPT 集成。", "하나의 안전한 control plane에서 Open ID, MCP 연결, Gateway 토큰 및 Custom GPT 통합을 관리하세요.", "1つの安全な control plane から Open ID、MCP 接続、Gateway トークン、Custom GPT 統合を管理します。")}</p>
          <div className="auth-route-preview" aria-label={t("Luồng truy cập Gateway", "Gateway access flow", "Gateway 访问流程", "Gateway 액세스 흐름", "Gateway アクセスフロー")}><div><Sparkles size={16} /><span>Custom GPT</span></div><i>↓</i><div className="active"><ShieldCheck size={16} /><span>Gateway</span></div><i>↓</i><div><KeyRound size={16} /><span>Open ID</span></div><i>↓</i><div><Boxes size={16} /><span>MCP Services</span></div></div>
          <div className="auth-system-grid">
            <div><span>Gateway</span><strong><i className="status-dot status-dot--success" /> {t("HOẠT ĐỘNG", "OPERATIONAL", "运行正常", "정상 작동", "稼働中")}</strong></div>
            <div><span>Open ID</span><strong><i className="status-dot status-dot--success" /> {t("ĐANG BẮT BUỘC", "ENFORCED", "已强制", "적용됨", "適用中")}</strong></div>
            <div><span>Google Stitch</span><strong><i className="status-dot status-dot--cyan" /> {t("KHẢ DỤNG", "AVAILABLE", "可用", "사용 가능", "利用可能")}</strong></div>
          </div>
        </div>
        <div className="auth-showcase__foot"><ShieldCheck size={15} />{t("Provider credentials luôn được mã hóa phía Gateway.", "Provider credentials stay encrypted inside Gateway.", "Provider 凭据始终在 Gateway 内加密保存。", "Provider 자격 증명은 항상 Gateway 내부에서 암호화됩니다.", "Provider の認証情報は常に Gateway 内で暗号化されます。")}</div>
      </section>
      <section className="auth-form-pane">
        <div className="auth-form-pane__top"><a href="/" className="auth-back-link">← {t("Về trang chủ", "Back to homepage")}</a><div className="auth-form-pane__utilities"><ThemeToggle compact /><LanguageSwitcher /></div></div>
        <div className="auth-form-pane__content"><AuthPanel /></div>
      </section>
    </main>
  );
}
