# MCP Gateway

[Tiếng Việt](./README.vi.md)

> **Status: experimental MVP.** The project is usable as a development baseline, but the current artifact has not completed a dependency-backed production build, live Supabase migration smoke test, or live Stitch end-to-end test. See [VALIDATION.md](./VALIDATION.md).

MCP Gateway is a self-hostable gateway that lets **Custom GPTs discover and call supported MCP services through GPT Actions** while keeping provider credentials on the server.

The first provider adapter is **Google Stitch**.

The product model separates authentication from entitlement:

- **Gateway token** authenticates a GPT Action request.
- **Open ID** authorizes MCP execution.
- **Provider credential** (for example a Stitch API key) stays encrypted on the Gateway server and is never copied into the GPT.
- **GPT Integration Kit** teaches the GPT how to discover services/tools and call the Gateway without hardcoding a provider's tool catalog.

> **Naming note:** “Open ID” is this project's entitlement identifier. It is **not OpenID Connect (OIDC)**.

## Why this exists

Coding agents can discover tools and invoke them through MCP. Custom GPT Actions use HTTP/OpenAPI rather than an arbitrary MCP transport. MCP Gateway bridges those models:

```text
User request
   │
   ▼
Custom GPT
   │  OpenAPI Action + Gateway Bearer token
   ▼
MCP Gateway
   │  token -> Open ID -> entitlement
   │  user -> encrypted MCP credential
   │  runtime tools/list / tools/call
   ▼
Supported MCP provider
   └── Google Stitch (MVP)
```

The GPT never receives the user's Stitch API key.

## What is implemented

| Area | Current status |
| --- | --- |
| Public landing page | Implemented |
| Vietnamese / English UI | Implemented |
| Supabase email/password auth | Implemented |
| Guest account tier | Implemented |
| One lifetime 7-day Guest trial | Implemented |
| Trial starts when the user explicitly creates the trial token | Implemented |
| Trial Open ID | Internal, non-exportable |
| Member Open ID | One active paid/exportable Open ID per account in MVP |
| Member Gateway tokens | Multiple tokens, revocable |
| MCP credential encryption | AES-256-GCM server-side |
| Gateway token storage | SHA-256 hash only; raw token shown once |
| GPT Integration Kit | Instructions + Knowledge + OpenAPI + Setup Guide ZIP |
| MCP tool discovery | Runtime `tools/list` |
| MCP tool execution | Runtime `tools/call` |
| Google Stitch | Implemented adapter |
| Arbitrary MCP URLs | Intentionally not supported |
| Payment / checkout | Not implemented |
| Admin UI | Not implemented |
| Provider OAuth | Not implemented |

For a precise implemented-vs-planned list, read [Project Status](./docs/PROJECT_STATUS.md).

## Repository layout

```text
.
├── database/
│   └── migrations/          # Supabase/PostgreSQL schema
├── docs/                    # architecture, protocol, security, operations
├── scripts/                 # dependency-free source/schema checks
├── server/                  # NestJS Gateway API
└── web/                     # TanStack Start / React application
```

Architecture follows pragmatic module boundaries: NestJS modules on the backend, React Query for server state on the frontend, explicit DTO/boundary types, and append-only migrations.

## Quick start

### Requirements

- Node.js **24** (`.nvmrc`)
- npm
- a Supabase project
- a Google Stitch API key if you want to exercise the current MCP provider

### 1. Configure Supabase

Apply:

```text
database/migrations/001_initial_schema.sql
database/migrations/002_gpt_response_transfers.sql
database/migrations/003_site_settings.sql
database/migrations/004_mcp_oauth_transactions.sql
```

to a **development** Supabase project.

The migration creates the application profile trigger, trial/Open ID/token tables, MCP connection storage, audit storage, RLS/revokes, and the atomic one-time trial RPC.

### 2. Configure the server

```bash
cp server/.env.example server/.env
openssl rand -base64 32
```

Put the generated value in `MCP_CREDENTIAL_ENCRYPTION_KEY` and fill the Supabase values.

Never expose either of these to the browser:

```text
SUPABASE_SERVICE_ROLE_KEY
MCP_CREDENTIAL_ENCRYPTION_KEY
```

### 3. Configure the web app

```bash
cp web/.env.example web/.env
```

Fill the public Supabase URL/anon key and Gateway API URL.

### 4. Install and run

```bash
npm --prefix server install
npm --prefix web install

npm run dev:server
npm run dev:web
```

Development defaults:

- Web: `http://127.0.0.1:5656`
- API: `http://127.0.0.1:5657/api/v1`
- Swagger UI: `http://127.0.0.1:5657/docs`

See [Self-hosting](./docs/SELF_HOSTING.md) for production topology, reverse proxy requirements, environment variables, membership testing, and deployment notes.

## GPT integration flow

An authenticated user can connect Stitch and download the GPT Integration Kit before purchasing a paid Open ID.

