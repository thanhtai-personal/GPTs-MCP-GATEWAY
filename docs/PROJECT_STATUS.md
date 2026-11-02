# Project Status

This file separates implemented behavior from product intent so public documentation does not overstate the current product.

## Product focus

GPTs-MCP-Gateway is currently a **gateway-first product**. Its primary job is to let AI clients safely use connected external services through one controlled execution boundary.

The target audience is broader than developers. The product should work for ordinary users who want outcomes such as reading or updating documents, working with design tools, managing connected services, or completing other provider-backed tasks without understanding MCP internals.

Developer-oriented workflows remain valid use cases, but they are not the product boundary and should not dominate the roadmap.

## Implemented in source

### Identity / account

- Supabase Auth integration.
- `app_users` profile created from `auth.users`.
- `system_role`: `user | admin`.
- `membership_tier`: `guest | member`.
- account status check.

### Trial

- Guest-only.
- exactly one claim per account lifetime.
- starts on explicit trial creation.
- seven-day expiry.
- internal non-exportable trial Open ID.
- raw trial Gateway token shown once.
- atomic database RPC.

### Member / Open ID

- one active paid Open ID per account in current MVP.
- paid Open ID requires Member.
- multiple Gateway credentials per paid Open ID.
- optional token expiry.
- token revocation.
- last-used timestamp.

### MCP connections

- explicit provider registry.
- provider adapters currently registered for `stitch`, `lovable`, `figma`, `github`, `google-drive`, `google-docs`, `google-sheets`, and `notion` (`google-drive` is a native Drive REST adapter sharing the Google Workspace connection).
- connection test before save where supported by the provider flow.
- encrypted provider credential storage.
- no saved provider credential returned to the client after persistence.
- provider OAuth support exists for supported OAuth-backed connection flows.

### MCP server

- remote MCP endpoint `/api/v1/mcp` (Streamable HTTP, stateless JSON) with Supabase OAuth 2.1 authentication, consent page and Open ID enforcement; see [MCP server setup](./MCP_SERVER_SETUP.md).

### GPT runtime

- Gateway bearer authentication.
- Open ID entitlement enforcement.
- service discovery.
- runtime tool discovery.
- runtime tool schema inspection.
- runtime tool execution.
- chunked response continuation for oversized serialized results.
- provider-specific Gateway Skill discovery and retrieval.
- sanitized audit events.

### GPT Integration Kit

- English/Vietnamese Instructions.
- Knowledge.
- OpenAPI 3.1 schema.
- Setup Guide.
- ZIP generation.

### Web

- public marketing landing page.
- Vietnamese/English UI.
- auth panel.
- dashboard.
- MCP connection management.
- trial/Open ID/token management.
- GPT kit download.

## Current product priorities

The near-term roadmap should deepen the Gateway before expanding into a developer runtime. Priority areas are:

1. reliable provider connection and runtime discovery;
2. user-friendly provider onboarding for non-technical users;
3. deterministic provider contract tests and end-to-end validation;
4. timeout and cancellation propagation;
5. idempotency for mutating tool calls where retries can duplicate side effects;
6. per-provider or per-tool authorization/policy controls;
7. rate limits, quotas, usage visibility, and operational observability;
8. compact capability discovery so users and models do not need to reason about every raw provider tool;
9. native MCP transport and OAuth/PKCE for additional MCP-native AI clients when product demand justifies it.

The Gateway should continue to hide MCP complexity from ordinary users. A user should primarily think in terms of connected services and desired outcomes, not tool names, schemas, transports, credentials, or provider-specific APIs.

## Deliberately not a current focus

The project is not currently trying to become a local coding environment or general-purpose developer runtime. The following remain outside the near-term Gateway focus unless a concrete product requirement appears:

- local filesystem execution;
- local shell/process orchestration;
- language-server integration;
- browser/computer-use runtime;
- device/workspace routing;
- project memory or codebase intelligence as a core platform feature;
- OS-level sandboxing;
- a dedicated native coding agent.

## CodeLocal as a future expansion reference

[`codelocal-cloud/codelocal`](https://github.com/codelocal-cloud/codelocal) is useful as an architectural reference for a possible future expansion, especially for native MCP exposure, OAuth-based client authorization, compact public tool surfaces, local execution boundaries, idempotency, cancellation, and operational hardening.

It should **not** be treated as the current target architecture. CodeLocal solves a broader developer-runtime problem, while GPTs-MCP-Gateway currently optimizes for a hosted, provider-oriented gateway that can serve both ordinary users and developers.

A future expansion may selectively adopt ideas such as:

```text
AI clients
  ├─ GPT Actions / OpenAPI
  └─ native MCP / OAuth
           │
           ▼
      MCP Gateway
           │
   connected providers
```

Only after the Gateway is mature should the project evaluate optional local/device execution as a separate product layer. That expansion must not require ordinary users to understand developer concepts or install a local runtime for normal SaaS/provider workflows.

## Still not implemented or not yet mature

- payment checkout/provider and subscription automation;
- organization/team accounts;
- multiple paid Open IDs per account;
- arbitrary user-provided MCP URLs;
- encryption key rotation workflow;
- usage-based billing;
- mature per-tool permission scopes and business quotas;
- background jobs for durable long-running workflows;
- Redis/cache where measured load justifies it;
- complete runtime validation and policy coverage for every dynamic provider schema;
- native MCP endpoint for non-Action clients as a first-class public surface;
- production-grade idempotency/cancellation guarantees across all providers.

## Validation status

Validation must be reported from actual CI/runtime evidence, not from this document. Do not infer that a provider integration or deployment is healthy merely because its adapter exists in source.

A public release should only mark dependency installation, builds, migrations, provider smoke tests, and security checks as passed after they are actually executed in the relevant environment.

## Release maturity

Current recommendation:

```text
experimental / early product
```

Suggested maturity path:

```text
Gateway foundation
  -> deterministic CI + provider contract tests
  -> live Supabase/provider smoke tests
  -> security and policy hardening
  -> user-friendly connection/onboarding flows

Gateway product
  -> idempotency + cancellation + quotas
  -> richer provider/capability catalog
  -> stronger observability and billing/admin automation
  -> native MCP/OAuth client support when justified

Optional expansion
  -> evaluate local/device execution separately
  -> borrow selected CodeLocal-style runtime patterns only if real user demand requires them
```
