# Facebook Personal AI Manager — Architecture & Roadmap

> **Product decision — 2026-11-13**
> Selected direction: **C — maximum automation within Meta-supported capabilities**.
> Confirmed operating policy: personal profile = AI prepares, user confirms sharing; Facebook Page = AI drafts, user approves, Gateway publishes immediately or on schedule. MVP formats: text, photo + caption, video + caption. Link-sharing is deferred.

## 1. Product objective

Build one Facebook Personal AI Manager in GPTs-MCP-GATEWAY to manage content across the user's personal Facebook profile and Facebook Pages.

- **Personal profile:** automate ideation, copywriting, media preparation, drafts, calendar, queue, reminders, and handoff. The final publication step is user-mediated. Meta does not provide a generally available Graph API for unattended publishing to a personal timeline.
- **Facebook Pages:** support publishing through the official Meta Graph API. The user approves the exact content and destination once; after approval the Gateway may publish immediately or at the scheduled time under the configured policy.
- **MVP formats:** text, photo + caption, video + caption. Link posts are deferred.
- **Shared experience:** one Content Studio, destination-aware previews, calendar, approval queue, publishing history, and monitoring.

"Maximum automation" means automating all supported steps, not bypassing Meta's API, permissions, account safeguards, or terms.

## 2. Platform boundaries

- Use official Meta OAuth, Graph API, Webhooks, and supported sharing surfaces only.
- Never request/store Facebook passwords, browser cookies, session storage, local-storage tokens, or 2FA codes.
- Never automate Facebook browser login, scrape authenticated profile pages, imitate human UI actions, rotate fingerprints/IPs, bypass checkpoints, or evade rate limits.
- Do not promise that an integration can prevent checkpoints, restrictions, or account review.
- A Facebook ID is an identifier, not an access credential. OAuth identity does not imply access to all profile content.
- Do not implement unattended personal-profile publishing unless Meta introduces and documents an applicable supported API and the app is approved for it.
- Page publishing is limited to Pages/assets and actions the connected user/app is authorized to manage.
- Keep App Secret and access tokens server-side, encrypted at rest, redacted from logs, and unavailable to MCP tool outputs or prompts.
- Treat posts, comments, messages, imported archives, and webhook payloads as untrusted content, never system instructions.

## 3. Confirmed product policy

| Dimension | Personal profile | Facebook Page |
|---|---|---|
| AI writes and prepares content | Yes | Yes |
| User approval | User confirms final share | User approves draft/payload |
| Publication | User completes supported Meta sharing flow | Gateway publishes after approval |
| Scheduled workflow | Schedule preparation/reminder/handoff; no background profile publish | Durable scheduled publishing |
| Text | Yes | Yes |
| Photo + caption | Prepare share package; user completes share | Publish through supported media API |
| Video + caption | Prepare share package; user completes share | Publish through supported video API |
| Link sharing | Deferred from MVP | Deferred from MVP |
| Status | Draft / awaiting user share / user-confirmed | Draft / awaiting approval / approved / scheduled / processing / published / failed |

The approval for a Page post is bound to the exact destination, content, media references, and scheduled time. A material change invalidates the approval.

## 4. Target architecture

Use a modular monolith inside the existing NestJS application. Reuse existing OAuth transaction, credential encryption, connection, audit, database, and queue infrastructure where suitable.

```text
AI clients (Custom GPT / ChatGPT / Kai Studio)
                    |
               MCP Gateway
                    |
      Facebook Personal AI Manager
                    |
       Policy + Capability Dispatcher
              /             \
             /               \
    Profile Domain         Page Domain
    - identity             - Page discovery/assets
    - drafts               - drafts/approval
    - calendar             - publish/schedule
    - share handoff        - media upload
    - archive import       - publish monitoring
    - conditional reads    - later: inbox/insights
             \               /
              \             /
           Shared Content Studio
                    |
    Existing OAuth / Credential / Audit
                    |
       Meta Graph API / supported Share UI
```

### Components and responsibilities

