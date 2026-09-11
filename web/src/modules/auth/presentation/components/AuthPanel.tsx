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
    <section className="card auth-card">
      <h2>{t("Đăng nhập MCP Gateway", "Sign in to MCP Gateway")}</h2>
      <p className="muted">
        {t(
          "Dùng tài khoản Google để thêm MCP key, lấy GPT kit và bắt đầu trial.",
          "Use your Google account to add MCP keys, download the GPT kit, and start your trial.",
        )}
      </p>

      <button
        disabled={isSigningIn}
        onClick={() => void signInWithGoogle()}
        type="button"
      >
        {isSigningIn
          ? t("Đang chuyển đến Google…", "Redirecting to Google…")
          : t("Tiếp tục với Google", "Continue with Google")}
      </button>

      <p className="muted">
        {t(
          "Đăng nhập được xử lý bởi Google và Supabase Auth. MCP Gateway không nhận mật khẩu Google của bạn.",
          "Sign-in is handled by Google and Supabase Auth. MCP Gateway never receives your Google password.",
        )}
      </p>

      {error ? <p className="notice error">{error}</p> : null}
    </section>
  );
}
