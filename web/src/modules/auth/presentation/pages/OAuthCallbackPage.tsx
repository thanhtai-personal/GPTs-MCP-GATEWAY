import { useGoogleOAuthCallback } from "@/modules/auth/presentation/hooks/useGoogleOAuthCallback";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export function OAuthCallbackPage() {
  const { hasError } = useGoogleOAuthCallback();
  const { t } = useUiLanguage();

  return (
    <main className="container dashboard narrow">
      <section className="card auth-card">
        <a className="brand" href="/">
          MCP Gateway
        </a>
        <h1>
          {hasError
            ? t("Không thể hoàn tất đăng nhập", "Could not complete sign-in")
            : t("Đang hoàn tất đăng nhập…", "Completing sign-in…")}
        </h1>
        <p className={hasError ? "notice error" : "muted"}>
          {hasError
            ? t(
                "Liên kết Google đã hết hạn, không hợp lệ hoặc callback chưa được cho phép trong Supabase. Hãy quay lại và thử lại.",
                "The Google sign-in link expired, is invalid, or the callback is not allowed in Supabase. Go back and try again.",
              )
            : t(
                "MCP Gateway đang đổi OAuth code lấy phiên Supabase an toàn.",
                "MCP Gateway is exchanging the OAuth code for your Supabase session.",
              )}
        </p>
        {hasError ? (
          <a className="button secondary" href="/app">
            {t("Quay lại đăng nhập", "Back to sign-in")}
          </a>
        ) : null}
      </section>
    </main>
  );
}
