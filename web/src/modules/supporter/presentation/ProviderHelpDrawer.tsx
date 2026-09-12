import { KeyRound, ShieldCheck, X } from "lucide-react";
import type { McpProvider } from "@/modules/mcp-connections/domain/mcp-connection.types";
import { getProviderHelpGuide } from "@/modules/supporter/domain/supporter-content";
import { useUiLanguage } from "@/shared/i18n/ui-language";
import "./Supporter.css";

export function ProviderHelpDrawer({ onClose, provider }: { onClose: () => void; provider: McpProvider | null }) {
  const { language, t } = useUiLanguage();
  if (!provider) return null;
  const guide = getProviderHelpGuide(provider.id);
  const isVi = language === "vi";

  const intro = guide
    ? (isVi ? guide.intro.vi : guide.intro.en)
    : t("Provider này chưa có hướng dẫn riêng. Hãy làm theo loại credential mà card đang yêu cầu.", "This provider does not have a dedicated guide yet. Follow the credential type shown by the card.");

  const steps = guide?.steps ?? [
    { vi: "Kiểm tra loại credential trên card: OAuth hoặc API key.", en: "Check the credential type shown on the card: OAuth or API key." },
    { vi: "OAuth: bấm kết nối và authorize. API key: tạo key ở provider rồi nhập vào Gateway.", en: "OAuth: connect and authorize. API key: create the key at the provider and enter it in Gateway." },
    { vi: "Kiểm tra kết nối trước khi lưu khi Gateway cung cấp nút test.", en: "Test the connection before saving when Gateway provides a test action." },
  ];

  return (
    <div className="supporter-drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside aria-label={t(`Hướng dẫn ${provider.name}`, `${provider.name} setup guide`)} className="supporter-drawer" role="dialog" aria-modal="true">
        <header className="supporter-drawer__header">
          <div><span className="eyebrow">PROVIDER HELP</span><h2>{guide ? (isVi ? guide.title.vi : guide.title.en) : provider.name}</h2></div>
          <button aria-label={t("Đóng hướng dẫn", "Close guide")} className="icon-button" onClick={onClose} type="button"><X size={18} /></button>
        </header>
        <div className="supporter-drawer__body">
          <div className="supporter-credential-type"><KeyRound size={16} /><span>{t("Loại credential", "Credential type")}</span><strong>{provider.credential.kind === "oauth" ? "OAUTH" : "API KEY"}</strong></div>
          <p>{intro}</p>
          <ol className="supporter-steps">{steps.map((step, index) => <li key={index}>{isVi ? step.vi : step.en}</li>)}</ol>
          <div className="supporter-security-note"><ShieldCheck size={17} /><p>{guide ? (isVi ? guide.securityNote.vi : guide.securityNote.en) : t("Không gửi credential trong nội dung chat GPT.", "Do not send credentials in GPT chat content.")}</p></div>
        </div>
      </aside>
    </div>
  );
}
