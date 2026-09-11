# MCP Gateway

MCP Gateway is a new project derived from the **source conventions** of NovelOS, not a copy of its story domain.

Its core product is an **Open ID entitlement** that lets a Custom GPT use supported MCP services through one controlled gateway. The first provider adapter is Google Stitch.

## Product flow

```text
Custom GPT
   |
   | OpenAPI Action + Gateway bearer token
   v
MCP Gateway
   |
   | validates Gateway token -> Open ID -> entitlement
   | resolves the user's encrypted provider credential
   v
Supported MCP provider (Stitch first)
```

A logged-in user can connect Stitch and download the GPT integration kit before buying an Open ID. MCP execution is only allowed when the Gateway token resolves to an active paid Open ID or the account's one-time 7-day trial Open ID.

## Repository

- `web/` — TanStack Start / React / TypeScript / React Query, VI+EN UI.
- `server/` — NestJS API, Supabase/PostgreSQL, provider adapters.
- `database/migrations/` — initial schema for this new project.
- `docs/` — architecture and GPT integration protocol.
- `scripts/` — dependency-free contract/source checks.

## Quick start

1. Copy `server/.env.example` to `server/.env`.
2. Copy `web/.env.example` to `web/.env`.
3. Apply `database/migrations/001_initial_schema.sql` to a development Supabase database.
4. Install dependencies in `server/` and `web/`.
5. Run `npm run dev:server` and `npm run dev:web`.

Generate a 32-byte encryption key:

```bash
openssl rand -base64 32
```

Put it in `MCP_CREDENTIAL_ENCRYPTION_KEY`. Never expose this key or the Supabase service role key to the browser.

## Stitch

The adapter targets `https://stitch.googleapis.com/mcp` and sends the user's API key in `X-Goog-Api-Key`. It uses MCP JSON-RPC `tools/list` and `tools/call`.

## MVP limitations

Payment checkout is intentionally not mocked. For MVP testing, promote an account's `membership_tier` to `member` in a trusted admin/database workflow. A payment provider can later update the same entitlement boundary server-side.

## Patch trace

`mcp-gateway.git.patch` is generated from the complete new source tree for trace/review purposes.
