# Changelog

This project uses this file to record user-visible changes once public releases begin.

The format is inspired by Keep a Changelog, with semantic-version-style release headings.

## [Unreleased]

### Added

- Open-source documentation set:
  - architecture and API reference;
  - self-hosting guide;
  - security model and vulnerability policy;
  - contributor/community guidelines;
  - provider extension guide;
  - project status and troubleshooting;
  - AGPL-3.0-or-later licensing and commercial-service boundary;
  - dependency security policy;
  - GitHub repository rules, CI and Dependabot configuration;
  - release checklist.
- Native `google-drive` provider: search, list, read (Docs/Slides as text, Sheets as CSV), create, update, trash and share Drive files through the existing Google Workspace connection, without the Workspace Developer Preview.
- NestJS dependency policy pins the supported server framework line and overrides transitive Multer to the patched 2.3.0 release.

### Added (MCP server)

- Remote MCP endpoint `/api/v1/mcp` for ChatGPT, Claude and other MCP clients, authenticated with the Supabase OAuth 2.1 server (PKCE, dynamic client registration), protected resource metadata at `/.well-known/oauth-protected-resource`, consent page `/oauth/consent`. Tools: `gateway_profile`, `list_tools`, `get_tool_schema`, `call_tool`; Open ID entitlement checked on every call.

### Changed

- OAuth client tokens are rejected on dashboard/REST APIs (`OAUTH_CLIENT_TOKEN_NOT_ALLOWED`).

- Provider OAuth no longer relies on a cross-site cookie. The Gateway callback forwards to the web page `/oauth/complete`, which completes the flow with the signed-in user's token and a per-tab browser nonce (`POST /mcp-connections/:provider/oauth/complete`). Fixes connections never saving when web and API are on different sites (e.g. two `*.vercel.app` domains). Registered provider redirect URIs are unchanged.
- The MCP services page now shows the OAuth result (connected or the error code) instead of failing silently.

- Connecting Google Workspace now verifies Drive only; Docs and Sheets MCP are verified when called, so accounts outside the Developer Preview can connect.

### Removed

- Standalone `gdrive-mcp/` Next.js server and `GOOGLE_DRIVE_MCP_URL` (replaced by the native `google-drive` provider).

## [0.1.0] - 2026-09-11

### Added

- Initial MCP Gateway MVP source.
- Supabase-backed accounts with Guest/Member membership.
- One-time seven-day Guest trial.
- Internal trial Open ID and paid Member Open ID.
- Hashed/revocable Gateway credentials.
- Encrypted MCP provider credential storage.
- Google Stitch MCP adapter.
- Runtime MCP service/tool discovery and tool execution.
- English/Vietnamese GPT Integration Kit.
- English/Vietnamese web UI and SEO landing baseline.

### Known limitations

- Payment/admin automation not implemented.
- Only Stitch provider implemented.
- Full dependency-backed build and live Supabase/Stitch smoke validation not completed in the artifact environment; see `VALIDATION.md`.
