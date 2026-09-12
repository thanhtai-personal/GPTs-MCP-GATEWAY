import { useState } from "react";
import { startGoogleOAuth } from "@/modules/auth/infrastructure/google-oauth";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export function AuthPanel() {
  const { t } = useUiLanguage();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setIsSigningIn(true);
    setError(null);

    try {
      await startGoogleOAuth();
    } catch {
      setIsSigningIn(false);
      setError(
        t(
          "Không thể bắt đầu đăng nhập Google. Kiểm tra cấu hình Supabase OAuth rồi thử lại.",
          "Could not start Google sign-in. Check the Supabase OAuth configuration and try again.",
        ),
      );
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-card__heading">
        <span className="eyebrow">SECURE ACCOUNT ACCESS</span>
        <h2>{t("Đăng nhập", "Sign in")}</h2>
        <p className="muted">
          {t(
            "Truy cập MCP Gateway account của bạn.",
            "Access your MCP Gateway account.",
          )}
        </p>
      </div>

      <button
        className="auth-google-button"
        disabled={isSigningIn}
        onClick={() => void signInWithGoogle()}
        type="button"
      >
        <span className="google-mark" aria-hidden="true">G</span>
        {isSigningIn
          ? t("Đang chuyển đến Google…", "Redirecting to Google…")
          : t("Tiếp tục với Google", "Continue with Google")}
      </button>

      <div className="auth-security-note">
        <span className="status-dot status-dot--success" />
        <p>
          {t(
            "Google và Supabase Auth xử lý đăng nhập. MCP Gateway không nhận mật khẩu Google và không đưa provider credentials vào GPT context.",
            "Google and Supabase Auth handle sign-in. MCP Gateway never receives your Google password or exposes provider credentials to GPT context.",
          )}
        </p>
      </div>

      {error ? <p className="notice error">{error}</p> : null}
    </section>
  );
}
