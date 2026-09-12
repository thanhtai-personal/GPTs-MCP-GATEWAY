import { useState } from "react";
import { startGoogleOAuth } from "@/modules/auth/infrastructure/google-oauth";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export function AuthPanel() {
  const { t } = useUiLanguage();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setIsSigningIn(true); setError(null);
    try { await startGoogleOAuth(); } catch {
      setIsSigningIn(false);
      setError(t("Không thể bắt đầu đăng nhập Google. Kiểm tra cấu hình Supabase OAuth rồi thử lại.", "Could not start Google sign-in. Check the Supabase OAuth configuration and try again."));
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-card__heading"><span className="eyebrow">{t("TRUY CẬP TÀI KHOẢN BẢO MẬT", "SECURE ACCOUNT ACCESS", "安全账户访问", "보안 계정 액세스", "安全なアカウントアクセス")}</span><h2>{t("Đăng nhập", "Sign in")}</h2><p className="muted">{t("Truy cập MCP Gateway account của bạn.", "Access your MCP Gateway account.", "访问你的 MCP Gateway 账户。", "MCP Gateway 계정에 접속하세요.", "MCP Gateway アカウントにアクセスします。")}</p></div>
      <button className="auth-google-button" disabled={isSigningIn} onClick={() => void signInWithGoogle()} type="button"><span className="google-mark" aria-hidden="true">G</span>{isSigningIn ? t("Đang chuyển đến Google…", "Redirecting to Google…") : t("Tiếp tục với Google", "Continue with Google")}</button>
      <div className="auth-security-note"><span className="status-dot status-dot--success" /><p>{t("Google và Supabase Auth xử lý đăng nhập. MCP Gateway không nhận mật khẩu Google và không đưa provider credentials vào GPT context.", "Google and Supabase Auth handle sign-in. MCP Gateway never receives your Google password or exposes provider credentials to GPT context.", "Google 和 Supabase Auth 负责登录。MCP Gateway 不会接收你的 Google 密码，也不会把 Provider 凭据暴露给 GPT context。", "Google과 Supabase Auth가 로그인을 처리합니다. MCP Gateway는 Google 비밀번호를 받지 않으며 Provider 자격 증명을 GPT context에 노출하지 않습니다.", "Google と Supabase Auth がログインを処理します。MCP Gateway は Google パスワードを受け取らず、Provider 認証情報を GPT context に公開しません。")}</p></div>
      {error ? <p className="notice error">{error}</p> : null}
    </section>
  );
}
