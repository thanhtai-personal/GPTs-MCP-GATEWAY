import { useState } from "react";
import {
  useMcpConnections,
  useRemoveStitch,
  useSaveStitch,
  useTestStitch,
} from "@/modules/mcp-connections/queries/mcp-connections.queries";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export function McpConnectionsPanel({ accessToken }: { accessToken: string }) {
  const { t } = useUiLanguage();
  const [apiKey, setApiKey] = useState("");
  const connections = useMcpConnections(accessToken);
  const test = useTestStitch(accessToken);
  const save = useSaveStitch(accessToken);
  const remove = useRemoveStitch(accessToken);
  const stitch = connections.data?.find((item) => item.provider === "stitch");

  return (
    <section className="card">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">MCP CONNECTION</span>
          <h2>Google Stitch</h2>
        </div>
        <span className={`status ${stitch ? "good" : ""}`}>
          {stitch ? t("Đã kết nối", "Connected") : t("Chưa kết nối", "Not connected")}
        </span>
      </div>
      <p className="muted">
        {t(
          "API key được gửi một lần tới backend và mã hóa trước khi lưu.",
          "The API key is sent to the backend and encrypted before storage.",
        )}
      </p>
      <label>
        Stitch API Key
        <input
          autoComplete="off"
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="AIza..."
          type="password"
          value={apiKey}
        />
      </label>
      <div className="row">
        <button
          disabled={!apiKey || test.isPending}
          onClick={() => test.mutate(apiKey)}
          type="button"
        >
          {t("Kiểm tra", "Test connection")}
        </button>
        <button
          className="secondary"
          disabled={!apiKey || save.isPending}
          onClick={() => save.mutate(apiKey, { onSuccess: () => setApiKey("") })}
          type="button"
        >
          {t("Lưu", "Save")}
        </button>
        {stitch ? (
          <button className="danger" onClick={() => remove.mutate()} type="button">
            {t("Ngắt kết nối", "Disconnect")}
          </button>
        ) : null}
      </div>
      {test.isSuccess ? <p className="notice success">{t("Stitch key hợp lệ.", "Stitch key is valid.")}</p> : null}
      {test.error ? <p className="notice error">{test.error.message}</p> : null}
      {save.error ? <p className="notice error">{save.error.message}</p> : null}
    </section>
  );
}
