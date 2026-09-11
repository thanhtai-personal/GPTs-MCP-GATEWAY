import { useState } from "react";
import { supabase } from "@/modules/auth/infrastructure/supabase-browser";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export function AuthPanel() {
  const { t } = useUiLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(mode: "signin" | "signup") {
    setBusy(true);
    setMessage(null);
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    setMessage(
      result.error
        ? result.error.message
        : mode === "signup"
          ? t("Đã tạo tài khoản. Kiểm tra email nếu dự án bật xác minh.", "Account created. Check email if confirmation is enabled.")
          : t("Đăng nhập thành công.", "Signed in."),
    );
  }

  return (
    <section className="card auth-card">
      <h2>{t("Đăng nhập MCP Gateway", "Sign in to MCP Gateway")}</h2>
      <p className="muted">
        {t(
          "Đăng nhập để thêm MCP key, lấy GPT kit và bắt đầu trial.",
          "Sign in to add MCP keys, download the GPT kit, and start your trial.",
        )}
      </p>
      <label>
        Email
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
      </label>
      <label>
        {t("Mật khẩu", "Password")}
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
        />
      </label>
      <div className="row">
        <button disabled={busy} onClick={() => void submit("signin")} type="button">
          {t("Đăng nhập", "Sign in")}
        </button>
        <button
          className="secondary"
          disabled={busy}
          onClick={() => void submit("signup")}
          type="button"
        >
          {t("Tạo tài khoản", "Create account")}
        </button>
      </div>
      {message ? <p className="notice">{message}</p> : null}
    </section>
  );
}
