# Google Drive + Docs + Sheets setup

Google Drive, Google Docs, and Google Sheets are native Gateway providers.
They use Google's official REST APIs directly; the Docs/Sheets MCP Developer
Preview endpoints are not required.

## Google Cloud APIs

Enable these APIs in the Cloud project that owns the OAuth client:

```text
drive.googleapis.com
docs.googleapis.com
sheets.googleapis.com
```

Do not enable `docsmcp.googleapis.com` or `sheetsmcp.googleapis.com` for this
native integration.

## OAuth scopes

The Gateway requests these scopes in one Google Workspace consent flow:

```text
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/documents
https://www.googleapis.com/auth/spreadsheets
```

The Drive scope is broad: it lets Gateway access and copy files that the
signed-in user can already access, rather than limiting writes to files created
by Gateway or explicitly opened through a Picker flow. Google classifies Drive
full access as a restricted scope. A production OAuth app may need Google's
verification and security assessment. Keep the OAuth app in Testing mode with
only intended test users until the required review is complete.

Docs and Sheets scopes allow direct document and spreadsheet API operations.
The user must still have the appropriate Google Drive permission on each file;
OAuth scopes do not override file ownership or sharing permissions.

## Supabase + Gateway OAuth client

MCP Gateway signs users in through the Supabase Google provider. Keep the same
Google OAuth Web client as the source of identity and configure the Gateway
backend with the same client ID and secret:

```env
GOOGLE_WORKSPACE_OAUTH_CLIENT_ID=<same client id configured in Supabase Google provider>
GOOGLE_WORKSPACE_OAUTH_CLIENT_SECRET=<same client secret configured in Supabase Google provider>
```

Add this Authorized redirect URI to the Google OAuth Web client:

```text
<GATEWAY_PUBLIC_BASE_URL>/api/v1/mcp-connections/google-workspace/oauth/callback
```

Keep the existing Supabase redirect URI as well. Both redirects can coexist.

The Gateway performs a separate Google OAuth web-server flow using PKCE,
`access_type=offline`, `prompt=consent`, and the signed-in user's email as
`login_hint`. The access and refresh tokens are encrypted in
`mcp_connections`; provider tokens are not sent to Custom GPT context.

## Reconnect after deployment

After deploying a version that requests the full Drive scope:

1. Disconnect the existing Google Workspace connection in MCP Services.
2. Reconnect Google Workspace and approve the expanded Drive, Docs, and Sheets scopes.
3. Verify that the Google OAuth consent screen has all requested scopes configured.
4. Confirm the Drive, Docs, and Sheets APIs are enabled in the same Cloud project.
5. Check the Google Workspace connection status, then test reading and editing a
   document and spreadsheet that the signed-in user can edit.

Existing refresh tokens do not automatically gain newly requested scopes.
A fresh consent flow is required.

## File copy and safe editing

The Drive provider exposes `copy_file`, which calls Drive API
`files.copy` to create a separate copy of a Google Doc, Google Sheet, or
supported Drive file. The source is not modified. The returned file ID should
be used for subsequent edits.

For spreadsheet structure changes, use Sheets API `batchUpdate` with the
appropriate request (for example, `deleteDimension`). For document content
changes, use Docs API `batchUpdate`. For cell values, use the Sheets values
API. Always inspect the target file and verify the resulting copy before
reporting completion.

## Native API endpoints

- Google Drive: `https://www.googleapis.com/drive/v3`
- Google Docs: `https://docs.googleapis.com/v1`
- Google Sheets: `https://sheets.googleapis.com/v4`

Google API scopes do not grant access to files the signed-in user cannot
otherwise access. Gateway must preserve the source file and only modify a copy
when the user requests a clone-first workflow.