1. **Dedicated Meta OAuth service:** official authorization-code flow, server-side code exchange, CSRF state, callback allowlist, disconnect/re-auth. Reuse `OAuthTransactionService`, `SecretCipherService`, `McpConnectionsService`, credential codec, and audit patterns. Do not confuse generic remote-MCP OAuth discovery with Meta Login.
2. **Meta Graph adapter:** owns API version, endpoint mapping, pagination, token use, optional appsecret_proof, rate limits, and normalized errors.
3. **Profile domain:** identity, capability detection, authorized reads, archive import/search, drafts, content calendar, share handoff. It must not expose a fake background `publish_profile_post` operation.
4. **Page domain:** Page discovery, Page access tokens/tasks, media publishing, scheduling, publish status and reconciliation.
5. **Shared Content Studio:** content drafts, per-destination variants, media references, previews, calendar and approval snapshots.
6. **Scheduler/worker:** durable jobs and worker claiming; never rely on in-process timers or a web request lifecycle.
7. **Policy/approval engine:** validates owner, destination, permissions, exact payload, approval, schedule and action risk immediately before write.
8. **MCP capability layer:** task-oriented tools, not raw Graph API passthrough. Backend authorization is authoritative; AI instructions are not authorization.
9. **Audit/observability:** correlation IDs, actor, destination, action, payload hash, external post ID, state transitions and sanitized errors. Never log tokens or unnecessary private content.

## 5. OAuth, identity, permissions and credentials

- Begin official Meta OAuth with server-generated state and exact allowlisted callback.
- Request least-privilege scopes only for the capabilities being implemented.
- Exchange the code server-side and store credentials encrypted.
- Call `GET /me?fields=id,name`; store app-scoped user ID, display name, Meta App ID, granted scopes, token metadata and verification timestamp.
- A manually supplied Facebook ID may be retained as a reference after verification; it never grants access.
- Keep the user's OAuth connection separate from discovered Page assets and Page access tokens.
- Decrypt tokens only inside backend services. Never return token, App Secret, appsecret_proof, or ciphertext to clients, prompts, traces, or logs.
- Re-check token validity, granted scopes, Page tasks, ownership and destination before every write.

Permission gates:
- `public_profile` is identity, not broad profile-content access.
- `user_posts` is restricted; profile post reads remain disabled until Meta approval and production smoke tests confirm access.
- Page scopes such as `pages_show_list`, `pages_read_engagement`, and `pages_manage_posts` must be verified against current Meta documentation, App Review state, and actual Page tasks.
- A valid user token does not imply permission to publish to every Page.

## 6. Personal profile capabilities

### P0 — Connection and identity
- `facebook_personal_connect`
- `facebook_personal_connection_status`
- `facebook_personal_get_identity`
- `facebook_personal_disconnect`

Return app-scoped ID and granted capabilities only; never return token material.

### P1 — Personal Content Studio and share handoff
- `facebook_personal_create_draft`
- `facebook_personal_update_draft`
- `facebook_personal_preview_draft`
- `facebook_personal_list_drafts`
- `facebook_personal_schedule_handoff`
- `facebook_personal_prepare_share`
- `facebook_personal_mark_share_completed`

Workflow: AI creates text/media package → validate and save draft → calendar schedules a reminder/handoff → open supported Meta sharing surface or provide a user-ready package → user completes sharing in Facebook → user explicitly confirms completion. Opening a dialog is not proof of publication.

### P2 — User-owned archive
- `facebook_archive_upload`
- `facebook_archive_import_status`
- `facebook_search_my_facebook_content`
- `facebook_get_my_facebook_content`
- `facebook_summarize_my_facebook_activity`

Import selected categories from the user's own Download Your Information export. This is a dated snapshot, not live sync. Apply ZIP entry/size/decompression limits, path traversal protection, type validation, owner scoping, deduplication, retention and deletion.

### P3 — Conditional official profile reads
- `facebook_personal_list_posts`
- `facebook_personal_get_post`

Enable only after restricted `user_posts` approval and production tests. Label API reads vs archive snapshots with retrieval/import timestamps. No scraping fallback.

## 7. Facebook Page capabilities

