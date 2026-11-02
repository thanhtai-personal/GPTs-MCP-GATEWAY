# Security Model

This document describes controls present in the current source and known limitations. It is not a security certification.

## Assets to protect

Highest-value secrets/data:

1. Supabase service-role key.
2. MCP credential encryption key.
3. users' provider API keys.
4. raw Gateway tokens.
5. Supabase user access tokens.
6. provider tool arguments/results that may contain sensitive data.

## Trust boundaries

```text
Browser (untrusted)
  -> Dashboard API (trusted server)
      -> Supabase service-role access
      -> encryption key

Custom GPT / external Action caller (untrusted)
  -> GPT Runtime API
      -> Gateway token validation
      -> Open ID entitlement
      -> provider adapter
      -> external MCP provider (untrusted external system)
```

Provider responses and MCP tool output are external/untrusted even after a successful authenticated call.

## Controls implemented

### Provider credentials

Saved API keys are encrypted with AES-256-GCM.

Serialized format includes:

- version;
- random 12-byte IV;
- authentication tag;
- ciphertext.

The encryption key is loaded only by the server.

### Gateway credentials

Raw Gateway tokens are high-entropy generated secrets.

The database stores:

- SHA-256 hash;
- display prefix;
- metadata.

The raw token is returned only on creation.

### Entitlement

A token is not enough by itself.

Authentication requires:

- active credential;
- non-expired credential if expiry exists;
- active Open ID;
- non-expired Open ID if expiry exists;
- active app account;
- `member` membership for a paid Open ID.

### Trial replay / double claim

`trial_entitlements.user_id` is unique and the `claim_gateway_trial` RPC performs claim/Open ID/token creation atomically.

Revoke/delete/expiry cannot recreate eligibility.

### Database access

Sensitive tables enable RLS and revoke direct table privileges from `anon` and `authenticated`.

Trusted backend operations use the Supabase service-role client.

### Arbitrary upstream prevention

Provider selection goes through `McpProviderRegistry`.

The current app does not accept an arbitrary MCP URL from users, reducing SSRF and credential-exfiltration risk.

### Browser secret boundary

The codebase check rejects browser references to `SUPABASE_SERVICE_ROLE_KEY`.

Production processes still need standard secret-management discipline.

### HTTP hardening

NestJS enables Helmet and an explicit CORS allowlist.

Application throttling is enabled globally through Nest Throttler.

### MCP OAuth account binding

Provider OAuth starts create a short-lived database transaction. The server stores only a hash of a random browser nonce and returns the nonce to the signed-in web app, which keeps it in `sessionStorage` on the web origin, keyed by the OAuth `state`. Google Workspace and generic MCP OAuth flows both use PKCE with `S256`.

The provider redirects to the Gateway callback (`/api/v1/mcp-connections/:provider/oauth/callback`), which does not complete anything: it forwards `code`, `state`, `iss` and `error` to the web page `/oauth/complete` with `303` and `Referrer-Policy: no-referrer`. That page calls `POST /api/v1/mcp-connections/:provider/oauth/complete` with the user's Supabase bearer token and the stored nonce. The server completes only when the authenticated user equals the user encoded in the encrypted `state`, and the nonce hash matches and is atomically consumed before the code is exchanged. A copied authorization URL or callback URL therefore cannot connect a provider account to another user or another browser tab.

This design needs no cross-site cookie, so it works when the web app and the Gateway API run on different sites (for example two `*.vercel.app` domains, which are separate sites because `vercel.app` is a public suffix). Apply migration `004_mcp_oauth_transactions.sql` before enabling OAuth connections.

Remote MCP tool calls must name a tool returned by the provider's current `tools/list` response. Each MCP response is read with a configurable byte limit (`MCP_UPSTREAM_MAX_RESPONSE_BYTES`, default 16 MiB).

## Important limitations

### No encryption-key rotation workflow

`credential_version` exists in storage, but the current application does not implement multi-key decryption/rotation.

Changing `MCP_CREDENTIAL_ENCRYPTION_KEY` without migrating ciphertext will make saved provider credentials unreadable.

### Upstream tool output is untrusted

A successful MCP provider response can still contain malicious or misleading text.

The Gateway does not currently implement content policy, prompt-injection detection, or provider-result sanitization beyond protocol/error handling.

Generated GPT instructions tell the GPT to treat external results as data, but this is not a complete isolation boundary.

### Generic tool arguments

The outer `callMcpTool` DTO validates the presence/shape of the `arguments` object, while the provider's dynamic `inputSchema` is consumed by the GPT.

The Gateway does not currently perform full JSON Schema validation against each runtime MCP tool schema before forwarding.

### Audit coverage

The audit layer records event metadata without intentionally logging provider secrets. Contributors must preserve that property.

Do not add full request-body logging to Gateway/MCP routes without a data-classification review.

### Global application rate limit

Current rate limiting is application-level and basic. Public deployments should also enforce edge/WAF abuse controls and consider per-user/per-credential/provider quotas if abuse appears.

### Payment/admin is outside the MVP

Membership promotion is not exposed as a public flow. A future billing/admin implementation becomes a high-trust authorization boundary and requires dedicated testing.

## Threats to consider when extending

### Adding arbitrary MCP URLs

Requires at minimum:

- URL scheme/host policy;
- DNS rebinding defense;
- private/link-local IP blocking;
- egress firewall;
- redirect policy;
- credential destination binding;
- per-provider trust UI.

Do not simply add a URL text field to the current adapter model.

### Adding OAuth providers

Requires:

- state/PKCE where applicable;
- encrypted refresh tokens;
- callback origin validation;
- token refresh/error semantics;
- revocation;
- scopes shown to users.

### Adding team/workspace sharing

Requires changing ownership from a simple `user_id` boundary to workspace membership/roles. Do not reuse current single-user authorization checks without redesign.

## Secret rotation / incident response

If a Gateway token leaks:

1. revoke that token;
2. generate another allowed token;
3. inspect audit metadata for unexpected use.

If a provider API key leaks:

1. revoke/rotate it at the provider;
2. save the new key in MCP Gateway;
3. inspect audit events.

If `MCP_CREDENTIAL_ENCRYPTION_KEY` leaks:

1. treat all stored provider ciphertext as compromised;
2. rotate provider credentials;
3. introduce a versioned key-rotation migration/process before changing the application key;
4. investigate server/environment compromise.

If `SUPABASE_SERVICE_ROLE_KEY` leaks:

1. rotate it immediately in Supabase;
2. audit database access;
3. rotate other server secrets if environment compromise is possible.

## Reporting vulnerabilities

Follow the repository root [SECURITY.md](../SECURITY.md). Do not place real tokens, API keys, personal data, or exploit secrets in public issues.
