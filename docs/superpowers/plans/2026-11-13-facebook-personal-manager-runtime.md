# Facebook Personal AI Manager — Runtime Foundation Plan

> **For agentic workers:** Execute this plan task-by-task with TDD. The user explicitly requested inline implementation in this session.

**Goal:** Add a secure official Meta OAuth connection and a native Facebook MCP adapter that exposes verified identity and authorized Page discovery as the first runtime slice.

**Architecture:** Reuse Gateway OAuth transaction, encrypted credential, connection, audit, and provider-registry infrastructure. Add a dedicated Meta OAuth flow because Facebook Login for Business is not the generic remote-MCP OAuth discovery flow. Register a native Graph API adapter; expose only task-oriented identity and Page-discovery tools.

**Tech Stack:** NestJS 11, TypeScript, Supabase-backed connection storage, existing React/React Query connection UI, Jest.

**Spec:** `docs/FACEBOOK_PERSONAL_PROFILE_MVP.md` (on the docs branch/PR #65) and confirmed user policy in the conversation.

## Global Constraints
- Never request/store Facebook password, cookies, session data, or 2FA codes.
- Encrypt Meta access tokens server-side using existing `McpCredentialCodec` and `SecretCipherService`.
- OAuth state must be encrypted, user-bound, single-use, time-limited, and browser-nonce-bound.
- Personal-profile publishing is user-mediated only; do not implement background profile publishing.
- Do not expose Page access tokens in MCP outputs or frontend.
- Page write tools are not part of this first slice; do not expose unapproved direct publishing.
- Use Graph API version from configuration; default to `v27.0` only as a configurable baseline.
- No new dependency unless required by source evidence.

## Review Focus
- OAuth callback replay, cross-user state substitution, browser nonce mismatch, and expired state.
- Meta token response missing/invalid access token or malformed JSON.
- Graph API permission denial / invalid token must not leak token or raw upstream response.
- Page discovery must never return access_token fields.
- Disconnect and reconnect must retain existing owner isolation and provider grouping behavior.

---

### Task 1: Meta OAuth and identity connection

**Files:**
- Modify: `server/src/common/config/app-config.service.ts`
- Modify: `server/.env.example`
- Create: `server/src/modules/mcp-connections/facebook-oauth.service.ts`
- Create: `server/src/modules/mcp-connections/facebook-oauth.service.spec.ts`
- Modify: `server/src/modules/mcp-connections/mcp-connections.service.ts`
- Modify: `server/src/modules/mcp-connections/mcp-connections.controller.ts`
- Modify: `server/src/modules/mcp-connections/mcp-connections.module.ts`

**Interfaces:**
- `FacebookOAuthService.start(request: Request)` returns `{ provider, authorizationUrl, browserNonce }`.
- `FacebookOAuthService.complete(code, state, browserNonce, authenticatedUserId)` consumes one OAuth transaction, exchanges code, verifies `/me`, then stores the OAuth credential via `McpConnectionsService.connectFacebookCredential`.
- Callback path: `/api/v1/mcp-connections/facebook/oauth/callback`.
- Frontend completion uses existing `POST /api/v1/mcp-connections/facebook/oauth/complete`.

- [ ] Write tests for OAuth URL, state ownership/expiry, nonce consumption, token exchange validation, and token secrecy.
- [ ] Run focused test and observe expected failure.
- [ ] Implement the smallest service/controller/config changes.
- [ ] Run focused test and full server test/typecheck.

### Task 2: Native Facebook MCP adapter and Page discovery

**Files:**
- Create: `server/src/modules/mcp-gateway/providers/facebook/facebook-graph-api.client.ts`
- Create: `server/src/modules/mcp-gateway/providers/facebook/facebook-mcp.adapter.ts`
- Create: `server/src/modules/mcp-gateway/providers/facebook/facebook-mcp.tools.ts`
- Create: `server/src/modules/mcp-gateway/providers/facebook/facebook-mcp.adapter.spec.ts`
- Modify: `server/src/modules/mcp-connections/mcp-connections.module.ts`

**Interfaces:**
- Provider ID: `facebook`.
- Tools: `facebook_get_identity`, `facebook_list_pages`.
- `facebook_list_pages` returns Page IDs, names, categories, and task names only; never returns Page access tokens.
- Adapter rejects non-OAuth credentials and maps upstream errors to sanitized Gateway exceptions.

- [ ] Write failing adapter tests for identity, Page list token-field omission, invalid credentials, and API errors.
- [ ] Run focused tests and observe expected failures.
- [ ] Implement Graph client, adapter, tools, and registration.
- [ ] Run focused tests and full server test/typecheck.

### Task 3: Web connection UX

**Files:**
- Modify: `web/src/modules/mcp-connections/api/mcp-connections.api.ts`
- Modify: `web/src/modules/mcp-connections/presentation/OAuthConnectionForm.tsx`

**Interfaces:**
- Add `startFacebookOAuth(accessToken)`, returning the existing `McpOAuthStart` contract.
- Special-case provider ID `facebook` to call the dedicated start endpoint and use existing `redirectToOAuth`.
- Existing generic OAuth completion page continues to post to `/:provider/oauth/complete`.

- [ ] Add/adjust a focused test if the web test setup supports component/API tests; otherwise verify typecheck/build and document the gap.
- [ ] Run web typecheck/build.

### Task 4: Integration review

- [ ] Review diff for token leakage, callback security, permission assumptions, and scope creep.
- [ ] Run server tests/typecheck and web build/typecheck.
- [ ] Create a draft PR with clear blockers: Meta App ID, App Secret, Login Configuration ID, HTTPS callback, and App Review/permissions.
