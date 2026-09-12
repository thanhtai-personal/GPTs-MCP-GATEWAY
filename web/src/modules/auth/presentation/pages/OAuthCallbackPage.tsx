import {
  Check,
  Circle,
  CircleAlert,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useGoogleOAuthCallback } from "@/modules/auth/presentation/hooks/useGoogleOAuthCallback";
import { useUiLanguage } from "@/shared/i18n/ui-language";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";
import { BrandLogo } from "@/shared/branding/BrandLogo";

const loadingSteps = [
  { label: "GOOGLE OAUTH", status: "VERIFIED", state: "complete" },
  { label: "CALLBACK", status: "RECEIVED", state: "complete" },
  { label: "SESSION", status: "ESTABLISHING", state: "active" },
  { label: "GATEWAY", status: "WAITING", state: "pending" },
] as const;

const errorSteps = [
  { label: "GOOGLE OAUTH", status: "RETURNED", state: "complete" },
  { label: "CALLBACK", status: "FAILED", state: "error" },
  { label: "SESSION", status: "NOT CREATED", state: "pending" },
  { label: "GATEWAY", status: "CANCELLED", state: "pending" },
] as const;

export function OAuthCallbackPage() {
  const { hasError } = useGoogleOAuthCallback();
  const { t } = useUiLanguage();
  const steps = hasError ? errorSteps : loadingSteps;

  return (
    <main className={`oauth-callback${hasError ? " oauth-callback--error" : ""}`}>
      <div className="oauth-callback__grid" aria-hidden="true" />
      <div className="oauth-callback__aurora oauth-callback__aurora--indigo" aria-hidden="true" />
      <div className="oauth-callback__aurora oauth-callback__aurora--cyan" aria-hidden="true" />

      <div className="oauth-callback__theme">
        <ThemeToggle compact />
      </div>

      <section className="oauth-callback__shell">
        <a className="oauth-callback__brand" href="/">
          <BrandLogo variant="lockup" />
        </a>

        <article className="oauth-handshake">
          <div className="oauth-handshake__edge" aria-hidden="true" />

          <header className="oauth-handshake__header">
            <div className="oauth-handshake__channel">
              <span className={`status-dot ${hasError ? "status-dot--error" : "status-dot--cyan"}`} />
              <span>{hasError ? "AUTH CALLBACK ERROR" : "SECURE AUTH CHANNEL"}</span>
            </div>
            <span className="eyebrow">SESSION HANDSHAKE</span>
            <h1>
              {hasError
                ? t("Không thể hoàn tất đăng nhập", "Could not complete sign-in")
                : t("Đang hoàn tất đăng nhập", "Completing sign-in")}
            </h1>
            <p>
              {hasError
                ? t(
                    "Phiên xác thực không hợp lệ hoặc đã hết hạn. Hãy quay lại và thử đăng nhập lại.",
                    "The authentication session is invalid or expired. Return and try signing in again.",
                  )
                : t(
                    "Đang thiết lập phiên bảo mật và chuẩn bị MCP Gateway của bạn.",
                    "Establishing your secure session and preparing MCP Gateway.",
                  )}
            </p>
          </header>

          <div className="oauth-orbit" aria-label="Authentication handshake">
            <div className="oauth-orbit__halo" aria-hidden="true" />
            <div className="oauth-orbit__ring oauth-orbit__ring--outer" aria-hidden="true" />
            <div className="oauth-orbit__ring oauth-orbit__ring--inner" aria-hidden="true" />
            <div className="oauth-orbit__beam" aria-hidden="true" />

            <div className="oauth-orbit__core">
              <span>{hasError ? <CircleAlert size={27} /> : <ShieldCheck size={27} />}</span>
              <small>{hasError ? "HANDSHAKE" : "MCP GATEWAY"}</small>
              <strong>{hasError ? "FAILED" : "SESSION"}</strong>
            </div>

            {steps.map((step, index) => (
              <div
                className={`oauth-orbit__node oauth-orbit__node--${index + 1} is-${step.state}`}
                key={step.label}
              >
                <span>
                  {step.state === "complete" ? (
                    <Check size={13} strokeWidth={3} />
                  ) : step.state === "error" ? (
                    <CircleAlert size={13} />
                  ) : (
                    <Circle size={10} fill="currentColor" />
                  )}
                </span>
                <div>
                  <small>{step.label}</small>
                  <strong>{step.status}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="oauth-protocol">
            {steps.map((step, index) => (
              <div className={`oauth-protocol__step is-${step.state}`} key={step.label}>
                <span>0{index + 1}</span>
                <div>
                  <small>{step.label}</small>
                  <strong>{step.status}</strong>
                </div>
                <i aria-hidden="true" />
              </div>
            ))}
          </div>

          <div className="oauth-trace">
            <div className="oauth-trace__top">
              <span>AUTH HANDSHAKE</span>
              <span className={hasError ? "is-error" : "is-live"}>
                {hasError ? "FAILED" : "LIVE"}
              </span>
            </div>
            {hasError ? (
              <>
                <code><span>&gt;</span> oauth.callback received <b>✓</b></code>
                <code className="is-error"><span>&gt;</span> session exchange failed <b>!</b></code>
                <code className="is-muted"><span>&gt;</span> redirect cancelled <b>—</b></code>
              </>
            ) : (
              <>
                <code><span>&gt;</span> oauth.callback received <b>✓</b></code>
                <code><span>&gt;</span> exchanging authorization code <b>✓</b></code>
                <code className="is-active"><span>&gt;</span> establishing secure session <b>●</b></code>
                <code className="is-muted"><span>&gt;</span> preparing workspace <b>·</b></code>
              </>
            )}
          </div>

          {hasError ? (
            <div className="oauth-handshake__actions">
              <a className="button" href="/app">{t("Thử đăng nhập lại", "Try again")}</a>
              <a className="button secondary" href="/">{t("Về trang chủ", "Back to home")}</a>
            </div>
          ) : (
            <div className="oauth-handshake__progress" aria-hidden="true"><i /></div>
          )}

          <footer className="oauth-handshake__footer">
            <LockKeyhole size={14} />
            <div>
              <strong>{hasError ? "AUTHENTICATION INTERRUPTED" : "END-TO-END SECURE SESSION"}</strong>
              <span>Google OAuth · Supabase Auth · MCP Gateway</span>
            </div>
          </footer>
        </article>
      </section>
    </main>
  );
}
