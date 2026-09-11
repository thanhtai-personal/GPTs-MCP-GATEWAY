# Data Handling

This document describes what the current source stores and how it is used. A hosted operator still needs its own legally appropriate Privacy Policy and Terms of Service.

## Data categories

### Account profile

`app_users` stores:

- Supabase Auth user ID;
- email;
- optional display name;
- system role;
- membership tier;
- account status;
- timestamps.

Authentication credentials/passwords are handled by Supabase Auth rather than this application table.

### Provider credentials

`mcp_connections` stores:

- user ID;
- provider ID;
- connection status;
- encrypted provider credential;
- credential format version;
- verification/error metadata;
- timestamps.

The raw provider API key is accepted when the user tests/saves a connection, then encrypted before persistence.

The connection-list API does not return the raw credential.

### Open IDs

`open_ids` stores:

- user ownership;
- Open ID string;
- trial/paid kind;
- exportability;
- active/revoked state;
- optional expiry;
- timestamps.

Trial Open IDs are internal/non-exportable in the current product model.

### Gateway credentials

`gateway_credentials` stores:

- owner/Open ID relation;
- optional label;
- SHA-256 hash of the raw token;
- non-secret display prefix;
- optional expiry;
- revocation/last-use metadata;
- timestamps.

The raw Gateway token is shown only in the create response and is not persisted.

### Trial entitlement

`trial_entitlements` stores:

- user ID;
- claim timestamp;
- exact seven-day expiry.

The unique user constraint preserves one lifetime claim even after the token expires/revokes.

### Audit events

`gateway_audit_events` stores operational metadata such as:

- user/credential IDs;
- event type;
- provider;
- operation/tool name;
- success/failure;
- safe error code;
- duration;
- selected metadata;
- timestamp.

The current audit service is intended not to store provider credentials or authorization headers.

Contributors must preserve this boundary.

## Data sent to MCP providers

When the user/GPT invokes a provider tool, the Gateway sends to that provider:

- the user's saved provider credential in the provider-specific authentication mechanism;
- MCP method/tool name;
- tool arguments supplied by the GPT;
- protocol/request metadata required by the provider.

Tool arguments may contain user content. A hosted operator should disclose this third-party processing in its privacy documentation.

## Data returned to GPT

GPT runtime responses may include:

- account entitlement/profile metadata;
- supported provider metadata;
- MCP tool definitions;
- provider tool results;
- sanitized Gateway errors.

They must not include:

- saved provider API key;
- encryption key;
- Supabase service-role key;
- token hash.

## Deletion behavior

The schema currently uses `ON DELETE CASCADE` from `app_users` to:

- trial entitlements;
- Open IDs;
- MCP connections.

Gateway credentials cascade through their owner/Open ID relationships. Audit foreign keys use `ON DELETE SET NULL` for user/credential references, allowing operational audit rows to remain after account/credential deletion.

A hosted operator should define and disclose its actual account deletion/audit retention policy before launch.

## Backups

Backups containing encrypted `mcp_connections` remain sensitive.

The encryption key must be backed up separately and securely. Possession of both the database backup and encryption key permits recovery of provider credentials.

## Logs

Recommended logging policy:

- never log `Authorization`;
- never log raw provider credentials;
- avoid logging full MCP argument/result payloads by default;
- use request/event IDs, provider ID, operation name, status, duration, and safe error code;
- configure reverse proxy/platform logs with the same redaction boundary.

## Hosted-service privacy requirements

The repository does not ship a universal Privacy Policy because the legal controller/operator, domain, analytics, retention, payment provider, region, and support channels vary by deployment.

Before operating a public hosted service, publish operator-specific documents covering at least:

- account/profile data;
- provider credentials;
- MCP tool content sent to third parties;
- logs/audit retention;
- account deletion;
- backups;
- subprocessors/providers;
- cookies/analytics if used;
- payment data if billing is added;
- contact/legal jurisdiction as required.

This file documents engineering behavior; it is not legal advice.
