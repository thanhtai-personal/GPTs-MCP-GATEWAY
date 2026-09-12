import { KeyRound, Link2, PlugZap, ShieldCheck } from "lucide-react";
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
      <section className="card provider-loading-card">
        <span className="provider-logo"><PlugZap size={20} /></span>
        <div>
          <strong>{t("Đang tải MCP services", "Loading MCP services")}</strong>
          <p className="muted">{t("Đang đồng bộ provider catalog từ Gateway…", "Syncing the provider catalog from Gateway…")}</p>
        </div>
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

  const providerList = providers.data ?? [];
  const connectionList = connections.data ?? [];

  return (
    <div className="provider-list">
      <div className="provider-summary">
        <div>
          <span className="provider-summary__value">{providerList.length}</span>
          <span>{t("Provider catalog", "Provider catalog")}</span>
        </div>
        <div>
          <span className="provider-summary__value">{connectionList.length}</span>
          <span>{t("Credential connections", "Credential connections")}</span>
        </div>
        <div>
          <span className="provider-summary__value">Stitch</span>
          <span>{t("Provider khả dụng", "Provider khả dụng")}</span>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid--providers">
        {providerList.map((provider) => (
          <McpProviderCard
            accessToken={accessToken}
            connection={connectionList.find(
              (connection) => connection.provider === provider.id,
            )}
            key={provider.id}
            provider={provider}
          />
        ))}
      </div>

      {!providerList.length ? (
        <section className="card empty-state">
          <PlugZap size={24} />
          <strong>{t("Chưa có MCP provider", "No MCP providers available")}</strong>
          <p className="muted">{t("Gateway chưa trả về provider nào.", "Gateway returned no provider catalog entries.")}</p>
        </section>
      ) : null}
    </div>
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
  const isConnected = connection?.status === "connected";

  return (
    <section className="card provider-card">
      <div className="provider-card__header">
        <div className="provider-card__identity">
          <span className="provider-logo">
            {provider.id.toLowerCase().includes("stitch") ? "S" : <PlugZap size={20} />}
          </span>
          <div>
            <span className="eyebrow">MCP PROVIDER</span>
            <h2>{provider.name}</h2>
          </div>
        </div>
        <span className={`status ${isConnected ? "good" : ""}`}>
          {isConnected
            ? t("Đã kết nối", "Connected")
            : provider.status === "pending_review"
              ? t("Đang chờ xét duyệt", "Pending review")
              : provider.status === "provider_restricted"
                ? t("Provider đang giới hạn", "Provider restricted")
                : provider.status === "requires_configuration"
                  ? t("Cần cấu hình", "Setup required")
                  : t("Chưa kết nối", "Not connected")}
        </span>
      </div>

      <div className="provider-card__meta">
        <span><ShieldCheck size={14} /> {t("Credential mã hóa server-side", "Server-side encrypted credential")}</span>
        <span>
          {provider.credential.kind === "api_key" ? <KeyRound size={14} /> : <Link2 size={14} />}
          {provider.credential.kind === "api_key" ? "API KEY" : "OAUTH"}
        </span>
      </div>

      <div className="provider-card__form">
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
            providerStatus={provider.status}
          />
        )}
      </div>

      {connection?.lastVerifiedAt ? (
        <div className="provider-card__footer">
          <span>{t("Xác minh gần nhất", "Last verified")}</span>
          <code>{connection.lastVerifiedAt}</code>
        </div>
      ) : null}
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
          "Credential chỉ gửi tới Gateway backend và được mã hóa trước khi lưu. GPT không nhận provider credential.",
          "The credential is sent only to Gateway backend and encrypted before storage. GPT never receives the provider credential.",
        )}
      </p>

      <label className="credential-field">
        <span>{credential.label}</span>
        <input
          autoComplete="off"
          onChange={(event) => setCredentialValue(event.target.value)}
          placeholder={credential.placeholder}
          type="password"
          value={credentialValue}
        />
      </label>

      <div className="row provider-actions">
        <button
          disabled={!credentialValue || test.isPending}
          onClick={() => test.mutate(mutationInput)}
          type="button"
        >
          {t("Kiểm tra kết nối", "Test connection")}
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
          {t("Lưu credential", "Save credential")}
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
  providerStatus,
}: {
  accessToken: string;
  connection?: McpConnection;
  credential: Extract<McpProvider["credential"], { kind: "oauth" }>;
  providerId: string;
  providerStatus: McpProvider["status"];
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

      <div className="row provider-actions">
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
        <p
          className={`notice ${
            providerStatus === "pending_review" ||
            providerStatus === "provider_restricted"
              ? ""
              : "error"
          }`}
        >
          {providerStatus === "pending_review"
            ? t(
                "Provider đang chờ xét duyệt. Kết nối sẽ được bật sau khi provider phê duyệt MCP client và OAuth client được cấu hình.",
                "Provider review is pending. Connect will be enabled after the MCP client is approved and its OAuth client is configured.",
              )
            : providerStatus === "provider_restricted"
              ? t(
                  "Provider hiện chưa cho phép OAuth từ Gateway hosted này. Kết nối sẽ được bật khi provider cho phép hoặc đăng ký OAuth client riêng cho Gateway.",
                  "The provider does not currently allow OAuth from this hosted Gateway. Connect will be enabled when the provider allows or registers an OAuth client for the Gateway.",
                )
              : t(
                  "OAuth client cho provider này chưa được cấu hình trên Gateway.",
                  "The OAuth client for this provider is not configured on Gateway.",
                )}
        </p>
      ) : null}
      {connect.error ? <p className="notice error">{connect.error.message}</p> : null}
      {remove.error ? <p className="notice error">{remove.error.message}</p> : null}
    </>
  );
}
