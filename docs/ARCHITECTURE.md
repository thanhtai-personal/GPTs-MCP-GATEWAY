# Architecture

The project keeps the pragmatic NovelOS conventions: module-first NestJS backend, explicit API/domain boundaries, React Query for server state, alias imports, and append-only database migrations.

## Request path

```text
GPT Action
  -> GatewayAccessGuard
  -> GatewayCredentialService.authenticate()
  -> active Open ID / trial entitlement
  -> McpGatewayService
  -> provider registry
  -> StitchMcpAdapter
  -> Google Stitch MCP
```

Provider secrets are encrypted at rest with AES-256-GCM. Gateway bearer tokens are never stored raw; only SHA-256 hashes and display prefixes are persisted.

## Open ID states

- `trial`: internal and non-exportable; exactly one per account; 7 days.
- `paid`: member entitlement; exportable; one active paid Open ID per account in MVP.

A token is only an authentication secret. The Open ID is the entitlement object the product sells.

## Provider extension

A new provider requires:
1. registry metadata,
2. provider-specific credential validation,
3. adapter implementing `testConnection`, `listTools`, `callTool`,
4. web connection form,
5. tests.

The core gateway API remains stable.
