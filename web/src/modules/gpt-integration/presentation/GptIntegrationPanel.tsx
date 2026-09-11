import { useState } from "react";
import { downloadGatewayFile } from "@/shared/api/gateway-api";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export function GptIntegrationPanel({ accessToken }: { accessToken: string }) {
  const { language, t } = useUiLanguage();
  const [error, setError] = useState<string | null>(null);

  async function downloadKit() {
    setError(null);
    try {
      const blob = await downloadGatewayFile(
        `/gpt-integration/package?language=${language}`,
        accessToken,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mcp-gateway-gpt-kit-${language}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Download failed");
    }
  }

  return (
    <section className="card">
      <span className="eyebrow">CUSTOM GPT</span>
      <h2>{t("GPT Integration Kit", "GPT Integration Kit")}</h2>
      <p className="muted">
        {t(
          "Đăng nhập là có thể tải kit. Open ID chỉ được kiểm tra khi GPT thực sự gọi Gateway.",
          "Any signed-in user may download the kit. Open ID entitlement is enforced when GPT executes through Gateway.",
        )}
      </p>
      <div className="file-list">
        <code>instructions.md</code>
        <code>knowledge.md</code>
        <code>openapi.yaml</code>
        <code>setup-guide.md</code>
      </div>
      <button onClick={() => void downloadKit()} type="button">
        {t("Tải ZIP cho GPT", "Download GPT ZIP")}
      </button>
      {error ? <p className="notice error">{error}</p> : null}
    </section>
  );
}
