# Adding an MCP Provider

The provider layer is intentionally small. Add provider-specific behavior without spreading provider conditionals through controllers or the GPT API.

## Current contract

`McpProviderAdapter` requires:

```ts
readonly id
readonly displayName

testConnection(apiKey)
listTools(apiKey)
callTool(apiKey, toolName, arguments)
```

Current provider ID union:

```ts
type McpProviderId = "stitch";
```

Current registry:

```text
McpProviderRegistry
  └── StitchMcpAdapter
```

## Steps

### 1. Define the provider ID

Update the typed provider ID in:

```text
server/src/modules/mcp-gateway/providers/mcp-provider.types.ts
```

Use a stable, lowercase identifier. Changing it later affects saved `mcp_connections.provider` values and GPT routing.

### 2. Implement the adapter

Create:

```text
server/src/modules/mcp-gateway/providers/<provider>/
  <provider>-mcp.adapter.ts
```

The adapter owns:

- upstream endpoint;
- upstream auth header/credential mapping;
- transport details;
- timeout/error mapping;
- response normalization.

Do not put account/membership logic in the adapter.

### 3. Register the provider

Add it to `McpProviderRegistry` and the relevant Nest module provider list.

Unsupported provider IDs must continue to fail through the registry rather than becoming arbitrary outbound requests.

### 4. Credential semantics

The current MCP connection DTO models an `apiKey`.

If the new provider uses the same single-secret pattern, reuse it.

If it requires OAuth/multiple fields, do **not** overload `apiKey` with encoded JSON. Introduce an explicit provider credential model and migration/security review.

### 5. Frontend

Add the provider to the connection UI with clear:

- display name;
- credential input description;
- provider setup instructions;
- connection/test state.

Never render an already-saved raw credential back into the browser.

### 6. Generated GPT schema

The current generated OpenAPI has a provider enum containing `stitch`.

Update the generated schema so the new stable provider ID can be selected.

Do not add one OpenAPI endpoint per provider tool. The generic discovery/call contract is a core design property.

### 7. Knowledge / documentation

Document the provider ID and connection prerequisites.

Do **not** copy a mutable provider tool catalog into static Knowledge. Runtime `listMcpTools` remains authoritative.

### 8. Error mapping

Map provider failures to existing semantics when possible:

```text
MCP_INVALID_CREDENTIAL
MCP_RATE_LIMITED
MCP_SERVICE_UNAVAILABLE
MCP_INVALID_RESPONSE
MCP_TOOL_CALL_FAILED
```

Introduce a new public error code only when callers need to react differently.

Never forward raw errors that may contain authorization headers or secrets.

## Security review checklist

Before merging a provider:

- [ ] Endpoint is fixed/trusted or has an explicit network policy.
- [ ] Redirect behavior cannot exfiltrate credentials.
- [ ] Credential is sent only to the intended host.
- [ ] Timeouts are enforced.
- [ ] Provider errors are sanitized.
- [ ] Logs/audit do not include secrets.
- [ ] Connection test makes a real provider request.
- [ ] Saved secret remains encrypted at rest.
- [ ] GPT never receives provider credentials.
- [ ] Runtime tool output is treated as untrusted.

## Validation checklist

- [ ] valid credential test;
- [ ] invalid credential test;
- [ ] upstream unavailable test;
- [ ] provider rate-limit test if practical;
- [ ] `tools/list` success;
- [ ] `tools/call` success;
- [ ] malformed provider response;
- [ ] user A cannot consume user B's provider connection;
- [ ] generated OpenAPI includes the provider;
- [ ] web copy exists in both Vietnamese and English where applicable.
