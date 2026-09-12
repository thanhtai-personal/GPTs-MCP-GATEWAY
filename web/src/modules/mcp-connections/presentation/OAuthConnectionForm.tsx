import { useEffect, useState } from "react";
import { startGoogleWorkspaceOAuth } from "@/modules/mcp-connections/infrastructure/google-workspace-oauth";
import type {
  McpConnection,
  McpProvider,
  McpProviderAccessMode,
} from "@/modules/mcp-connections/domain/mcp-connection.types";
import {
  useRemoveMcpConnection,
  useStartMcpOAuth,
} from "@/modules/mcp-connections/queries/mcp-connections.queries";
import { useUiLanguage } from "@/shared/i18n/ui-language";

const APP_SCREEN_HASHES = new Set([
  "#overview",
  "#mcp-services",
  "#open-id",
  "#gpt-integration",
  "#settings",
]);

function currentReturnTarget() {
  if (typeof window === "undefined") return "#mcp-services";
  return APP_SCREEN_HASHES.has(window.location.hash)
    ? window.location.hash
    : "#mcp-services";
}

export function OAuthConnectionForm({
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
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googlePending, setGooglePending] = useState(false);
  const isGoogleWorkspaceProvider = providerId === "google-workspace";
  const [accessMode, setAccessMode] = useState<McpProviderAccessMode>(
    connection?.accessMode ??
      credential.accessModes?.default ??
      "read",
  );

  useEffect(() => {
    setAccessMode(
      connection?.accessMode ??
        credential.accessModes?.default ??
        "read",
    );
  }, [connection?.accessMode, credential.accessModes?.default]);

  const permissionChanged =
    Boolean(connection) &&
    Boolean(credential.accessModes) &&
    accessMode !==
      (connection?.accessMode ?? credential.accessModes?.default);

  return (
    <>
      <p className="muted">
        {t(
          "Đăng nhập trực tiếp với provider qua OAuth. Gateway mã hóa access/refresh token và không gửi chúng cho GPT.",
          "Sign in with the provider through OAuth. Gateway encrypts access/refresh tokens and never sends them to GPT.",
        )}
      </p>

      {credential.accessModes ? (
        <fieldset className="provider-permissions">
          <legend>{t("Quyền MCP", "MCP permissions")}</legend>
          <div className="provider-permissions__options">
            {credential.accessModes.options.map((option) => (
              <label
                className={`provider-permission-option ${
                  accessMode === option.id ? "active" : ""
                }`}
                key={option.id}
              >
                <input
                  checked={accessMode === option.id}
                  name={`${providerId}-access-mode`}
                  onChange={() => setAccessMode(option.id)}
                  type="radio"
                  value={option.id}
                />
                <span>
                  <strong>{t(option.label.vi, option.label.en)}</strong>
                  <small>
                    {t(option.description.vi, option.description.en)}
                  </small>
                </span>
              </label>
            ))}
          </div>

          {permissionChanged ? (
            <p className="notice">
              {t(
                "Thay đổi quyền sẽ được áp dụng khi bạn kết nối lại provider.",
                "The permission change is applied when you reconnect the provider.",
              )}
            </p>
          ) : null}
        </fieldset>
      ) : null}

      {credential.note ? (
        <p className="notice">{t(credential.note.vi, credential.note.en)}</p>
      ) : null}

      <div className="row provider-actions">
        <button
          disabled={
            !credential.configured ||
            connect.isPending ||
            googlePending
          }
          onClick={() => {
            if (isGoogleWorkspaceProvider) {
              setGooglePending(true);
              setGoogleError(null);
              void startGoogleWorkspaceOAuth(currentReturnTarget()).catch(
                (error: unknown) => {
                  setGooglePending(false);
                  setGoogleError(
                    error instanceof Error
                      ? error.message
                      : "GOOGLE_WORKSPACE_OAUTH_FAILED",
                  );
                },
              );
              return;
            }

            connect.mutate({
              provider: providerId,
              ...(credential.accessModes ? { accessMode } : {}),
              returnTo: currentReturnTarget(),
            });
          }}
          type="button"
        >
          {connection
            ? permissionChanged
              ? t("Kết nối lại để áp dụng", "Reconnect to apply")
              : t("Kết nối lại", "Reconnect")
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
      {googleError ? (
        <p className="notice error">{googleError}</p>
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
