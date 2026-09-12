import {
  isSupabaseBrowserConfigured,
  supabase,
} from "@/modules/auth/infrastructure/supabase-browser";

const OAUTH_CALLBACK_PATH = "/auth/callback";

function requireBrowser(): Window {
  if (typeof window === "undefined") {
    throw new Error("GOOGLE_OAUTH_BROWSER_REQUIRED");
  }
  return window;
}

export async function startGoogleOAuth(): Promise<void> {
  if (!isSupabaseBrowserConfigured) {
    throw new Error("SUPABASE_AUTH_NOT_CONFIGURED");
  }

  const browser = requireBrowser();
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
