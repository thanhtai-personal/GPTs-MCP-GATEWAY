# Google Docs + Sheets MCP setup

Google Docs and Google Sheets remote MCP servers are currently Developer Preview.

## Google Cloud APIs

Enable:

```text
docs.googleapis.com
docsmcp.googleapis.com
sheets.googleapis.com
sheetsmcp.googleapis.com
```

## OAuth scopes

Add these scopes to the Google Auth Platform consent screen:

```text
https://www.googleapis.com/auth/drive.readonly
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/documents.readonly
https://www.googleapis.com/auth/documents
https://www.googleapis.com/auth/spreadsheets.readonly
https://www.googleapis.com/auth/spreadsheets
```

The application intentionally requests the combined set in one incremental
Google consent flow so the same signed-in Google account can authorize both MCP
servers.

## Supabase + Gateway OAuth client

MCP Gateway already signs users in through the Supabase Google provider.
Keep that Google OAuth Web client as the source of identity and add the scopes
above to its consent screen.

Configure the Gateway backend with the **same OAuth client ID and secret**:

```env
GOOGLE_WORKSPACE_OAUTH_CLIENT_ID=<same client id configured in Supabase Google provider>
GOOGLE_WORKSPACE_OAUTH_CLIENT_SECRET=<same client secret configured in Supabase Google provider>
```

The browser receives Google's provider access/refresh token from the Supabase
PKCE callback only long enough to send it over the authenticated Gateway API.
Gateway encrypts the token in `mcp_connections`. Provider tokens are not added
to Custom GPT context.

## Remote MCP endpoints

```text
Google Docs   https://docsmcp.googleapis.com/mcp/v1
Google Sheets https://sheetsmcp.googleapis.com/mcp/v1
```

A single consent action connects both provider IDs:

```text
google-docs
google-sheets
```

## Developer Preview

Google Workspace MCP is Developer Preview. Tool catalogs and provider behavior
can change. GPT skills therefore route intent and safety workflow but runtime
`tools/list` and tool schemas remain authoritative.
