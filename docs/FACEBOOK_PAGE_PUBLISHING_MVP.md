# Facebook Page Publishing MVP

This runtime is a stacked extension of PR #66 (Meta OAuth + Page discovery). It supports authenticated Facebook Page publishing only; it does not publish to personal profiles.

## Available MCP tools

| Tool | Purpose |
| --- | --- |
| `facebook_list_pages` | List Pages and available Page tasks; never returns Page tokens |
| `facebook_create_page_post_draft` | Save a text, image-URL, or video-URL draft after validating Page access |
| `facebook_approve_page_post_draft` | Explicitly approve a draft and queue it for immediate or scheduled publishing |
| `facebook_list_page_posts` | List drafts, scheduled items, published posts, failures, and manual-review items |

### Safe approval flow

1. Call `facebook_list_pages` and choose the Page ID.
2. Call `facebook_create_page_post_draft` with `pageId`, `message`, `mediaType` (`text`, `image`, or `video`), and `mediaUrl` for image/video.
3. Show the complete draft to the user.
4. Only after the user explicitly confirms, call `facebook_approve_page_post_draft` with `draftId`. Omit `scheduledAt` for immediate publishing, or provide a timezone-aware ISO-8601 timestamp between 2 minutes and 75 days in the future.
5. Use `facebook_list_page_posts` to monitor the result.

## Media constraints

- Image and video inputs must be publicly reachable HTTPS URLs. Meta fetches the media from that URL; the Gateway does not download it.
- Video uses the Page `/{page-id}/videos` edge with `file_url`. This MVP does not provide multipart/resumable uploads, Reels, carousels, or multi-image albums.
- The connected person must have the Page `CREATE_CONTENT` or `MANAGE` task.
- The Meta app must have the `pages_show_list`, `pages_read_engagement`, and `pages_manage_posts` permissions with the access level required by Meta App Review.

## Database and worker deployment

1. Apply `database/migrations/006_facebook_page_posts.sql` to the Gateway Supabase project.
2. Configure `META_APP_ID`, `META_APP_SECRET`, `META_FACEBOOK_LOGIN_CONFIG_ID`, and `META_GRAPH_API_VERSION` on the Gateway, then register the Facebook OAuth callback URL from PR #66 in the Meta App Dashboard.
3. Set `META_PAGE_PUBLISHING_WORKER_ENABLED=true` on the long-running NestJS Gateway service. The Meta Login for Business configuration must grant `pages_show_list`, `pages_read_engagement`, and `pages_manage_posts`. The worker polls every 15 seconds and claims up to five due posts per cycle.
4. Keep at least one long-running Gateway process alive. The worker is intentionally disabled by default.

The database claim uses `FOR UPDATE SKIP LOCKED` to prevent concurrent workers from claiming the same row. Publishing leases that expire are moved to `needs_review`, not retried automatically: a process may have crashed after Meta accepted a post but before the Gateway persisted the returned post ID. This avoids duplicate posts. Review the Page manually before creating a replacement.

Page access tokens are requested just-in-time from `/me/accounts`, used only in memory for the publish request, and are never stored in the post table, returned by MCP tools, or placed in query strings. The user OAuth credential remains encrypted in the existing Gateway connection store.
