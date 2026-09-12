# GitHub Remote MCP setup

The Gateway connects to GitHub's official hosted MCP server:

```text
https://api.githubcopilot.com/mcp
```

## Authentication model

GitHub Remote MCP supports OAuth, but each hosted MCP client application must
use a GitHub OAuth App or GitHub App registered for that client. The Gateway
does not reuse credentials from another editor or MCP host.

Register the production callback URL:

```text
https://<gateway-api-domain>/api/v1/mcp-connections/github/oauth/callback
```

Then configure:

```env
GITHUB_MCP_OAUTH_CLIENT_ID=<github-client-id>
GITHUB_MCP_OAUTH_CLIENT_SECRET=<github-client-secret>
```

When either value is missing, GitHub remains visible in the provider catalog as
`requires_configuration` and Connect stays disabled.

## Security

The browser completes GitHub OAuth with PKCE. The access token is encrypted
server-side in `mcp_connections`; it is never returned to the Custom GPT.

The current Gateway asks for the common scopes required by the default remote
GitHub MCP toolsets:

```text
repo read:org read:user user:email read:project project gist notifications
```

Organization policy can further restrict access.

## Runtime

After connection, the normal runtime flow applies:

```text
listMcpServices
-> listMcpTools("github")
-> getMcpToolSchema(...)
-> callMcpTool(...)
```

Tool names are discovered from GitHub MCP at runtime and are not hardcoded into
the GPT instructions.


## Gateway permission mode

MCP Gateway exposes two user-selectable GitHub permission modes:

- `Read only` — default. Gateway uses GitHub MCP's remote read-only endpoint, which filters write tools at the GitHub MCP server.
- `Read + write` — explicit opt-in. Gateway uses the normal remote MCP endpoint and GitHub exposes write-capable tools allowed by OAuth scopes and organization policy.

Existing GitHub connections created before this setting existed are treated as `Read only`.

Changing the mode requires reconnecting GitHub so the selected mode is stored with the encrypted OAuth credential.