The generated ZIP contains:

```text
instructions.md
GPTS-MCP-GATEWAY-Knowledge.md
openapi.yaml
setup-guide.md
```

The instruction protocol teaches the GPT to use:

```text
Intent
  -> Capability
  -> MCP service
  -> listMcpTools(service)
  -> select tool from current schema
  -> callMcpTool(service, toolName, arguments)
  -> interpret result
```

The static Knowledge file is not the authority for provider tool names. Runtime discovery is.

Read [GPT Gateway Protocol](./docs/GPT_PROTOCOL.md) for the behavioral contract.

## Authentication boundaries

MCP Gateway has **two different Bearer token contexts**:

1. **Dashboard API** — Supabase user access token.
2. **GPT API** — Gateway token created by the trial/member flow.

Do not interchange them.

The GPT execution path is:

```text
Gateway token
  -> hashed credential lookup
  -> active Open ID
  -> active account / membership rule
  -> user's connected provider credential
  -> provider adapter
```

See [API Reference](./docs/API_REFERENCE.md).

## Open ID and trial rules

### Guest

A Guest can:

- sign up and sign in;
- configure supported MCP credentials;
- download the GPT Integration Kit;
- explicitly start **one** trial in the lifetime of the account.

The 7-day clock starts only when the user creates the trial token. The trial creates an internal, non-exportable Open ID. Revoking, losing, or allowing that token to expire does not restore trial eligibility.

### Member

A Member can have one active paid/exportable Open ID in the current MVP and can create multiple Gateway tokens for that Open ID.

Payment is deliberately outside the current source. For development, membership can be promoted through a trusted database/admin workflow. Never allow the browser to update membership directly.

## Security highlights

- Provider credentials are encrypted with AES-256-GCM before database storage.
- The encryption key is server-only.
- Gateway tokens are generated with high entropy; only SHA-256 hashes and display prefixes are stored.
- Raw Gateway tokens are returned once on creation.
- Supabase service-role credentials stay server-only.
- MCP providers are selected from an explicit registry; arbitrary upstream URLs are not accepted.
- Gateway/Open ID/MCP secret tables are not directly available to `anon` or `authenticated` database roles.
- Tool output and provider content must still be treated as untrusted input.

Read [SECURITY.md](./SECURITY.md) and the [Security Model](./docs/SECURITY_MODEL.md) before deploying publicly.

## Add another MCP provider

Provider support intentionally has a small surface:

1. provider ID/type;
2. adapter implementing `testConnection`, `listTools`, and `callTool`;
3. registry registration;
4. UI/provider metadata;
5. tests and docs.

Read [Adding an MCP Provider](./docs/ADDING_MCP_PROVIDER.md).

## Validation

Dependency-free checks:

```bash
npm run check
```

Intended full validation after dependencies are installed:

```bash
npm run typecheck:web
npm run build:web
npm run build:server
npm run test:server
```

The exact checks already run for this artifact are recorded in [VALIDATION.md](./VALIDATION.md). Do not convert unexecuted checks into claimed passes when contributing.

## Documentation

Start with [docs/README.md](./docs/README.md).

Key documents:

- [Architecture](./docs/ARCHITECTURE.md)
- [GPT Gateway Protocol](./docs/GPT_PROTOCOL.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Self-hosting](./docs/SELF_HOSTING.md)
- [Security Model](./docs/SECURITY_MODEL.md)
- [Data Handling](./docs/DATA_HANDLING.md)
- [Adding an MCP Provider](./docs/ADDING_MCP_PROVIDER.md)
- [Project Status](./docs/PROJECT_STATUS.md)
- [FAQ](./docs/FAQ.md)
- [Open-source Release Checklist](./docs/OPEN_SOURCE_RELEASE.md)
- [Licensing](./docs/LICENSING.md)
- [Dependency Security](./docs/DEPENDENCY_SECURITY.md)

Community files:

- [Contributing](./CONTRIBUTING.md)
- [Security policy](./SECURITY.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Support](./SUPPORT.md)
- [Changelog](./CHANGELOG.md)

## Open-source license and hosted commercial service

MCP Gateway is licensed under **AGPL-3.0-or-later**. See [LICENSE](./LICENSE).

The official hosted Gateway/Open ID service may still be commercial. The software license and a hosted Open ID are separate:

- AGPL grants rights to use/modify/self-host the software under its terms;
- an official hosted Open ID grants entitlement on that specific hosted deployment.

Commercial use of AGPL code is permitted. This repository does not use a “non-commercial open source” restriction.

Read [Open-source Policy](./OPEN_SOURCE_POLICY.md), [Commercial Model](./COMMERCIAL.md), and [Licensing](./docs/LICENSING.md).

## Project / trademark disclaimer

This is an independent project. References to GPT/OpenAI, Google Stitch, Supabase, MCP, and other third-party products identify interoperability targets; they do not imply sponsorship or endorsement.
