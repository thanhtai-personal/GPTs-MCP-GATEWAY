import { useEffect, useState } from "react";
import { useUiLanguage } from "@/shared/i18n/ui-language";

type OAuthResult = {
  provider: string;
  status: "connected" | "error";
  code?: string;
};

function readResult(): OAuthResult | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const provider = params.get("mcpOAuth");
  const status = params.get("status");
  if (!provider || (status !== "connected" && status !== "error")) return null;
  return { provider, status, code: params.get("code") ?? undefined };
}

const HINTS: Record<string, { vi: string; en: string }> = {
  MCP_OAUTH_STATE_INVALID: {
    vi: "Phiên cấp quyền đã hết hạn, đã dùng rồi, hoặc được bắt đầu bởi tài khoản khác. Hãy bấm kết nối lại.",
    en: "The authorization session expired, was already used, or belongs to another account. Connect again.",
  },
  MCP_OAUTH_BROWSER_MISMATCH: {
    vi: "Không tìm thấy phiên cấp quyền trong tab này. Hãy bấm kết nối lại trong cùng một tab.",
    en: "No pending authorization was found in this tab. Start the connection again from the same tab.",
  },
  AUTH_REQUIRED: {
    vi: "Bạn cần đăng nhập Gateway trước khi kết nối provider.",
    en: "Sign in to Gateway before connecting a provider.",
  },
  access_denied: {
    vi: "Bạn đã từ chối cấp quyền ở trang của provider.",
    en: "Access was denied on the provider's consent screen.",
  },
};

/** Shows the result of an OAuth connection once, then removes it from the URL. */
export function OAuthResultNotice() {
  const { t } = useUiLanguage();
  const [result, setResult] = useState<OAuthResult | null>(null);

  useEffect(() => {
    const value = readResult();
    if (!value) return;
    setResult(value);
    const url = new URL(window.location.href);
    for (const key of ["mcpOAuth", "status", "code"]) url.searchParams.delete(key);
    window.history.replaceState(window.history.state, "", url.toString());
  }, []);

  if (!result) return null;

  if (result.status === "connected") {
    return (
      <p className="notice success" role="status">
        {t(`Đã kết nối ${result.provider}.`, `${result.provider} connected.`)}
      </p>
    );
  }

  const hint = result.code ? HINTS[result.code] : undefined;
  return (
    <p className="notice error" role="alert">
      {t(`Kết nối ${result.provider} thất bại`, `Could not connect ${result.provider}`)}
      {result.code ? ` (${result.code})` : ""}
      {hint ? `. ${t(hint.vi, hint.en)}` : "."}
    </p>
  );
}
