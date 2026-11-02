import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  type AuthorizationConsentDetails,
  decideAuthorization,
  getAuthorizationDetails,
} from "@/modules/auth/api/oauth-consent.api";
import { startGoogleOAuth } from "@/modules/auth/infrastructure/google-oauth";
import { useSession } from "@/modules/auth/presentation/hooks/useSession";
import { GatewayApiError } from "@/shared/api/gateway-api";
import { BrandLogo } from "@/shared/branding/BrandLogo";
import { useUiLanguage } from "@/shared/i18n/ui-language";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";

function readAuthorizationId(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("authorization_id") ?? "";
}

function errorCode(error: unknown): string {
  if (error instanceof GatewayApiError) return error.code;
  return error instanceof Error ? error.message : "OAUTH_AUTHORIZATION_FAILED";
}

/**
 * Consent screen for MCP clients (ChatGPT, Claude, ...) using the Supabase
 * OAuth 2.1 server. Signing in never approves by itself; the user must
 * press Allow.
 */
export function OAuthConsentPage() {
  const { t } = useUiLanguage();
  const { session, isLoading } = useSession();
  const [authorizationId] = useState(readAuthorizationId);
  const [details, setDetails] = useState<AuthorizationConsentDetails | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const accessToken = session?.access_token ?? "";

  useEffect(() => {
    if (!accessToken || !authorizationId) return;
    let cancelled = false;
    void getAuthorizationDetails(accessToken, authorizationId)
      .then((next) => {
        if (cancelled) return;
        if ("redirect_url" in next) {
          window.location.assign(next.redirect_url);
          return;
        }
        setDetails(next);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(errorCode(caught));
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, authorizationId]);

  async function decide(decision: "approve" | "deny") {
    setBusy(true);
    setError("");
    try {
      const result = await decideAuthorization(accessToken, authorizationId, decision);
      if (!result.redirect_url) throw new Error("OAUTH_REDIRECT_MISSING");
      window.location.assign(result.redirect_url);
    } catch (caught) {
      setError(errorCode(caught));
      setBusy(false);
    }
  }

  function signIn() {
    setBusy(true);
    void startGoogleOAuth(`/oauth/consent?authorization_id=${authorizationId}`).catch(() => {
      setBusy(false);
      setError("GOOGLE_OAUTH_START_FAILED");
    });
  }

  return (
    <main className="oauth-callback">
      <div className="oauth-callback__grid" aria-hidden="true" />
      <div className="oauth-callback__theme">
        <ThemeToggle compact />
      </div>
      <section className="oauth-callback__shell">
        <a className="oauth-callback__brand" href="/">
          <BrandLogo variant="lockup" />
        </a>
        <article className="oauth-handshake" aria-busy={busy}>
          <header className="oauth-handshake__header">
            <div className="oauth-handshake__channel">
              <span className="status-dot status-dot--cyan" />
              <span>MCP CONNECTOR</span>
            </div>
            <h1>{t("Kết nối MCP Gateway", "Connect MCP Gateway")}</h1>
            <p className="muted">
              {t(
                "Cho phép ứng dụng AI dùng các service bạn đã kết nối trong Gateway (Google Drive, GitHub, Notion…). Credential của provider không bao giờ được gửi cho ứng dụng.",
                "Allow the AI app to use the services you connected in Gateway (Google Drive, GitHub, Notion…). Provider credentials are never sent to the app.",
              )}
            </p>
          </header>

          {!authorizationId ? (
            <p className="notice error">{t("Thiếu authorization_id trong yêu cầu.", "The request is missing authorization_id.")}</p>
          ) : isLoading ? (
            <p className="muted">{t("Đang kiểm tra phiên đăng nhập…", "Checking your session…")}</p>
          ) : !session ? (
            <button className="auth-google-button" disabled={busy} onClick={signIn} type="button">
              <span className="google-mark" aria-hidden="true">G</span>
              {t("Đăng nhập với Google để tiếp tục", "Sign in with Google to continue")}
            </button>
          ) : details ? (
            <>
              <dl className="consent-details">
                <div><dt>{t("Ứng dụng yêu cầu", "Requesting app")}</dt><dd>{details.client.name}</dd></div>
                {details.client.uri ? <div><dt>{t("Website", "Website")}</dt><dd>{details.client.uri}</dd></div> : null}
                <div><dt>{t("Tài khoản Gateway", "Gateway account")}</dt><dd>{details.user.email}</dd></div>
                <div><dt>{t("Chuyển hướng về", "Redirects to")}</dt><dd><code>{details.redirect_uri}</code></dd></div>
                <div><dt>{t("Quyền", "Scopes")}</dt><dd><code>{details.scope}</code></dd></div>
              </dl>
              <p className="notice">
                <ShieldCheck size={14} aria-hidden="true" />{" "}
                {t(
                  "Chỉ cho phép nếu bạn nhận ra ứng dụng và địa chỉ chuyển hướng ở trên. Dùng tool cần tài khoản member hoặc trial còn hạn.",
                  "Only allow this if you recognize the app and redirect address above. Using tools requires a member account or an active trial.",
                )}
              </p>
              <div className="row provider-actions">
                <button className="secondary" disabled={busy} onClick={() => void decide("deny")} type="button">
                  {t("Từ chối", "Deny")}
                </button>
                <button disabled={busy} onClick={() => void decide("approve")} type="button">
                  {busy ? t("Đang xử lý…", "Working…") : t("Cho phép kết nối", "Allow connection")}
                </button>
              </div>
            </>
          ) : !error ? (
            <p className="muted">{t("Đang tải yêu cầu kết nối…", "Loading the connection request…")}</p>
          ) : null}

          {error ? <p className="notice error" role="alert">{error}</p> : null}
        </article>
      </section>
    </main>
  );
}
