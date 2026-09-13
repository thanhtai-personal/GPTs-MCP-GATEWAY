# Self-hosting

This guide describes the current source. It is not a one-click production deployment recipe.

## Prerequisites

- Node.js 24 (`.nvmrc`)
- npm
- Supabase project with Auth + PostgreSQL
- TLS-terminating reverse proxy/load balancer for a public deployment
- a stable public URL for the web app
- a stable public HTTPS URL for the Gateway API
- Google Stitch API key for each user that wants to connect Stitch

## 1. Database

Apply migrations in order.

For a brand-new database:

```text
database/migrations/001_initial_schema.sql
database/migrations/002_gpt_response_transfers.sql
database/migrations/003_site_settings.sql
database/migrations/004_mcp_oauth_transactions.sql
```

Do not edit an already-applied migration after public deployment. Future schema changes should be new forward migrations.

The initial migration:

- creates `app_users`;
- creates trial/Open ID/Gateway credential tables;
- creates encrypted MCP connection metadata storage;
- creates audit events;
- creates the `auth.users -> app_users` profile trigger;
- creates the atomic `claim_gateway_trial` RPC;
- enables RLS;
- revokes direct access to sensitive Gateway tables from `anon` and `authenticated`;
- grants trusted access to `service_role`.

## 2. Supabase Auth

The web UI currently uses email/password:

- `signUp`
- `signInWithPassword`

Configure email confirmation behavior in Supabase according to your deployment.

The database trigger creates `app_users` when a new `auth.users` row is inserted.

## 3. Server environment

Copy:

```bash
cp server/.env.example server/.env
```

Variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | no | runtime mode |
| `PORT` | no | server port, default 5657 |
| `WEB_BASE_URL` | no | primary web origin |
| `CORS_ALLOWED_ORIGINS` | no | comma-separated allowed browser origins |
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | yes | used to validate user sessions |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | trusted backend database access |
| `MCP_CREDENTIAL_ENCRYPTION_KEY` | yes | AES-256-GCM key for provider credentials |
| `GATEWAY_PUBLIC_BASE_URL` | recommended | public base URL embedded in GPT OpenAPI |
| `GATEWAY_RATE_LIMIT_PER_MINUTE` | no | global Nest throttler limit |
| `MCP_UPSTREAM_TIMEOUT_MS` | no | provider request timeout |
| `MCP_UPSTREAM_MAX_RESPONSE_BYTES` | no | maximum bytes read from one MCP response (default 16777216) |

Generate the encryption key:

```bash
openssl rand -base64 32
```

The decoded value must be exactly 32 bytes.

### Secret handling

Store in a secret manager or protected runtime environment:

```text
SUPABASE_SERVICE_ROLE_KEY
MCP_CREDENTIAL_ENCRYPTION_KEY
```

Do not:

- put either value in `web/.env`;
- expose them through `VITE_*`;
- commit production `.env` files;
- log decrypted provider credentials.

Back up the encryption key securely. Losing it makes existing encrypted provider credentials undecryptable.

The current source does **not** implement online encryption-key rotation. Plan rotation before running a large production installation.

## 4. Web environment

Copy:

```bash
cp web/.env.example web/.env
```

Variables:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | public Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | public anon key |
| `VITE_GATEWAY_API_BASE_URL` | public Gateway API `/api/v1` base |
| `VITE_PUBLIC_SITE_URL` | public web origin used by SEO generation |

Only use values intended for browser exposure.

## 5. Install

The repository currently does not include validated lockfiles in this artifact. Before a public release, generate and commit lockfiles after a clean dependency install.

Development:

```bash
npm --prefix server install
npm --prefix web install
```

## 6. Run in development

```bash
npm run dev:server
npm run dev:web
```

Both development servers bind to loopback (`127.0.0.1`).

## 7. Build

Intended commands:

```bash
npm run typecheck:web
npm run build:web
npm run build:server
npm run test:server
```

Read `VALIDATION.md`: these dependency-backed commands were not all executed successfully in the artifact environment and must be run before production release.

## 8. Production network topology

The Nest server currently calls:

```text
app.listen(port, "127.0.0.1")
```

The Vite preview/development config also binds to loopback.

For production, keep the application process private and expose it through a reverse proxy/load balancer, for example:

```text
Internet
  -> HTTPS reverse proxy
       -> web process on loopback/private network
       -> API process on loopback/private network
```

Set:

```text
GATEWAY_PUBLIC_BASE_URL=https://gateway.example.com
VITE_GATEWAY_API_BASE_URL=https://gateway.example.com/api/v1
VITE_PUBLIC_SITE_URL=https://example.com
CORS_ALLOWED_ORIGINS=https://example.com
```

`GATEWAY_PUBLIC_BASE_URL` matters because the generated GPT Action OpenAPI embeds this value.

Do not publish an HTTP-only Gateway for real GPT credentials.

## 9. Development membership promotion

Payment/admin automation is not implemented.

For local/dev testing only, a trusted operator may promote an existing account:

```sql
update public.app_users
set membership_tier = 'member',
    updated_at = now()
where id = '<user-uuid>';
```

Do not expose this operation to an untrusted browser/client.

A production billing integration should update membership only after a trusted server-side payment/subscription event.

## 10. Stitch

Each user supplies their own Stitch API key through the app.

The server:

1. tests it with Stitch;
2. encrypts it before persistence;
3. decrypts it only when the authenticated account needs Stitch;
4. sends it upstream as `X-Goog-Api-Key`.

The provider endpoint is fixed in the adapter. Users cannot supply arbitrary upstream URLs.

## 11. Reverse-proxy operational concerns

Configure your edge/proxy for:

- HTTPS only;
- request body limits appropriate for MCP arguments;
- conservative request/read timeouts greater than the configured upstream timeout;
- access logs that redact Authorization headers;
- no response caching for authenticated API routes;
- rate/abuse protection in addition to application throttling.

## 12. Backups

Back up:

- PostgreSQL;
- Supabase Auth according to your platform plan;
- `MCP_CREDENTIAL_ENCRYPTION_KEY` separately and securely.

A database backup without the corresponding encryption key cannot recover saved MCP provider credentials.

## 13. Before production

Complete the [Open-source Release Checklist](./OPEN_SOURCE_RELEASE.md) and specifically:

- choose a license;
- commit deterministic lockfiles;
- run clean install/typecheck/build/tests;
- apply migration to a disposable database;
- run real Stitch connection/tool smoke tests;
- verify CORS/public URLs;
- enable private vulnerability reporting;
- review dependency/security scanning.
