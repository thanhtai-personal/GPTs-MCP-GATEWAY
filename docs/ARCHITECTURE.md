# Architecture

MCP Gateway is a modular monolith. The project deliberately avoids microservices, CQRS, repository interfaces for every table, or a separate cache layer while the domain is still small.

## Architecture principle

The current architecture is **gateway-first**. The system is designed to connect AI clients to external services through one trusted execution boundary while hiding provider credentials and most MCP complexity from end users.

The product is intentionally not limited to developers. Developer workflows are one category of use case alongside document, design, productivity, collaboration, and other provider-backed workflows.

The Gateway should therefore optimize for:

- safe provider access;
- simple account and connection onboarding;
- runtime capability discovery;
- stable authorization and entitlement;
- clear user-facing outcomes rather than raw tool mechanics;
- support for additional AI client surfaces without forcing a local developer runtime.

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
│ AI client          │
│ Custom GPT today   │
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
│ Provider registry  │
│ + provider adapter │
└─────────┬──────────┘
          │ provider-specific MCP/API transport
          ▼
┌────────────────────────────────────────────┐
│ Stitch / Lovable / Figma / GitHub /        │
│ Google Docs / Google Sheets / Notion / ... │
└────────────────────────────────────────────┘
```

The client-facing transport may expand later. The trusted boundary should remain the Gateway.

## Trust boundaries

### Browser boundary

The browser may hold:

- Supabase anon key;
- Supabase user session/access token;
- public Gateway API URL.

The browser must never receive:

- Supabase service-role key;
- provider credential encryption keys;
- saved provider credentials after persistence;
- Gateway token hashes.

### Dashboard API boundary

Dashboard endpoints authenticate a real application user with a Supabase Bearer token. The server verifies that token with Supabase Auth and loads the application profile through the trusted backend boundary.

### GPT execution boundary

GPT endpoints do **not** use the user's Supabase session. `GatewayAccessGuard` authenticates the Gateway Bearer token and resolves a `GatewayPrincipal`.

The principal represents the credential, Open ID, account, and entitlement used to authorize execution.

### Provider boundary

Provider adapters receive decrypted provider credentials only inside the trusted server process. A provider adapter owns provider-specific concerns such as:

- endpoint selection;
- authentication mechanism;
- MCP/API transport details;
- provider-specific error mapping;
- connection testing or OAuth-backed connection behavior where applicable.

## Backend modules

The current source contains modules for responsibilities including:

```text
server/src/modules/
├── audit/
├── auth/
├── gpt-integration/
├── health/
├── mcp-connections/
├── mcp-gateway/
│   └── providers/
├── open-id/
└── ...
```

The provider registry currently includes adapters for (`google-drive` calls the Drive REST API directly; the others proxy remote MCP servers):

```text
stitch
lovable
figma
github
google-drive
google-docs
google-sheets
notion
```

Responsibilities remain separated by domain:

- `auth`: Supabase user authentication and app profile loading.
- `mcp-connections`: provider connection lifecycle and trusted credential access.
- `open-id`: trial, paid Open ID, and Gateway token lifecycle.
- `gpt-integration`: generated GPT integration assets.
- `mcp-gateway`: runtime service/tool discovery, schema lookup, entitlement enforcement, and provider execution.
- `audit`: sanitized operational audit events.
- `health`: liveness and related health endpoints.

Controllers should remain thin; database/provider orchestration belongs in services.

## User-facing abstraction

Ordinary users should not need to understand `tools/list`, JSON Schema, MCP transports, or provider credential formats. Those are implementation details.

The intended user model is closer to:

```text
Connect service
  -> ask for an outcome
  -> Gateway discovers available capability
  -> AI client selects and calls the required operation
  -> Gateway enforces authorization and provider boundaries
  -> result is returned to the user
```

Technical discovery endpoints remain essential internally because runtime provider truth is more reliable than stale static descriptions. Product UX should translate that runtime model into connected services and understandable capabilities.

## Gateway Skill and tool discovery model

Gateway Skills provide workflow guidance. Runtime provider discovery remains authoritative for actual service/tool names and schemas.

Conceptually:

```text
user goal
  -> relevant Gateway Skill when useful
  -> service discovery
  -> tool discovery
  -> selected tool schema
  -> authorized execution
  -> complete or chunked result
```

This approach lets the Gateway support many providers without hardcoding every upstream tool into one client contract.

A future capability catalog may sit above raw tool discovery to make the model and UI more concise, but it should not replace runtime schema authority.

## Database model

Core concepts include:

```text
app_users
trial_entitlements
open_ids
gateway_credentials
mcp_connections
gateway_audit_events
```

Important invariants include:

- one trial entitlement per account lifetime;
- trial expiry governed by the entitlement lifecycle;
- Gateway credentials belong to the same account/Open ID relationship they authorize;
- raw Gateway tokens are not persisted;
- provider connections are scoped to their owner and provider.

Current migrations and source are authoritative for exact constraints.

## Open ID model

An Open ID is an **entitlement object**, not an authentication protocol.

A Gateway token authenticates a client request; its linked Open ID determines entitlement to Gateway execution.

This separation is intentional so authentication credentials can be rotated or revoked without redefining the entitlement model.

## MCP request flow

### Discover tools

```text
client
  -> Gateway authentication
  -> Open ID entitlement
  -> provider registry
  -> owner connection lookup
  -> adapter runtime discovery
  -> sanitized audit event
  -> client
```

### Call a tool

```text
client
  -> same authentication / entitlement path
  -> runtime-selected provider adapter
  -> tool execution using server-held provider credential
  -> complete or chunked response handling
  -> sanitized audit event
  -> client
```

## Why provider URLs are not user-configurable

The current product uses an explicit provider registry. This reduces:

- SSRF risk;
- credential exfiltration to arbitrary hosts;
- unsupported transports/auth schemes;
- unbounded support surface.

If arbitrary MCP endpoints are added later, they require a separate threat model and network egress policy.

## Near-term architecture direction

The preferred evolution is to strengthen the hosted Gateway before adding broader runtime infrastructure. Likely additions include:

- provider contract and smoke-test coverage;
- timeout/cancellation propagation;
- idempotency for mutating operations;
- per-provider/per-tool policy;
- quotas and usage accounting;
- richer capability discovery;
- stronger operational observability;
- native MCP transport plus OAuth/PKCE for additional AI clients when justified.

The existing modular-monolith architecture remains appropriate for these changes. Add queues, Redis, or additional services only when measured requirements justify them.

## CodeLocal as an expansion reference

[`codelocal-cloud/codelocal`](https://github.com/codelocal-cloud/codelocal) demonstrates a broader architecture in which cloud identity/routing is combined with a native local runtime for filesystem, Git, terminal/process, browser/computer, workspace, and project-intelligence capabilities.

That model is useful as a **future reference**, not as the current target.

The architectural boundary should remain explicit:

```text
Current product
AI client
  -> hosted Gateway
  -> remote providers

Possible future expansion
AI client
  -> hosted Gateway
  -> remote providers
  -> optional local/device runtime
```

If a local runtime is ever introduced, it should be optional and separately threat-modeled. Normal document, design, productivity, and SaaS workflows must remain usable without developer tooling or a local agent installation.

Selected CodeLocal-style ideas that can be evaluated independently of a local runtime include:

- native MCP client support;
- OAuth-based client authorization;
- compact capability/tool surfaces;
- idempotency and retry safety;
- cancellation propagation;
- stronger runtime observability.

Do not copy broader coding-runtime architecture unless concrete product demand requires it.
