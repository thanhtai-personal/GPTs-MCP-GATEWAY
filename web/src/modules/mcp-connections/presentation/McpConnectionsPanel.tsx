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
  useStartMcpOAuth,
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

      {provider.credential.kind === "api_key" ? (
        <ApiKeyConnectionForm
          accessToken={accessToken}
          connection={connection}
          credential={provider.credential}
          providerId={provider.id}
        />
      ) : (
        <OAuthConnectionForm
          accessToken={accessToken}
          connection={connection}
          credential={provider.credential}
          providerId={provider.id}
        />
      )}
    </section>
  );
}

function ApiKeyConnectionForm({
  accessToken,
  connection,
  credential,
  providerId,
}: {
  accessToken: string;
  connection?: McpConnection;
  credential: Extract<McpProvider["credential"], { kind: "api_key" }>;
  providerId: string;
}) {
  const { t } = useUiLanguage();
  const [credentialValue, setCredentialValue] = useState("");
  const test = useTestMcpConnection(accessToken);
  const save = useSaveMcpConnection(accessToken);
  const remove = useRemoveMcpConnection(accessToken);

  const mutationInput = {
    provider: providerId,
    apiKey: credentialValue,
  };

  return (
    <>
      <p className="muted">
        {t(
          "Credential được gửi tới backend và mã hóa trước khi lưu.",
          "The credential is sent to the backend and encrypted before storage.",
        )}
      </p>

      <label>
        {credential.label}
        <input
          autoComplete="off"
          onChange={(event) => setCredentialValue(event.target.value)}
          placeholder={credential.placeholder}
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
            onClick={() => remove.mutate(providerId)}
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
    </>
  );
}

function OAuthConnectionForm({
  accessToken,
  connection,
  credential,
  providerId,
}: {
  accessToken: string;
  connection?: McpConnection;
  credential: Extract<McpProvider["credential"], { kind: "oauth" }>;
  providerId: string;
}) {
  const { t } = useUiLanguage();
  const connect = useStartMcpOAuth(accessToken);
  const remove = useRemoveMcpConnection(accessToken);

  return (
    <>
      <p className="muted">
        {t(
          "Đăng nhập trực tiếp với provider qua OAuth. Gateway mã hóa access/refresh token và không gửi chúng cho GPT.",
          "Sign in with the provider through OAuth. Gateway encrypts access/refresh tokens and never sends them to GPT.",
        )}
      </p>

      {credential.note ? (
        <p className="notice">{t(credential.note.vi, credential.note.en)}</p>
      ) : null}

      <div className="row">
        <button
          disabled={!credential.configured || connect.isPending}
          onClick={() => connect.mutate(providerId)}
          type="button"
        >
          {connection
            ? t("Kết nối lại", "Reconnect")
            : t(credential.connectLabel.vi, credential.connectLabel.en)}
        </button>

        {connection ? (
          <button
            className="danger"
            disabled={remove.isPending}
            onClick={() => remove.mutate(providerId)}
            type="button"
          >
            {t("Ngắt kết nối", "Disconnect")}
          </button>
        ) : null}
      </div>

      {!credential.configured ? (
        <p className="notice error">
          {t(
            "OAuth client cho provider này chưa được cấu hình trên Gateway.",
            "The OAuth client for this provider is not configured on Gateway.",
          )}
        </p>
      ) : null}
      {connect.error ? (
        <p className="notice error">{connect.error.message}</p>
      ) : null}
      {remove.error ? (
        <p className="notice error">{remove.error.message}</p>
      ) : null}
    </>
  );
}
