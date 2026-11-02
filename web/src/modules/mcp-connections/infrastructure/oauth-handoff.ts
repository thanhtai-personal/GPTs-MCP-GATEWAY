/**
 * Keeps the per-flow browser nonce between "Connect" and the OAuth return.
 *
 * The nonce lives in sessionStorage on the web origin (not in a Gateway API
 * cookie), so the flow works when web and API are on different sites, e.g.
 * two *.vercel.app domains. It is sent back only with the authenticated
 * completion request, which binds the provider account to this browser and
 * to the signed-in user.
 */
const PREFIX = "mcp-oauth:";
const MAX_AGE_MS = 15 * 60 * 1000;

type PendingOAuth = {
  provider: string;
  browserNonce: string;
  createdAt: number;
};

function stateFrom(authorizationUrl: string): string {
  const state = new URL(authorizationUrl).searchParams.get("state");
  if (!state) throw new Error("MCP_OAUTH_STATE_MISSING");
  return state;
}

export function rememberOAuthStart(
  provider: string,
  authorizationUrl: string,
  browserNonce: string,
): void {
  const value: PendingOAuth = { provider, browserNonce, createdAt: Date.now() };
  try {
    window.sessionStorage.setItem(
      `${PREFIX}${stateFrom(authorizationUrl)}`,
      JSON.stringify(value),
    );
  } catch {
    throw new Error("MCP_OAUTH_BROWSER_STORAGE_UNAVAILABLE");
  }
}

export function takeOAuthStart(state: string): PendingOAuth | null {
  const key = `${PREFIX}${state}`;
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(key);
    window.sessionStorage.removeItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<PendingOAuth>;
    if (
      typeof value.provider !== "string" ||
      typeof value.browserNonce !== "string" ||
      typeof value.createdAt !== "number" ||
      Date.now() - value.createdAt > MAX_AGE_MS
    ) {
      return null;
    }
    return value as PendingOAuth;
  } catch {
    return null;
  }
}

/** Starts the provider redirect after remembering the nonce for this tab. */
export function redirectToOAuth(result: {
  provider: string;
  authorizationUrl: string;
  browserNonce: string;
}): void {
  rememberOAuthStart(result.provider, result.authorizationUrl, result.browserNonce);
  window.location.assign(result.authorizationUrl);
}
