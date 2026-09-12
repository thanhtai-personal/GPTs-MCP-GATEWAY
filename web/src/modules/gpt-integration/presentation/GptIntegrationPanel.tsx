import { Download, FileCode2, FileText, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { downloadGatewayFile } from "@/shared/api/gateway-api";
import { useUiLanguage } from "@/shared/i18n/ui-language";

const KIT_FILES = [
  { name: "instructions.md", icon: FileText },
  { name: "GPTS-MCP-GATEWAY-Knowledge.md", icon: FileText },
  { name: "openapi.yaml", icon: FileCode2 },
  { name: "setup-guide.md", icon: FileText },
];

export function GptIntegrationPanel({ accessToken }: { accessToken: string }) {
  const { language, t } = useUiLanguage();
  const [error, setError] = useState<string | null>(null);

  async function downloadFile(path: string, filename: string) {
    setError(null);
    try {
      const blob = await downloadGatewayFile(path, accessToken);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Download failed");
    }
  }

  function downloadKit() {
    return downloadFile(
      `/gpt-integration/package?language=${language}`,
      `mcp-gateway-gpt-kit-${language}.zip`,
    );
  }

  function downloadKitFile(filename: string) {
    return downloadFile(
      `/gpt-integration/file/${encodeURIComponent(filename)}?language=${language}`,
      filename,
    );
  }

  return (
    <section className="card card--feature">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">INTEGRATION KIT</span>
          <h3>{t("Sẵn sàng cho Custom GPT", "Ready for Custom GPT")}</h3>
        </div>
        <span className="status good"><ShieldCheck size={14} />{t("Gateway-ready", "Gateway-ready")}</span>
      </div>
      <p className="muted">
        {t(
          "Kit chứa Action schema, instructions tối giản và Knowledge đầy đủ để GPT tự nhận diện khi cần gọi MCP.",
          "The kit contains the Action schema, minimal instructions, and complete Knowledge so GPT can automatically recognize when MCP is needed.",
        )}
      </p>
      <div className="file-list">
        {KIT_FILES.map(({ name, icon: Icon }) => (
          <div className="file-item" key={name}>
            <Icon size={17} />
            <code>{name}</code>
            <button
              aria-label={t(`Tải ${name}`, `Download ${name}`)}
              className="file-download-button"
              onClick={() => void downloadKitFile(name)}
              title={t("Tải file", "Download file")}
              type="button"
            >
              <Download size={15} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={() => void downloadKit()} type="button">
        <Download size={17} />{t("Tải GPT Integration Kit", "Download GPT Integration Kit")}
      </button>
      {error ? <p className="notice error">{error}</p> : null}
    </section>
  );
}
