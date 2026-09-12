# Notion Remote MCP setup

The Gateway connects to Notion's hosted Streamable HTTP MCP endpoint:

```text
https://mcp.notion.com/mcp
```

## Authentication model

Notion MCP uses OAuth Authorization Code + PKCE and supports Dynamic Client
Registration (RFC 7591). The Gateway therefore does not require a static Notion
OAuth client ID or secret.

Connection flow:

```text
User clicks Connect Notion
-> Gateway discovers protected-resource / authorization-server metadata
-> Gateway dynamically registers an MCP OAuth client for its callback
-> PKCE authorization starts
-> Notion redirects to the Gateway callback
-> Gateway exchanges the code
-> OAuth token and dynamic client registration are encrypted server-side
-> Gateway performs tools/list as the connection test
```

Callback:

```text
https://<gateway-api-domain>/api/v1/mcp-connections/notion/oauth/callback
```

## Security

Dynamic client registration metadata needed for refresh is stored only inside
the encrypted provider credential. Neither the access token nor dynamic client
registration is sent to the Custom GPT.

Notion MCP is user-authorized: the connected workspace access follows the
permissions of the Notion user who completed OAuth.

## Runtime

After connection:

```text
listMcpServices
-> listMcpTools("notion")
-> getMcpToolSchema(...)
-> callMcpTool(...)
```

The Gateway discovers the current Notion tool catalog at runtime.
