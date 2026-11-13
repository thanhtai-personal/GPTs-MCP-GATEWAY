# Facebook Page Publishing MVP Implementation Plan

> **For agentic workers:** Execute task-by-task with TDD. User explicitly requested implementation in the current session.

**Goal:** Let an authenticated Gateway user create a Page post draft, approve it, and publish text/image/video content at the approved time through the official Meta Graph API.

**Architecture:** Extend the existing Facebook native provider with draft/approval/status MCP tools. Persist post intent in Supabase; a single-process Nest worker claims due rows atomically through a SQL function. The worker obtains the Page access token just-in-time from the encrypted user OAuth credential and never persists or returns it. Expired publishing leases become `needs_review` rather than being automatically retried, because Meta publishing does not provide a reliable idempotency key and duplicate posts are worse than a manual reconciliation step.

**Tech Stack:** Existing NestJS 11, Supabase Postgres, TypeScript, Jest, React/Vite unchanged for this backend-first MVP.

**Spec:** This plan and the Facebook integration boundaries in `docs/FACEBOOK_PERSONAL_PROFILE_MVP.md` (PR #65), plus the existing Meta OAuth foundation in PR #66.

## Global Constraints
- Page publishing requires official Meta Graph API and Page access token.
- Required permissions: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`; the user must have `CREATE_CONTENT` or `MANAGE` Page task.
- Never expose/store Facebook user or Page access tokens outside encrypted Gateway connection storage; Page tokens are fetched just-in-time and kept in memory only.
- Draft creation never publishes. Publishing requires an explicit approve tool call.
- Scheduled time is UTC ISO-8601, at least 2 minutes in the future and no more than 75 days in the future.
- Media input is a public HTTPS URL. Local file upload, resumable video upload, Reels, carousels, and multi-image albums are out of scope for this MVP.
- No automated retry after an ambiguous publish outcome. Stale worker leases become `needs_review`.
- No personal-profile publishing, scraping, cookie login, or browser automation.

## Review Focus
- Page ID not managed by this user or missing `CREATE_CONTENT` / `MANAGE` task.
- Invalid or non-HTTPS media URL; photo/video media is fetched by Meta, not by the Gateway.
- OAuth token revoked or required permissions missing between approval and publish.
- Worker crash after Meta accepted a post but before the database status update; never blindly republish.
- Concurrent workers claiming the same scheduled row; SQL claim must be atomic.

---

### Task 1: Durable post records and atomic worker claims

**Files:**
- Create: `database/migrations/006_facebook_page_posts.sql`
- Create: `server/src/modules/mcp-gateway/providers/facebook/facebook-page-post.repository.ts`
- Create: `server/src/modules/mcp-gateway/providers/facebook/facebook-page-post.repository.spec.ts`

**Interfaces:**
- Statuses: `draft | scheduled | publishing | published | failed | needs_review`.
- Repository methods: `createDraft`, `approveDraft`, `listPosts`, `claimDuePosts`, `markPublished`, `markFailed`, `markNeedsReview`.
- The SQL claim function must use `FOR UPDATE SKIP LOCKED`, set a five-minute lease, and return only rows moved to `publishing`.
- Stale `publishing` rows must be moved to `needs_review`, not back to `scheduled`.

### Task 2: Graph API Page publishing

**Files:**
- Modify: `server/src/modules/mcp-gateway/providers/facebook/facebook-graph-api.client.ts`
- Create: `server/src/modules/mcp-gateway/providers/facebook/facebook-page-publishing.service.ts`
- Create: `server/src/modules/mcp-gateway/providers/facebook/facebook-page-publishing.service.spec.ts`

**Interfaces:**
- Resolve Page token by calling `GET /me/accounts?fields=id,name,tasks,access_token` with the connected User token; require matching Page ID and `CREATE_CONTENT` or `MANAGE`.
- Text: `POST /{page-id}/feed` with `message`.
- Image: `POST /{page-id}/photos` with `url` and `caption`.
- Video: `POST /{page-id}/videos` with `file_url` and `description`.
- Graph client must support authenticated GET and URL-encoded POST, with no token in query strings or logs.

### Task 3: MCP draft, approval, and status tools

**Files:**
- Modify: `server/src/modules/mcp-gateway/providers/facebook/facebook-mcp.tools.ts`
- Modify: `server/src/modules/mcp-gateway/providers/facebook/facebook-mcp.adapter.ts`
- Modify: `server/src/modules/mcp-connections/mcp-connections.module.ts`
- Create/modify corresponding adapter tests.

**Tools:**
- `facebook_create_page_post_draft`
- `facebook_approve_page_post_draft`
- `facebook_list_page_posts`

### Task 4: Due-post worker and module integration

**Files:**
- Create: `server/src/modules/mcp-gateway/providers/facebook/facebook-page-publishing.worker.ts`
- Modify: `server/src/modules/mcp-connections/mcp-connections.module.ts`

Worker polls every 15 seconds, claims up to five due posts, obtains the owner's Facebook OAuth credential, publishes once, and records success/failure. It catches and reports worker errors without exposing tokens.

### Task 5: Documentation and final validation

- Document migration application and Meta permission requirements.
- Run focused Jest specs, full server tests, server typecheck, and web typecheck/build if repository execution is available.
- Review all changes for credential leakage and duplicate-post risk.
- Open a stacked draft PR targeting the still-open PR #66 branch; PR #66 must merge before this MVP PR can merge to main.
