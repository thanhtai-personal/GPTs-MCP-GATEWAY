# Google Drive + Docs + Sheets setup

## Google Drive (no Developer Preview)

`google-drive` is a native Gateway provider. It does not proxy a Google MCP
server: Gateway publishes its own tool catalog and calls the Drive REST API
(`www.googleapis.com/drive/v3`) with the user's Google Workspace OAuth token.

- Enable `drive.googleapis.com` on the Cloud project that owns the OAuth client.
- No extra environment variables: it reuses
  `GOOGLE_WORKSPACE_OAUTH_CLIENT_ID/SECRET` and the same connection.
- Scopes: `drive.readonly` (search/read every file the user can access) and
  `drive.file` (create files; edit, share or trash only files created through
  Gateway). Both are already in the consent request below.
- Tools: `search_files`, `list_files`, `get_file_metadata`,
  `read_file_content`, `create_file`, `update_file`, `trash_file`,
  `share_file`.

Connecting Google verifies Drive only. Docs and Sheets are checked when they
are called, so accounts outside the Developer Preview can still use Drive.


## Developer Preview access is required

Google Docs MCP and Google Sheets MCP are currently part of the Google Workspace
Developer Preview Program. Enabling the APIs and obtaining OAuth scopes is not
sufficient by itself.

Before testing MCP Gateway:

1. Join the Google Workspace Developer Preview Program with the Google Workspace account used for testing.
2. Register the Google Cloud project that owns the OAuth client with the program.
3. Wait for Google's final confirmation that the account and Cloud project were added.
4. Enable `docs.googleapis.com`, `docsmcp.googleapis.com`, `sheets.googleapis.com`, and `sheetsmcp.googleapis.com`.
5. Add the documented Docs + Sheets OAuth scopes to Google Auth Platform > Data Access.
6. Keep the test account in the OAuth app's allowed test users while the OAuth app is in Testing mode.

A `403` from the remote MCP server is reported by Gateway as
`MCP_PROVIDER_PERMISSION_DENIED`. It means Google authenticated the request but
did not authorize that MCP operation/project; reconnecting the token alone does
not fix this condition.

Google's Developer Preview terms restrict public end-user use of Pre-GA APIs
unless Google explicitly grants permission. Do not enable this integration for
general public customers until the provider terms allow it.

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

A single consent action creates one encrypted connection config:

```text
google-workspace
```

That one credential powers three runtime service IDs:

```text
google-drive
google-docs
google-sheets
```

The MCP Services UI therefore shows one **Google Workspace** card while GPT
runtime discovery still exposes separate Drive, Docs and Sheets services and skills.

## Developer Preview

Google Workspace MCP is Developer Preview. Tool catalogs and provider behavior
can change. GPT skills therefore route intent and safety workflow but runtime
`tools/list` and tool schemas remain authoritative.


## Gateway OAuth callback for test mode

Google Workspace MCP authorization no longer reuses the Supabase
`provider_token`. Supabase Google OAuth remains account sign-in only.

MCP Gateway performs a separate Google OAuth web-server flow with the same
Google OAuth client ID/secret and uses the signed-in account email as
`login_hint`.

Add this additional Authorized redirect URI to the Google OAuth Web client:

```text
<GATEWAY_PUBLIC_BASE_URL>/api/v1/mcp-connections/google-workspace/oauth/callback
```

Keep the existing Supabase redirect URI as well. Both redirects can coexist on
the same Google OAuth Web client.

The Gateway flow requests `access_type=offline`, `prompt=consent`, and the
combined Docs + Sheets scopes. Before calling the remote MCP endpoint, Gateway
validates the freshly-issued access token with Google's token diagnostics and
checks the required scopes.

If that fresh token is valid but the remote MCP still returns 401, Gateway
reports `GOOGLE_WORKSPACE_MCP_ACCESS_REJECTED` instead of incorrectly asking
the user to reconnect. For a Developer Preview test account, verify enrollment
of both the Workspace account and Google Cloud project and verify the MCP APIs
are enabled.


## Post-consent navigation

Google Workspace is configured from MCP Services, so this provider-specific
OAuth callback always returns to:

```text
/app#mcp-services
```

The Google Workspace flow intentionally does not preserve another app screen.
Both successful consent and callback errors return to MCP Services so the user
can immediately see the connection state and retry/configure the provider.
