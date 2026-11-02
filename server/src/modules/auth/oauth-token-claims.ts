/**
 * Claims of Supabase access tokens. Tokens issued by the Supabase OAuth 2.1
 * server to third-party MCP clients (ChatGPT, Claude, ...) carry `client_id`;
 * ordinary web sessions do not. Signature and revocation are verified by
 * Supabase (`auth.getUser`) before these claims are trusted.
 */
export type AccessTokenClaims = {
  iss?: unknown;
  aud?: unknown;
  exp?: unknown;
  nbf?: unknown;
  client_id?: unknown;
};

export function decodeAccessTokenClaims(token: string): AccessTokenClaims | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const value: unknown = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    );
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as AccessTokenClaims)
      : null;
  } catch {
    return null;
  }
}

/** True when the token was issued to an OAuth client (e.g. an MCP connector). */
export function isOAuthClientToken(token: string): boolean {
  const claims = decodeAccessTokenClaims(token);
  return typeof claims?.client_id === 'string' && claims.client_id.trim() !== '';
}

/**
 * Validates an MCP OAuth access token's claims and returns its client_id.
 * Returns null when the token is not acceptable for the MCP endpoint.
 */
export function mcpOAuthClientId(
  token: string,
  expected: { issuer: string; audience: string },
  nowSeconds = Math.floor(Date.now() / 1000),
): string | null {
  const claims = decodeAccessTokenClaims(token);
  if (!claims) return null;
  if (typeof claims.client_id !== 'string' || !claims.client_id.trim()) return null;
  if (claims.iss !== expected.issuer) return null;
  const audiences = Array.isArray(claims.aud)
    ? claims.aud.filter((value): value is string => typeof value === 'string')
    : typeof claims.aud === 'string'
      ? [claims.aud]
      : [];
  if (!audiences.includes(expected.audience)) return null;
  if (typeof claims.exp === 'number' && claims.exp <= nowSeconds) return null;
  if (typeof claims.nbf === 'number' && claims.nbf > nowSeconds) return null;
  return claims.client_id;
}