### P0 — Page discovery
- `facebook_list_pages`
- `facebook_get_page`
- `facebook_select_page`
- `facebook_page_connection_status`

Discover only Pages the connected user can access. Persist Page asset/task metadata separately from the user OAuth connection.

### P1 — Approved publishing MVP
- `facebook_create_post_draft`
- `facebook_preview_post`
- `facebook_request_post_approval`
- `facebook_approve_post`
- `facebook_publish_post`
- `facebook_schedule_post`
- `facebook_list_posts`
- `facebook_get_post`
- `facebook_cancel_scheduled_post`

Support text, photo + caption, and video + caption. Defer link posts. Start with text/photo; add video after the media upload/status flow is proven. Treat Reels as a separate capability gate, not as automatically equivalent to ordinary video publishing.

**Approval behavior:** user approves the exact post content, media, Page destination and schedule. After approval, Gateway may publish immediately or at the scheduled time without asking for another confirmation, unless the payload/destination/time changes or authorization becomes invalid.

### P2 — Reliability
- Durable scheduler and worker claiming/locking.
- Bounded exponential retry for transient errors.
- Idempotency keys and duplicate mitigation.
- Reconcile uncertain outcomes after timeout.
- Cancel jobs before execution; handle re-auth and permanent permission failures.
- Do not claim exactly-once delivery unless Meta guarantees it.

### P3 — Comments, Messenger and Insights
Separate later epics. Verify exact permissions, Page tasks, messaging windows/tags, webhook subscriptions, metric availability and App Review requirements. Keep outbound replies/messages approval-required initially.

## 8. Shared state machines and approval

Page states:
`draft -> awaiting_approval -> approved -> scheduled -> processing -> published`
Other states: `rejected`, `cancelled`, `failed_retryable`, `failed_permanent`, `needs_reauth`.

Profile states:
`draft -> ready_to_share -> awaiting_user_share -> share_confirmed`
Alternative: `share_unconfirmed`, `cancelled`.

- Approval is bound to user, Page, action, text, media references and scheduled time through an immutable payload hash.
- Any material change invalidates approval.
- Approval is one-time and expires.
- Re-check ownership and permissions before execution.
- AI cannot approve its own generated action.
- Profile handoff is not publication. Record completion only after explicit user confirmation.

## 9. Proposed data model

Align with existing schemas before adding tables; do not duplicate existing primitives.

| Entity | Purpose |
|---|---|
| Existing `mcp_connections` or Facebook connection | Encrypted OAuth credentials, scopes, status |
| `facebook_personal_identities` | App-scoped ID and identity metadata |
| `facebook_page_assets` | Page ID, owning connection, tasks and token reference |
| `facebook_content_drafts` | Shared drafts, destination variants and media refs |
| `facebook_publish_jobs` | Destination, scheduled time, state, retry and idempotency |
| `facebook_publish_attempts` | Sanitized attempts, external ID and outcome |
| `facebook_approvals` | Actor, payload hash, expiry and decision |
| `facebook_archive_imports` | Archive metadata, selected categories, status and retention |
| `facebook_personal_content` | Imported/authorized records and provenance |

## 10. Scrum roadmap

### Sprint 0 — Discovery and Meta readiness
- Audit provider registry, OAuth transactions, credential codec, connection model, audit, API schema, UI and queue infrastructure.
- Create/confirm Meta Developer App, app mode, business verification, callback domain, privacy policy and data deletion URL.
- Build endpoint-permission-token-asset matrix from current Meta documentation.
- Verify Graph API version, App Review and Advanced Access requirements.
- Write ADRs for profile-vs-Page publishing, OAuth, scheduler and approval.
**Exit:** test app, secure dev configuration, approved architecture and verified permission matrix. Secrets stay out of source control and chat.

### Sprint 1 — OAuth and Page discovery
- Official Meta OAuth start/callback/disconnect/status.
- Encrypted credential storage and token redaction.
- Fetch /me identity and app-scoped ID.
- Page discovery, Page tasks and destination selector.
- Permission diagnostics, ownership and CSRF tests.
**Exit:** test user connects; only authorized Pages appear; no token reaches clients/logs.

