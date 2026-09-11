# Architecture

MCP Gateway is a modular monolith. The project deliberately avoids microservices, CQRS, repository interfaces for every table, or a separate cache layer while the domain is still small.

## System context

```text
┌────────────────────┐
│ Browser / Web App  │
└─────────┬──────────┘
          │ Supabase JWT
          ▼
┌────────────────────┐
│ NestJS Dashboard   │
│ API                │
└─────────┬──────────┘
          │ service role
          ▼
┌────────────────────┐
│ Supabase/Postgres  │
└────────────────────┘

┌────────────────────┐
│ Custom GPT         │
└─────────┬──────────┘
          │ Gateway bearer token
          ▼
┌────────────────────┐
│ GPT Gateway API    │
│ GatewayAccessGuard │
└─────────┬──────────┘
          │ token -> Open ID -> user
          ▼
┌────────────────────┐
│ McpGatewayService  │
└─────────┬──────────┘
          │ provider credential
          ▼
┌────────────────────┐
│ Provider adapter   │
│ StitchMcpAdapter   │
└─────────┬──────────┘
          │ MCP JSON-RPC
          ▼
┌────────────────────┐
│ Google Stitch MCP  │
└────────────────────┘
```

## Trust boundaries

### Browser boundary

The browser may hold:

- Supabase anon key;
- Supabase user session/access token;
- public Gateway API URL.

The browser must never receive:

- Supabase service-role key;
- `MCP_CREDENTIAL_ENCRYPTION_KEY`;
- saved provider API keys after persistence;
- token hashes.

### Dashboard API boundary

Dashboard endpoints authenticate a real application user with a Supabase Bearer token. `AuthService.requireUser()` verifies that token with Supabase Auth and then loads the application profile through the service-role client.

### GPT execution boundary

GPT endpoints do **not** use the user's Supabase session. `GatewayAccessGuard` authenticates the Gateway Bearer token and resolves a `GatewayPrincipal`.

The principal contains:

- credential ID;
- Open ID database ID;
- Open ID string;
- account;
- entitlement kind (`trial` or `paid`).

### Provider boundary

Provider adapters receive the decrypted provider credential only inside the trusted server process. A provider adapter owns:

- provider endpoint;
- provider authentication mechanism;
- MCP transport details;
- provider-specific error mapping.

## Backend modules

```text
server/src/modules/
├── audit/
├── auth/
├── gpt-integration/
├── health/
├── mcp-connections/
├── mcp-gateway/
│   └── providers/
│       └── stitch/
└── open-id/
```

Responsibilities:

- `auth`: Supabase user authentication and app profile loading.
- `mcp-connections`: provider credential test/save/delete/decrypt boundary.
- `open-id`: trial, paid Open ID, Gateway token lifecycle.
- `gpt-integration`: generated Instructions/Knowledge/OpenAPI/ZIP.
- `mcp-gateway`: GPT runtime API, entitlement enforcement, provider routing.
- `audit`: sanitized operational audit events.
- `health`: liveness endpoint.

Controllers remain thin; database/provider orchestration stays in services.

## Frontend structure

The web app uses TanStack Start/React and TanStack React Query.

Server-owned state such as account, MCP connections, trial state, Open ID, and tokens belongs to query/API layers rather than a duplicated global client store.

The public site and authenticated application share the same project, with Vietnamese/English UI support.

## Database model

Core tables:

```text
app_users
trial_entitlements
open_ids
gateway_credentials
mcp_connections
gateway_audit_events
```

Important invariants:

- one `trial_entitlements` row per account lifetime;
- trial expires exactly seven days after claim;
- one trial Open ID per account;
- one paid Open ID per account in the MVP;
- Gateway credential belongs to the same user as its Open ID;
- Gateway token hash is unique;
- provider connection is unique per `(user_id, provider)`.

The `claim_gateway_trial(...)` PostgreSQL function performs the trial entitlement, internal Open ID, and trial Gateway credential creation atomically.

## Open ID model

An Open ID is an **entitlement object**, not an authentication protocol.

### Trial Open ID

- created by the atomic trial RPC;
- non-exportable;
- expires with the seven-day trial;
- one per account lifetime.

### Paid Open ID

- only available to `member`;
- exportable;
- one per account in the current MVP;
- may have multiple Gateway credentials/tokens.

## Gateway token model

The raw token is generated from cryptographically random bytes and shown only once.

Stored data includes:

- SHA-256 token hash;
- display prefix;
- owner/Open ID relation;
- optional expiry;
- revoked timestamp;
- last-used timestamp.

SHA-256 is appropriate here because the input is a high-entropy generated secret, not a human password.

## MCP request flow

### Discover tools

```text
GET /api/v1/gpt/mcp/:service/tools
  -> GatewayAccessGuard
  -> GatewayCredentialService.authenticate()
  -> McpProviderRegistry.get(service)
  -> McpConnectionsService.getProviderApiKey(user)
  -> adapter.listTools(apiKey)
  -> upstream tools/list
  -> sanitized audit event
  -> GPT
```

### Call a tool

```text
POST /api/v1/gpt/mcp/:service/tools/:toolName/call
  -> same auth / entitlement path
  -> adapter.callTool(apiKey, toolName, arguments)
  -> upstream tools/call
  -> sanitized audit event
  -> GPT
```

## Why provider URLs are not user-configurable

The MVP uses an explicit provider registry. This reduces:

- SSRF risk;
- credential exfiltration to arbitrary hosts;
- unsupported transports/auth schemes;
- unbounded support surface.

If arbitrary MCP endpoints are added later, they require a separate threat model and network egress policy.

## Adding scale only when needed

Current design intentionally has no Redis or background queue. Before adding either, measure:

- upstream request latency;
- tool catalog churn;
- rate-limit pressure;
- database contention.

A short-lived tool catalog cache may be reasonable later, but runtime discovery is currently simple enough to call upstream directly.
