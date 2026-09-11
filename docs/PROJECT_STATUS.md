# Project Status

This file separates implemented behavior from product intent so public documentation does not overstate the current MVP.

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
- current provider: `stitch`.
- connection test before save.
- AES-256-GCM encrypted credential storage.
- no credential returned in connection list.

### GPT runtime

- Gateway bearer authentication.
- Open ID entitlement enforcement.
- service discovery.
- runtime tool discovery.
- runtime tool execution.
- audit events.

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

## Deliberately not implemented yet

- payment checkout/provider;
- subscription renewals/webhooks;
- admin management UI;
- organization/team accounts;
- multiple paid Open IDs per account;
- arbitrary MCP URLs;
- provider OAuth;
- generic multi-field credential storage;
- encryption key rotation workflow;
- usage-based billing;
- per-tool permission scopes;
- per-provider/tool business quotas;
- background jobs;
- Redis/cache;
- full runtime JSON Schema validation of dynamic MCP tool arguments.

## Validation gaps in the current artifact

See `VALIDATION.md`.

The current artifact environment did not complete:

- clean dependency installation;
- dependency-backed full Nest/Vite build/typecheck;
- live migration application;
- live Stitch end-to-end smoke test.

A public release should not mark these as passed until actually executed.

## Release maturity

Current recommendation:

```text
experimental / early MVP
```

Suggested maturity path:

```text
0.1.x
  -> deterministic install + CI
  -> live Supabase/Stitch smoke test
  -> security review
  -> license selected
  -> public alpha

0.2.x
  -> second MCP provider
  -> prove adapter abstraction
  -> billing/admin entitlement automation

later
  -> OAuth providers
  -> team/workspace model
  -> scoped credentials / richer policy
```
