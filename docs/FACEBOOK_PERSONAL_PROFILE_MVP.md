# Facebook Personal Profile MVP

> **Priority override — 2026-11-13**
> This document supersedes the Page-first priority in FACEBOOK_INTEGRATION_PLAN.md for the next implementation milestone. Facebook Pages remain a later phase. This MVP concerns the user's own Facebook personal profile only.

## 1. Product goal

Build a safe Facebook Personal Connector for one user to connect their own Facebook account and let authorized AI clients read and search the content that Meta makes available, plus content the user explicitly imports from their Facebook archive.

The product must not promise unrestricted access to the personal News Feed, friends' private content, Messenger conversations, or programmatic personal-profile publishing. A Facebook ID is an identifier, not an access credential.

## 2. Non-negotiable safety and platform constraints

- Use Meta's official OAuth / Graph API flows only.
- Never ask for or store the user's Facebook password, browser cookies, session storage, local-storage tokens, or 2FA codes.
- Never automate browser login, imitate human browsing to scrape profile pages, rotate fingerprints/IPs to evade detection, or bypass checkpoints/rate limits.
- Keep App Secret and access tokens server-side, encrypted at rest, redacted from logs, and unavailable to AI tool outputs.
- Use least-privilege permissions. If Meta does not grant a permission, show a clear unsupported/permission-required state; do not silently fall back to scraping.
- No integration can guarantee that Facebook will never challenge, checkpoint, restrict, or disable an account. The design goal is to avoid risky unofficial login automation and comply with Meta's supported access model.

## 3. What "Facebook ID for AI" means

After official OAuth succeeds, call GET /me?fields=id,name and store the returned app-scoped Facebook User ID, display name, Meta App ID, granted scopes, token metadata, and connection status.

- The ID is app-scoped and should be treated as an identifier within this Meta app integration.
- The ID alone cannot authorize AI to read anything.
- AI calls Gateway tools; Gateway validates ownership and permissions, obtains credentials server-side, calls supported APIs, and returns only permitted/sanitized data.
- Never put access tokens into prompts, MCP tool arguments, browser storage, or user-visible logs.

## 4. Reality check: personal profile access

Meta's current Graph API Post documentation says a user access token can read posts created by the app on behalf of that user; a user's own posts may be read when the owner grants user_posts. That permission is restricted and requires Meta approval for eligible apps. Therefore ordinary OAuth consent does not guarantee access to the user's full timeline or feed.

The MVP must distinguish three data sources:

| Source | MVP behavior | Availability |
|---|---|---|
| Basic identity | Read /me identity and app-scoped ID | Subject to basic OAuth permissions |
| Personal posts via Graph API | Implement only behind a capability/feature gate; enable only if Meta grants user_posts to this app and live tests prove access | Restricted / approval-dependent |
| Facebook Download Your Information archive | User downloads their own archive from Facebook and uploads it to Gateway; parse and index supported JSON/HTML files | User-driven snapshot; not live sync |

Do not promise access to all feed items, friends' posts, private groups, private photos, or Messenger unless Meta explicitly exposes the exact data to this app and the user has granted the required access.

## 5. MVP capabilities and priority

### P0 — Connection and identity

- facebook_personal_connect: begin official OAuth.
- facebook_personal_connection_status: show connected/revoked/reauth-required and granted scopes.
- facebook_personal_get_identity: return app-scoped ID, name, and connection metadata (never token).
- facebook_personal_disconnect: revoke/delete stored connection credentials and associated sync state according to retention policy.

### P1 — AI-readable personal archive

- facebook_archive_upload: accept a user-provided Facebook Download Your Information archive.
- facebook_archive_import_status: report imported file categories, counts, skipped files, and errors.
- facebook_search_my_facebook_content: search only the connected user's imported/authorized content.
- facebook_get_my_facebook_content: retrieve a bounded set of matching records with timestamps and source references.
- facebook_summarize_my_facebook_activity: summarize the user's own imported/authorized history.

Support incremental re-import and deduplication using stable archive paths/record identifiers where available. Respect user deletion requests and define retention controls.

### P2 — Official API post reading (conditional)

- facebook_personal_list_posts and facebook_personal_get_post are enabled only when the app has the approved user_posts permission and the endpoint works for the connected account in production mode.
- Implement pagination, rate-limit handling, permission diagnostics, and data minimization.
- If permission is unavailable, return a clear message directing the user to archive import. Never switch to scraping.

### P3 — Limited profile actions

- AI may draft content locally.
- Any profile sharing/publishing must use a Meta-supported user-mediated flow, if available for the target content type, and the user must complete/confirm the action in Facebook.
- Do not promise background autopublishing, editing/deleting arbitrary personal posts, bulk friend actions, automated likes, or automated comments through the personal profile.

## 6. Suggested data model

| Table | Purpose |
|---|---|
| mcp_connections (provider=facebook) | User's official Meta OAuth connection, encrypted credential, scopes, expiry/status |
| facebook_personal_identities | App-scoped user ID, display name, Meta App ID, last verified timestamp |
| facebook_archive_imports | Import job, owner, archive metadata, status, counts, errors, retention |
| facebook_personal_content | Normalized records from archive or explicitly authorized API reads; source type and provenance |
| facebook_content_chunks | Search/index chunks linked to normalized records, if existing project search architecture requires them |

All records must be tenant/owner scoped. Keep original uploaded archive files private; scan/validate archive entries, enforce size and decompression limits, reject path traversal and unexpected executable content, and allow deletion. Avoid importing data categories the user did not select.

## 7. AI/MCP boundary

Expose task-oriented tools rather than raw Graph API access. Every read tool must:
1. Resolve the authenticated Gateway user.
2. Verify the Facebook connection belongs to that user.
3. Check the current scope/feature gate and source provenance.
4. Query only that user's authorized/imported data.
5. Return bounded results with timestamps and source type.
6. Audit the operation without logging tokens or unnecessary personal content.

AI must be told whether a result came from a live Graph API read or an archive snapshot and the archive's import date.

## 8. Acceptance criteria

- [ ] OAuth uses official Meta flow; no Facebook password/cookie/session is requested or stored.
- [ ] /me returns the connected user's app-scoped ID; ID is stored and shown without any token.
- [ ] Token and App Secret never appear in frontend payloads, tool outputs, logs, or prompts.
- [ ] Connection ownership and disconnect/revoke behavior are tested.
- [ ] Archive upload safely validates ZIP contents and supports documented Facebook export formats.
- [ ] AI can search/summarize only the connected user's imported/authorized records.
- [ ] Data provenance and snapshot timestamp are visible in tool results.
- [ ] Graph API personal-post reading remains disabled unless user_posts is approved and live-tested.
- [ ] No scraping, browser login automation, cookie reuse, or checkpoint bypass exists in source.
- [ ] Documentation clearly states that no implementation can guarantee an account will never be checkpointed or restricted.

## 9. Meta documentation references

- [Graph API Overview](https://developers.facebook.com/docs/graph-api/overview/)
- [Graph API Post reference](https://developers.facebook.com/docs/graph-api/reference/post/)
- [Graph API User reference](https://developers.facebook.com/docs/graph-api/reference/user/)
- [Meta Automated Data Collection Terms](https://www.facebook.com/legal/automated_data_collection_terms)

The current Post reference describes user_posts as the permission needed to read a user's posts and says access depends on the owner granting it. This is a restricted permission and must be verified in the app's actual permission review state; do not assume approval.
