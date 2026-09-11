# Troubleshooting

## `Missing required environment variable`

The Nest server lazily requires Supabase/encryption values when the corresponding config getter is used.

Compare `server/.env` with `server/.env.example`.

## `MCP_CREDENTIAL_ENCRYPTION_KEY must decode to exactly 32 bytes`

Generate a base64-encoded 32-byte value:

```bash
openssl rand -base64 32
```

Do not paste an arbitrary 32-character string; the decoded byte length must be 32.

## Browser says Supabase is not configured

Set:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

in `web/.env`.

The fallback values in source exist to avoid an import crash; they are not a working Supabase configuration.

## Dashboard returns `UNAUTHORIZED`

Dashboard routes require the Supabase user Bearer token.

Do not use a Gateway token for `/account`, `/mcp-connections`, `/open-ids`, or `/gpt-integration`.

## GPT route returns `UNAUTHORIZED`

`/gpt/*` routes require a Gateway token, not a Supabase user JWT.

Check GPT Action API authentication.

## `TOKEN_EXPIRED`

The Gateway credential has an explicit expiry in the past.

Use another active allowed token.

## `OPEN_ID_REQUIRED`

The token resolved, but its Open ID is not an active entitlement.

Possible causes:

- trial expired;
- Open ID revoked;
- paid Open ID no longer has Member membership;
- entitlement record unavailable/inactive.

The correct fix is entitlement/account management, not bypassing the Gateway.

## `TRIAL_ALREADY_USED`

The account has already claimed its lifetime trial.

Revoking or losing the original token does not reset eligibility.

## `MCP_NOT_CONNECTED`

The authenticated Gateway account does not have an active saved connection for that provider.

Connect/test/save the provider in the app.

## `MCP_INVALID_CREDENTIAL`

The provider rejected the saved key.

Update/test the provider credential in the app.

Do not put the provider key into GPT Actions.

## `MCP_SERVICE_UNAVAILABLE`

The upstream request failed or returned a non-auth error.

This does not necessarily mean the API key is invalid.

## GPT calls the wrong tool

The generated protocol expects the GPT to call `listMcpTools(service)` and choose from the current `inputSchema`.

Do not fix this by hardcoding a mutable Stitch tool list into static Knowledge unless there is a very narrow, deliberate workflow.

## Imported GPT Action points at localhost

`openapi.yaml` is generated from `GATEWAY_PUBLIC_BASE_URL`.

Set it to your public HTTPS Gateway URL before downloading the integration package.

## Browser CORS failure

Check `CORS_ALLOWED_ORIGINS`.

It is comma-separated and must contain the exact browser origin.

## Production API is unreachable externally

The Nest app binds to `127.0.0.1` in current source. Put a reverse proxy/load balancer in front of it or deliberately adjust the deployment binding with an accompanying security review.

## Saved MCP credentials became undecryptable after a deploy

Check whether `MCP_CREDENTIAL_ENCRYPTION_KEY` changed.

The current source has no automatic key-rotation migration. Restore the correct key from secure backup or rotate provider credentials after implementing a controlled migration.