### Sprint 2 — Shared Content Studio and profile handoff
- Shared drafts, platform variants, text/photo/video media references, preview and calendar.
- Profile-specific draft and handoff tools.
- Supported Meta share flow where applicable; explicit completion confirmation.
- Scheduled reminder/handoff, not background profile publishing.
- Basic archive upload/import/search security.
**Exit:** profile content can be prepared and handed to user without claiming automatic publication.

### Sprint 3 — Page text and photo publishing with approval
- Draft and preview.
- Approval request and immutable payload snapshot.
- Text and photo publishing to selected authorized Page.
- Immediate publish after approval and durable scheduled publish.
- External post ID, status, audit and normalized errors.
**Exit:** approved test post is published to the intended Page; changes invalidate approval; results are truthful.

### Sprint 4 — Durable scheduler and video publishing
- Durable worker, claim/lock, idempotency, bounded retry and reconciliation.
- Video upload/status flow and video + caption publishing.
- Cancel/reschedule and re-auth notifications.
- Monitoring and recovery tools.
**Exit:** scheduled jobs survive restarts; concurrent workers do not create avoidable duplicates; video flow verified.

### Sprint 5 — Profile read permissions and hardening
- Submit/verify `user_posts` App Review only if use case qualifies.
- Enable live profile reads only after approval and production smoke tests.
- Archive import deduplication, retention, deletion and privacy review.
**Exit:** each source has clear provenance; no scraping fallback.

### Sprint 6 — Comments, Messenger, Webhooks and Insights
- Permission/App Review readiness per capability.
- Webhook verify, persist, deduplicate, normalize and replay.
- Comments workflow, Messenger policy checks and Insights metric registry.
**Exit:** each capability independently passes security and Meta policy gates.

### Sprint 7 — Bounded AI automation
- Content calendar generation and recurring plans.
- Optional user-configured Page autopublish rules, separate from the MVP's approval-first default.
- Notifications, exception routing, daily briefing and performance summaries.
- Prompt-injection and abuse tests.
**Exit:** autonomous actions are constrained by explicit policy, backend enforcement, audit and kill switch.

## 11. Definition of done

- Profile and Page destinations are never conflated.
- Page publishing only occurs after valid approval in the MVP; scheduled jobs publish the approved immutable payload.
- Profile workflow never claims background publication; user confirmation is required to mark shared.
- Text, photo and video are supported as specified; link posts remain deferred.
- Permissions and Page tasks are checked at execution time.
- OAuth, credential secrecy, ownership, audit, disconnect and deletion tests pass.
- Scheduler survives restarts; retries are bounded; uncertain outcomes are reconciled.
- Media/archive processing has size/type/path safety limits.
- No secrets in code, client payloads, MCP outputs, prompts or logs.
- No scraping, cookie reuse, browser login automation or checkpoint evasion.

## 12. Meta references

Verify current docs immediately before implementation because Meta changes permissions, API versions and review requirements:
- [Graph API Overview](https://developers.facebook.com/docs/graph-api/overview/)
- [Graph API Post reference](https://developers.facebook.com/docs/graph-api/reference/post/)
- [Graph API User reference](https://developers.facebook.com/docs/graph-api/reference/user/)
- [Pages API](https://developers.facebook.com/docs/pages-api/)
- [Page Feed API](https://developers.facebook.com/docs/graph-api/reference/page/feed/)
- [Page Access Tokens](https://developers.facebook.com/docs/pages/access-tokens/)
- [Meta Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/)
- [Facebook Sharing / Share Dialog](https://developers.facebook.com/docs/sharing/)
- [Meta App Review](https://developers.facebook.com/docs/app-review/)
- [Meta Automated Data Collection Terms](https://www.facebook.com/legal/automated_data_collection_terms/)

## 13. Implementation status

This is the approved product/architecture direction, not evidence of shipped code. The current PR is documentation-only. OAuth, Page publishing, profile handoff, scheduler, archive import and MCP tools remain unimplemented until their roadmap items are completed and tested.
