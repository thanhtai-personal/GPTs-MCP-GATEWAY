# Contributing

Thanks for considering a contribution to MCP Gateway.

The project prioritizes correctness, clear boundaries, maintainability, and incremental changes over architecture ceremony.

## Before opening a PR

For bugs or features:

1. search existing issues;
2. describe the observed/current behavior;
3. describe the intended behavior;
4. keep the change focused;
5. avoid unrelated refactors.

For security vulnerabilities, do **not** open a public exploit report. Follow [SECURITY.md](./SECURITY.md).


## License of contributions

The project is licensed under AGPL-3.0-or-later.

By submitting a contribution, you agree that the contribution may be distributed under the same project license. Only submit code, documentation, media, or generated output that you have the right to contribute under compatible terms.

Read [OPEN_SOURCE_POLICY.md](./OPEN_SOURCE_POLICY.md) before submitting a substantial change.

## Development setup

Read:

1. [README.md](./README.md)
2. [docs/SELF_HOSTING.md](./docs/SELF_HOSTING.md)
3. [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

Use Node.js 24 (`.nvmrc`).

Configure development `.env` files from the provided examples. Never commit real secrets.

## Architecture expectations

### Backend

Keep NestJS module-first organization.

Controllers should:

- receive/validate request data;
- call services;
- return HTTP responses.

Controllers should not query Supabase or implement MCP/business logic directly.

Small features may use the shared Supabase service directly from a domain service. Do not introduce repository interfaces/CQRS layers without a real complexity need.

### Frontend

Use React Query for server-owned state.

Do not duplicate account/MCP/Open ID server state into a second global client cache without a concrete reason.

Keep presentation focused on render/composition/events and move complex orchestration into appropriate hooks/services.

### Provider adapters

Provider-specific endpoint/auth/transport/error mapping belongs in its adapter.

Account entitlement and Open ID logic must stay provider-independent.

Read [Adding an MCP Provider](./docs/ADDING_MCP_PROVIDER.md).

### Database

Migration history is append-only after a migration may have been applied.

Do not edit/delete/rename an already-released migration to change schema behavior. Add a forward migration.

Destructive changes need explicit migration/backfill/rollout reasoning.

## Code style

- strict TypeScript;
- avoid `any` and cast chains that hide schema mismatch;
- use project aliases instead of deep `../../` imports;
- simple/explicit code over clever abstractions;
- do not create layers/interfaces solely to match a pattern;
- keep secrets out of logs/errors;
- keep source files reasonably focused.

The repository's source checker enforces a small subset of these conventions.

## Validation

Dependency-free:

```bash
npm run check
```

After dependencies are installed:

```bash
npm run typecheck:web
npm run build:web
npm run build:server
npm run test:server
```

Run the smallest relevant test during development, then the appropriate project checks before opening a PR.

If a command cannot be run in your environment, say so in the PR. Do not report it as passed.

## Testing priorities

Prioritize tests for:

- entitlement/trial invariants;
- token authentication/revocation/expiry;
- cross-user isolation;
- provider credential handling;
- adapter error mapping;
- GPT OpenAPI/package generation;
- regressions.

Snapshot tests for trivial UI are lower priority.

## Pull request expectations

A good PR explains:

- goal/root cause;
- files or modules changed;
- public contract/schema changes;
- database migration impact;
- security impact;
- validation commands actually run and results;
- remaining limitations.

If API behavior or configuration changes, update docs in the same PR.

## Commit/patch hygiene

- no production `.env`;
- no raw credentials;
- no generated build output;
- no unrelated formatting churn;
- no rewrites of migration history after release.

## Dependency and audit changes

Do not use `npm audit fix --force` as a routine fix or include its uncontrolled dependency rewrites in a PR.

NestJS framework packages must remain on the reviewed Nest 11 line until a dedicated major-upgrade PR changes that policy.

For dependency vulnerabilities, follow [Dependency Security](./docs/DEPENDENCY_SECURITY.md), perform a clean install, inspect peers, then run audit/build/typecheck/tests.

## Adding dependencies

Prefer existing platform/runtime capabilities first.

Explain why a new significant dependency is needed, especially for:

- auth/security;
- cryptography;
- MCP transport;
- database abstractions;
- state management.

## Community behavior

Participation is subject to [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
