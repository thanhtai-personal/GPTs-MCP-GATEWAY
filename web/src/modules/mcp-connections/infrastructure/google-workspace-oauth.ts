import { supabase } from "@/modules/auth/infrastructure/supabase-browser";

const PENDING_KEY = "mcp-gateway.google-workspace-oauth";
const CALLBACK_PATH = "/auth/callback";

const GOOGLE_WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/documents.readonly",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
].join(" ");

type PendingGoogleWorkspaceOAuth = {
  returnTo: string;
};

export async function startGoogleWorkspaceOAuth(returnTo: string) {
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user.email;

  sessionStorage.setItem(
    PENDING_KEY,
    JSON.stringify({ returnTo } satisfies PendingGoogleWorkspaceOAuth),
  );

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${CALLBACK_PATH}`,
      scopes: GOOGLE_WORKSPACE_SCOPES,
      queryParams: {
        access_type: "offline",
        include_granted_scopes: "true",
        prompt: "consent",
        ...(email ? { login_hint: email } : {}),
      },
    },
  });

  if (error) {
    sessionStorage.removeItem(PENDING_KEY);
    throw error;
  }
}

export function readPendingGoogleWorkspaceOAuth():
  | PendingGoogleWorkspaceOAuth
  | null {
  const raw = sessionStorage.getItem(PENDING_KEY);
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as unknown;
    if (
      typeof value === "object" &&
      value !== null &&
      "returnTo" in value &&
      typeof value.returnTo === "string"
    ) {
      return { returnTo: value.returnTo };
    }
  } catch {
    // Invalid/stale browser state is cleared below.
  }

  sessionStorage.removeItem(PENDING_KEY);
  return null;
}

export function clearPendingGoogleWorkspaceOAuth() {
  sessionStorage.removeItem(PENDING_KEY);
}
