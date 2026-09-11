import { useState } from "react";
import type {
  McpConnection,
  McpProvider,
} from "@/modules/mcp-connections/domain/mcp-connection.types";
import {
  useMcpConnections,
  useMcpProviders,
  useRemoveMcpConnection,
  useSaveMcpConnection,
  useTestMcpConnection,
} from "@/modules/mcp-connections/queries/mcp-connections.queries";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export function McpConnectionsPanel({ accessToken }: { accessToken: string }) {
  const { t } = useUiLanguage();
  const providers = useMcpProviders(accessToken);
  const connections = useMcpConnections(accessToken);

  if (providers.isLoading || connections.isLoading) {
    return (
      <section className="card">
        <p className="muted">{t("Đang tải MCP services...", "Loading MCP services...")}</p>
      </section>
    );
  }

  if (providers.error || connections.error) {
    const message = providers.error?.message ?? connections.error?.message;
    return (
      <section className="card">
        <p className="notice error">{message}</p>
      </section>
    );
  }

  return (
    <>
      {(providers.data ?? []).map((provider) => (
        <McpProviderCard
          accessToken={accessToken}
          connection={(connections.data ?? []).find(
            (connection) => connection.provider === provider.id,
          )}
          key={provider.id}
          provider={provider}
        />
      ))}
    </>
  );
}

function McpProviderCard({
  accessToken,
  connection,
  provider,
}: {
  accessToken: string;
  connection?: McpConnection;
  provider: McpProvider;
}) {
  const { t } = useUiLanguage();
  const [credentialValue, setCredentialValue] = useState("");
  const test = useTestMcpConnection(accessToken);
  const save = useSaveMcpConnection(accessToken);
  const remove = useRemoveMcpConnection(accessToken);

  const mutationInput = {
    provider: provider.id,
    apiKey: credentialValue,
  };

  return (
    <section className="card">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">MCP CONNECTION</span>
          <h2>{provider.name}</h2>
        </div>
        <span className={`status ${connection ? "good" : ""}`}>
          {connection
            ? t("Đã kết nối", "Connected")
            : t("Chưa kết nối", "Not connected")}
        </span>
      </div>

      <p className="muted">
        {t(
          "Credential được gửi tới backend và mã hóa trước khi lưu.",
          "The credential is sent to the backend and encrypted before storage.",
        )}
      </p>

      <label>
        {provider.credential.label}
        <input
          autoComplete="off"
          onChange={(event) => setCredentialValue(event.target.value)}
          placeholder={provider.credential.placeholder}
          type="password"
          value={credentialValue}
        />
      </label>

      <div className="row">
        <button
          disabled={!credentialValue || test.isPending}
          onClick={() => test.mutate(mutationInput)}
          type="button"
        >
          {t("Kiểm tra", "Test connection")}
        </button>

        <button
          className="secondary"
          disabled={!credentialValue || save.isPending}
          onClick={() =>
            save.mutate(mutationInput, {
              onSuccess: () => setCredentialValue(""),
            })
          }
          type="button"
        >
          {t("Lưu", "Save")}
        </button>

        {connection ? (
          <button
            className="danger"
            disabled={remove.isPending}
            onClick={() => remove.mutate(provider.id)}
            type="button"
          >
            {t("Ngắt kết nối", "Disconnect")}
          </button>
        ) : null}
      </div>

      {test.isSuccess ? (
        <p className="notice success">
          {t("Credential hợp lệ.", "Credential is valid.")}
        </p>
      ) : null}
      {test.error ? <p className="notice error">{test.error.message}</p> : null}
      {save.error ? <p className="notice error">{save.error.message}</p> : null}
      {remove.error ? <p className="notice error">{remove.error.message}</p> : null}
    </section>
  );
}
