# API Reference

The server has a global `/api` prefix and URI versioning with version `1`, so the routes below use `/api/v1`.

Swagger UI is mounted at `/docs` in the current source.

## Authentication overview

There are two independent Bearer token types.

| API family | Bearer token |
| --- | --- |
| Account / MCP connection / Open ID / GPT-kit management | Supabase **user access token** |
| `/gpt/*` runtime endpoints | MCP Gateway **Gateway token** |

A Gateway token is not a Supabase JWT. A Supabase JWT is not a Gateway token.

## Health

### `GET /api/v1/health`

No application user authentication is required by the controller.

Use it for basic process liveness.

## Account API

### `GET /api/v1/account/me`

Authentication: Supabase user Bearer token.

Returns the application profile loaded from `app_users`, including membership/system role/status.

## MCP Connections API

Authentication for all endpoints: Supabase user Bearer token.

### `GET /api/v1/mcp-connections`

Lists the authenticated user's saved provider connections.

Raw provider credentials are never returned.

### `POST /api/v1/mcp-connections/test`

Example body:

```json
{
  "provider": "stitch",
  "apiKey": "<provider-api-key>"
}
```

Tests the supplied credential against the provider. It does not save it.

### `PUT /api/v1/mcp-connections`

Uses the same body as `test`.

The server validates the credential first, encrypts it, then upserts the connection.

### `DELETE /api/v1/mcp-connections/:provider`

Deletes the authenticated user's saved provider connection.

## Open ID / trial API

Authentication for all endpoints: Supabase user Bearer token.

### `GET /api/v1/open-ids`

For a Member, lists the account's paid Open ID rows.

A Guest currently receives an empty list.

### `POST /api/v1/open-ids`

Member-only.

Creates the account's paid Open ID if one does not exist. The current MVP returns the existing active paid Open ID on repeated creation attempts.

### `GET /api/v1/open-ids/trial`

Returns trial state:

- `available` for an eligible Guest that has never claimed;
- `active` while the claimed seven-day trial is active;
- `consumed` after it expires;
- `not_applicable` for a Member without a trial record.

### `POST /api/v1/open-ids/trial`

Guest-only, one account lifetime.

Atomically creates:

- trial entitlement;
- internal non-exportable trial Open ID;
- trial Gateway credential.

The response includes the **raw Gateway token once**. Store it directly in GPT Action authentication; the server cannot display it again later.

### `GET /api/v1/open-ids/:openIdId/tokens`

Member-only. Lists token metadata for the paid Open ID.

Raw tokens are not returned.

### `POST /api/v1/open-ids/:openIdId/tokens`

Member-only.

Example body:

```json
{
  "label": "My Custom GPT",
  "expiresInDays": 30
}
```

`expiresInDays` is optional according to the DTO. The response includes the raw token once.

### `DELETE /api/v1/open-ids/:openIdId/tokens/:tokenId`

Revokes the selected Gateway credential.

Revocation is persisted with `revoked_at`; a revoked token no longer authenticates.

## GPT Integration API

Authentication: Supabase user Bearer token.

### `GET /api/v1/gpt-integration/schema`

Returns the generated OpenAPI YAML used by GPT Actions.

The OpenAPI `servers` URL is based on `GATEWAY_PUBLIC_BASE_URL`.

### `GET /api/v1/gpt-integration/package?language=en`

Returns a ZIP.

Supported language values:

- `en`
- `vi`

Unknown/missing language currently falls back to English.

## GPT Runtime API

Authentication for all endpoints: **Gateway Bearer token**.

The guard resolves token -> active credential -> active Open ID -> active account before the request reaches the controller.

### `GET /api/v1/gpt/profile`

Returns:

- active `openId`;
- entitlement kind (`trial` or `paid`);
- account membership;
- provider registry with connection status.

### `GET /api/v1/gpt/mcp/services`

Returns supported services and their connection status for the Gateway principal.

### `GET /api/v1/gpt/mcp/:service/tools`

Example:

```text
GET /api/v1/gpt/mcp/stitch/tools
Authorization: Bearer <GATEWAY_TOKEN>
```

The Gateway decrypts the current user's saved Stitch API key and executes MCP `tools/list`.

### `POST /api/v1/gpt/mcp/:service/tools/:toolName/call`

Example body:

```json
{
  "arguments": {
    "example": "value"
  }
}
```

Arguments are forwarded to the selected MCP tool after DTO validation of the outer shape.

The provider's runtime `inputSchema` should be used by the GPT to construct the arguments.

## Error envelope

NestJS exceptions in this source generally include semantic fields like:

```json
{
  "code": "OPEN_ID_REQUIRED",
  "message": "An active Open ID is required to use MCP Gateway"
}
```

HTTP wrappers may add framework fields depending on NestJS behavior.

Important domain codes include:

```text
UNAUTHORIZED
ACCOUNT_NOT_ACTIVE
TOKEN_EXPIRED
OPEN_ID_REQUIRED
MEMBERSHIP_REQUIRED
TRIAL_GUEST_ONLY
TRIAL_ALREADY_USED
MCP_NOT_CONNECTED
MCP_PROVIDER_UNSUPPORTED
MCP_INVALID_CREDENTIAL
MCP_SERVICE_UNAVAILABLE
MCP_RATE_LIMITED
MCP_INVALID_RESPONSE
MCP_TOOL_CALL_FAILED
```

Treat semantic `code` as the stable application concept; do not expose raw upstream credentials/errors.
