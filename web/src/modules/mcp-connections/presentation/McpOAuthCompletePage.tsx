import { useEffect, useRef } from "react";
import { useSession } from "@/modules/auth/presentation/hooks/useSession";
import { completeMcpOAuth } from "@/modules/mcp-connections/api/mcp-connections.api";
import { takeOAuthStart } from "@/modules/mcp-connections/infrastructure/oauth-handoff";
import { GatewayApiError } from "@/shared/api/gateway-api";
import { useUiLanguage } from "@/shared/i18n/ui-language";
import { BrandLogo } from "@/shared/branding/BrandLogo";

const RETURN_TARGET = /^#[a-z-]{1,32}$/u;

function readCallbackParams(): URLSearchParams {
  return typeof window === "undefined"
    ? new URLSearchParams()
    : new URLSearchParams(window.location.search);
}

function finish(provider: string, status: "connected" | "error", code?: string, returnTo?: string) {
  const url = new URL("/app", window.location.origin);
  url.searchParams.set("mcpOAuth", provider || "unknown");
  url.searchParams.set("status", status);
  if (code) url.searchParams.set("code", code.slice(0, 120));
  url.hash = returnTo && RETURN_TARGET.test(returnTo) ? returnTo : "#mcp-services";
  window.location.replace(url.toString());
}

/**
 * OAuth return page on the web origin. The Gateway API forwards the provider
 * callback here; this page completes the flow with the signed-in user's
 * token and the browser nonce stored when the flow started.
 */
export function McpOAuthCompletePage() {
  const { t } = useUiLanguage();
  const { session, isLoading } = useSession();
  const params = useRef<URLSearchParams | null>(null);
  const started = useRef(false);

  if (params.current === null) params.current = readCallbackParams();

  useEffect(() => {
    // Keep the one-time authorization code out of history and referrers.
    window.history.replaceState(null, "", "/oauth/complete");
  }, []);

  useEffect(() => {
    if (isLoading || started.current) return;
    started.current = true;

    const query = params.current ?? new URLSearchParams();
    const provider = query.get("provider") ?? "";
    const providerError = query.get("error");
    const code = query.get("code");
    const state = query.get("state");

    if (providerError) return finish(provider, "error", providerError);
    if (!code || !state) return finish(provider, "error", "MCP_OAUTH_CALLBACK_INVALID");

    const pending = takeOAuthStart(state);
    if (!pending || pending.provider !== provider) {
      return finish(provider, "error", "MCP_OAUTH_BROWSER_MISMATCH");
    }
    if (!session?.access_token) return finish(provider, "error", "AUTH_REQUIRED");

    void completeMcpOAuth(session.access_token, provider, {
      code,
      state,
      browserNonce: pending.browserNonce,
      ...(query.get("iss") ? { iss: query.get("iss") ?? undefined } : {}),
    })
      .then((result) => finish(provider, "connected", undefined, result.returnTo))
      .catch((error: unknown) =>
        finish(
          provider,
          "error",
          error instanceof GatewayApiError ? error.code : "MCP_OAUTH_FAILED",
        ),
      );
  }, [isLoading, session]);

  return (
    <main className="oauth-callback">
      <section className="oauth-callback__shell">
        <a className="oauth-callback__brand" href="/">
          <BrandLogo variant="lockup" />
        </a>
        <article className="oauth-handshake">
          <header className="oauth-handshake__header">
            <div className="oauth-handshake__channel">
              <span className="status-dot status-dot--cyan" />
              <span>SECURE PROVIDER CHANNEL</span>
            </div>
            <h1>{t("Đang hoàn tất kết nối", "Completing connection")}</h1>
            <p className="muted">
              {t(
                "Gateway đang xác minh tài khoản và lưu credential đã mã hoá…",
                "Gateway is verifying your account and saving the encrypted credential…",
              )}
            </p>
          </header>
        </article>
      </section>
    </main>
  );
}
