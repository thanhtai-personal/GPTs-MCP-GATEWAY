# Figma Remote MCP setup

This project includes a Figma Remote MCP adapter for:

```text
https://mcp.figma.com/mcp
```

## Current access restriction

Figma currently restricts its Remote MCP server to MCP clients approved by
Figma / listed in the Figma MCP Catalog. There is no self-service registration
that immediately gives a new Gateway the `mcp:connect` scope.

A regular Figma REST API OAuth application created at
`figma.com/developers/apps` is **not** enough by itself. Its client ID and
client secret do not grant `mcp:connect` access unless Figma has explicitly
approved that client for the Remote MCP server.

Because of this, the Gateway exposes Figma as `pending_review` while no
approved `FIGMA_MCP_OAUTH_CLIENT_ID` is configured. The Connect action remains
disabled during this state. Once Figma approves the MCP client and the approved
client ID is configured, the provider becomes `available`.

## Hosted Gateway review status

The hosted GPTs MCP Gateway has submitted the Figma Remote MCP Server Access
Request and is currently waiting for Figma review. No review timeline is
assumed. Until approval is received, keep both Figma OAuth environment
variables empty and leave the provider in `pending_review`.

## How to obtain the MCP OAuth client ID

1. Request access for the Gateway through Figma's MCP Catalog / client request
   process:

   ```text
   https://www.figma.com/mcp-catalog/
   ```

2. Explain that the application is an MCP client / Gateway connecting to:

   ```text
   https://mcp.figma.com/mcp
   ```

3. Provide the production OAuth callback URL when Figma asks for redirect URIs:

   ```text
   https://<gateway-api-domain>/api/v1/mcp-connections/figma/oauth/callback
   ```

   Example for the current hosted deployment:

   ```text
   https://gpts-mcp-api.vercel.app/api/v1/mcp-connections/figma/oauth/callback
   ```

4. Wait for Figma approval. At the time of writing, Figma does not provide a
   self-service path that lets arbitrary third-party clients mint an MCP OAuth
   client ID with `mcp:connect`.

5. After Figma approves the Gateway, use the MCP OAuth client ID that Figma
   approves or issues:

   ```env
   FIGMA_MCP_OAUTH_CLIENT_ID=<approved-mcp-client-id>
   ```

6. Only set a client secret if Figma explicitly provides/requires one for the
   approved MCP client:

   ```env
   FIGMA_MCP_OAUTH_CLIENT_SECRET=<approved-mcp-client-secret>
   ```

   If Figma registers the Gateway as a public OAuth client, leave the secret
   empty.

7. Redeploy the API after changing the environment variables.

## Do not substitute normal REST OAuth credentials

Figma also supports OAuth applications for its REST API. Those applications
have a client ID and client secret, but the Figma MCP server uses the restricted
`mcp:connect` scope. Do not copy credentials from a normal REST OAuth app into
these variables unless Figma explicitly confirms that the same OAuth client has
been approved for Remote MCP access.

## Internal organization use

Figma has indicated that private/internal MCP client access is a separate path
for eligible Organization / Enterprise customers. If this Gateway is for
internal organization use, contact the Figma account team about private MCP
client access instead of assuming normal REST OAuth credentials will work.

## Gateway behavior

Once configured, the browser flow is:

```text
User clicks Connect Figma
-> Gateway creates PKCE state
-> Figma authorization
-> Gateway OAuth callback
-> encrypted access/refresh token stored server-side
-> Gateway performs MCP tools/list as a connection test
```

The GPT never receives the Figma access token or refresh token.
