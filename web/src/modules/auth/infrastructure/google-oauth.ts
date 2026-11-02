import {
  isSupabaseBrowserConfigured,
  supabase,
} from "@/modules/auth/infrastructure/supabase-browser";

const OAUTH_CALLBACK_PATH = "/auth/callback";
const RETURN_TO_KEY = "mcp-gateway:auth-return-to";

/** Only the MCP consent page may be resumed after sign-in. */
function isAllowedReturnTo(value: string): boolean {
  return /^\/oauth\/consent\?authorization_id=[A-Za-z0-9_-]{1,128}$/u.test(value);
}

/** Returns (and clears) the page to resume after Google sign-in, if any. */
export function takeSignInReturnTo(): string | null {
  try {
    const value = window.sessionStorage.getItem(RETURN_TO_KEY);
    window.sessionStorage.removeItem(RETURN_TO_KEY);
    return value && isAllowedReturnTo(value) ? value : null;
  } catch {
    return null;
  }
}

function requireBrowser(): Window {
  if (typeof window === "undefined") {
    throw new Error("GOOGLE_OAUTH_BROWSER_REQUIRED");
  }
  return window;
}

export async function startGoogleOAuth(returnTo?: string): Promise<void> {
  if (!isSupabaseBrowserConfigured) {
    throw new Error("SUPABASE_AUTH_NOT_CONFIGURED");
  }

  const browser = requireBrowser();
  if (returnTo && isAllowedReturnTo(returnTo)) {
    try {
      browser.sessionStorage.setItem(RETURN_TO_KEY, returnTo);
    } catch {
      // Sign-in still works; the user just lands on /app afterwards.
    }
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${browser.location.origin}${OAUTH_CALLBACK_PATH}`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
}

export async function completeGoogleOAuth() {
  if (!isSupabaseBrowserConfigured) {
    throw new Error("SUPABASE_AUTH_NOT_CONFIGURED");
  }

  const browser = requireBrowser();
  const code = new URL(browser.location.href).searchParams.get("code");
  if (!code) {
    throw new Error("OAUTH_CALLBACK_CODE_MISSING");
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  if (!data.session || !data.user) {
    throw new Error("OAUTH_SESSION_MISSING");
  }

  return data.session;
}
