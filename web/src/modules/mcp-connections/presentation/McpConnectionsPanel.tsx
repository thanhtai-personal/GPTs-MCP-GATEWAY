import { BookOpenText, ChevronDown, Github, KeyRound, Link2, PlugZap, ShieldCheck } from "lucide-react";
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
import { OAuthConnectionForm } from "@/modules/mcp-connections/presentation/OAuthConnectionForm";
import {
  ProviderViewToolbar,
  type ProviderViewMode,
} from "@/modules/mcp-connections/presentation/ProviderViewToolbar";

export function McpConnectionsPanel({ accessToken }: { accessToken: string }) {
  const { t } = useUiLanguage();
  const providers = useMcpProviders(accessToken);
  const connections = useMcpConnections(accessToken);
  const [viewMode, setViewMode] = useState<ProviderViewMode>("grid");
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
    () => new Set(),
  );

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
  const allExpanded =
    providerList.length > 0 &&
    providerList.every((provider) => expandedProviders.has(provider.id));

  const toggleProvider = (providerId: string) => {
    setExpandedProviders((current) => {
      const next = new Set(current);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  const toggleAllProviders = () => {
    setExpandedProviders(
      allExpanded
        ? new Set()
        : new Set(providerList.map((provider) => provider.id)),
    );
  };

  return (
    <div className="provider-list cinematic-connectors">
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
          <span className="provider-summary__value">
            {providerList.filter((provider) => provider.status === "available").length}
          </span>
          <span>{t("Provider khả dụng", "Available providers")}</span>
        </div>
      </div>

      <div className="connector-diagnostics">
        <div><span>CATALOG</span><strong>{providerList.length} APPROVED</strong><small>Gateway-defined providers</small></div>
        <div><span>CONNECTIONS</span><strong>{connectionList.length} SAVED</strong><small>Account-owned credentials</small></div>
        <div><span>SECURITY</span><strong>ENCRYPTED</strong><small>Credentials never enter GPT context</small></div>
        <div><span>TRANSPORT</span><strong>MCP</strong><small>Runtime tool discovery</small></div>
      </div>

      <ProviderViewToolbar
        allExpanded={allExpanded}
        onToggleAll={toggleAllProviders}
        onViewModeChange={setViewMode}
        viewMode={viewMode}
      />

      <div className={`provider-frame provider-frame--${viewMode}`}>
        {providerList.map((provider) => (
          <McpProviderCard
            accessToken={accessToken}
            connection={connectionList.find(
              (connection) => connection.provider === provider.id,
            )}
            expanded={expandedProviders.has(provider.id)}
            key={provider.id}
            onToggle={() => toggleProvider(provider.id)}
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
  expanded,
  onToggle,
  provider,
}: {
  accessToken: string;
  connection?: McpConnection;
  expanded: boolean;
  onToggle: () => void;
  provider: McpProvider;
}) {
  const { t } = useUiLanguage();
  const isConnected = connection?.status === "connected";

  return (
    <section
      className={`card provider-card ${expanded ? "is-expanded" : "is-collapsed"}`}
    >
      <div className="provider-card__header">
        <div className="provider-card__identity">
          <span className="provider-logo">
            {
              provider.id === "stitch"
                ? "S"
                : provider.id === "github"
                  ? <Github size={20} />
                  : provider.id === "notion"
                    ? <BookOpenText size={20} />
                    : <PlugZap size={20} />
            }
          </span>
          <div>
            <span className="eyebrow">MCP PROVIDER</span>
            <h2>{provider.name}</h2>
          </div>
        </div>
        <div className="provider-card__header-actions">
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
          <button
            aria-expanded={expanded}
            aria-label={
              expanded
                ? t(`Thu gọn ${provider.name}`, `Collapse ${provider.name}`)
                : t(`Mở rộng ${provider.name}`, `Expand ${provider.name}`)
            }
            className="provider-card__toggle"
            onClick={onToggle}
            type="button"
          >
            <ChevronDown className={expanded ? "is-expanded" : ""} size={17} />
          </button>
        </div>
      </div>

      <div className="provider-card__meta">
        <span><ShieldCheck size={14} /> {t("Credential mã hóa server-side", "Server-side encrypted credential")}</span>
        <span>
          {provider.credential.kind === "api_key" ? <KeyRound size={14} /> : <Link2 size={14} />}
          {provider.credential.kind === "api_key" ? "API KEY" : "OAUTH"}
        </span>
        {!expanded && connection?.lastVerifiedAt ? (
          <span className="provider-card__verified-compact">
            {t("Xác minh", "Verified")} <code>{connection.lastVerifiedAt}</code>
          </span>
        ) : null}
      </div>

      <div className="provider-card__collapsible" hidden={!expanded}>
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
      </div>
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
