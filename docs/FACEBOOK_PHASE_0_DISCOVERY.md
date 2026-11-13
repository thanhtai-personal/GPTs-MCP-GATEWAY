# Phase 0 — Khảo sát kỹ thuật và chốt thiết kế Facebook

> **Trạng thái:** Hoàn tất khảo sát source và tài liệu công khai; chờ cấu hình Meta App để chạy kiểm thử live.  
> **Ngày khảo sát:** 2026-11-13  
> **Repository baseline:** nhánh \`main\` tại thời điểm khảo sát  
> **Phạm vi:** Facebook Pages; không bao gồm Facebook cá nhân, Instagram hoặc nền tảng khác.

Tài liệu này ghi nhận kết quả Phase 0 của kế hoạch [Facebook Integration Plan](./FACEBOOK_INTEGRATION_PLAN.md). Đây là tài liệu discovery/architecture decision, không phải bằng chứng rằng Facebook integration đã được triển khai.

---

## 1. Kết luận điều hành

### Quyết định kiến trúc

1. Dùng **Meta Graph API v27.0** làm baseline tại ngày khảo sát; version phải cấu hình tập trung và nâng cấp có kiểm thử.
2. Dùng **Facebook Login for Business** làm hướng xác thực chính vì MCP Gateway hướng tới quản lý tài sản Page của khách hàng/doanh nghiệp, không chỉ một Facebook cá nhân.
3. Tạo **Facebook OAuth service chuyên biệt**. Không ép Facebook vào generic Remote MCP OAuth discovery flow.
4. Bổ sung một **native Facebook provider adapter** vào Provider Registry. Adapter gọi Graph API trực tiếp và tự cung cấp danh sách capability/tool của Gateway; không proxy một MCP server bên ngoài.
5. Dùng \`mcp_connections\` làm credential connection cấp user; tạo bảng riêng cho Page assets, metadata và token Page được mã hóa. Không đưa Page access token ra browser/GPT/log.
6. MVP đầu tiên nên là **kết nối → Page discovery → đọc trạng thái/quyền → draft → duyệt → đăng text/link/photo**.
7. Messenger, Webhooks, Insights và automation nền phải đi theo phase riêng, vì có permission, Page task và điều kiện sử dụng khác nhau.

### Phân biệt hai loại token cần đánh giá

Meta mô tả hai mô hình Facebook Login for Business:

- **User access token:** phù hợp thao tác có người dùng trực tiếp yêu cầu, ví dụ người dùng soạn nội dung và bấm đăng.
- **Business Integration System User access token:** phù hợp tác vụ tự động/server-to-server không cần người dùng thao tác mỗi lần; yêu cầu Tech Provider/business portfolio setup và cấu hình tài sản của doanh nghiệp khách hàng.

Đề xuất:
- Dùng User access token cho proof-of-concept và MVP publishing có người dùng duyệt/xác nhận.
- Thiết kế credential abstraction để có thể bổ sung System User token sau khi xác minh quy trình Tech Provider và kiểm thử endpoint Pages thực tế.
- Không tuyên bố scheduler tự động chạy dài hạn không cần tái xác thực trước khi hoàn tất PoC System User token hoặc kiểm chứng vòng đời Page token.

Meta xác nhận Facebook Login for Business dành cho tech provider xây giải pháp trên business tools; ứng dụng phải là Business type app. Để phục vụ doanh nghiệp không thuộc sở hữu/quản lý của nhà phát triển, ứng dụng cần Advanced Access được duyệt. [Nguồn Meta](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business).

---

## 2. Kết quả khảo sát repository

Đã đọc các thành phần source trên nhánh \`main\`:

| Thành phần | File | Kết quả |
|---|---|---|
| Provider contract | \`server/src/modules/mcp-gateway/providers/mcp-provider.types.ts\` | Hỗ trợ OAuth credential và optional \`refreshCredential\` |
| Provider registry | \`server/src/modules/mcp-gateway/providers/mcp-provider.registry.ts\` | Registry tường minh, kiểm tra trùng provider ID |
| Provider registration | \`server/src/modules/mcp-connections/mcp-connections.module.ts\` | Inject adapter qua \`MCP_PROVIDER_ADAPTERS\`; phải đăng ký Facebook tại đây |
| OAuth controller | \`server/src/modules/mcp-connections/mcp-connections.controller.ts\` | Có generic OAuth route và Google Workspace route chuyên biệt |
| Connection service | \`server/src/modules/mcp-connections/mcp-connections.service.ts\` | Lưu connection theo user/provider; có refresh hook cho adapter |
| OAuth service | \`server/src/modules/mcp-connections/mcp-oauth.service.ts\` | OAuth discovery cho Remote MCP; không tương thích nguyên trạng với Facebook Login for Business |
| OAuth transaction | \`server/src/modules/mcp-connections/oauth-transaction.service.ts\` | Nonce ngẫu nhiên, lưu hash, TTL, consume một lần và ràng buộc user/provider |
| Credential codec | \`server/src/modules/mcp-connections/mcp-credential-codec.service.ts\` | Version 1 cho API key, version 2 cho OAuth JSON; mã hóa qua SecretCipherService |
| Google OAuth precedent | \`server/src/modules/mcp-connections/google-workspace-oauth.service.ts\` | Tiền lệ cho provider có OAuth flow riêng |
| Audit | \`server/src/modules/audit/audit.service.ts\` | Có event metadata, không nên đưa token/payload nhạy cảm vào audit |
| Connection UI | \`web/src/modules/mcp-connections/presentation/McpConnectionsPanel.tsx\` | Provider catalog động từ backend |
| OAuth UI | \`web/src/modules/mcp-connections/presentation/OAuthConnectionForm.tsx\` | Generic OAuth start; Facebook cần special flow hoặc strategy riêng |
| OAuth completion | \`web/src/modules/mcp-connections/presentation/McpOAuthCompletePage.tsx\` | Có thể tái sử dụng handoff UI nếu hợp đồng callback tương thích |

### 2.1 Những gì có thể tái sử dụng

- Supabase user authentication.
- OAuth transaction storage và one-time browser nonce.
- SecretCipherService và server-side encryption.
- mcp_connections ownership pattern.
- Provider Registry và MCP tool discovery/call boundary.
- AuditService.
- Provider catalog API và connection panel pattern.
- Error mapping conventions và upstream timeout configuration.

### 2.2 Những gì cần bổ sung/thay đổi

- Facebook Login for Business configuration và callback flow riêng.
- Meta App ID, App Secret, Login Configuration ID và Graph API version trong server config.
- Native Graph API client có timeout, pagination, appsecret_proof và error normalization.
- Facebook credential/token lifecycle, bao gồm trao đổi user token dài hạn theo quy trình Meta và reconnect.
- Page asset store, Page task/permission snapshot và Page token encryption.
- Facebook provider adapter/capability catalog.
- Frontend flow chọn Page và trạng thái quyền Page.
- Webhook receiver, scheduler/worker, approval và domain data ở các phase sau.

### 2.3 Lý do không tái sử dụng nguyên generic OAuth service

Generic \`McpOAuthService\`:
- Lấy OAuth protected-resource metadata.
- Discover authorization server metadata.
- Có thể dùng dynamic client registration.
- Trao đổi code theo hợp đồng MCP OAuth và refresh token chuẩn.

Facebook Login for Business:
- Dùng Business-type Meta App và Login Configuration.
- Login dialog được cấu hình qua \`config_id\`.
- Với System User access token, Meta mô tả authorization-code grant và server-to-server code exchange.
- Token exchange dùng endpoint Meta Graph API, App ID và App Secret; không dựa trên OAuth protected-resource discovery/DCR của Remote MCP.
- User token có quy trình trao đổi riêng để lấy long-lived token; không được giả định luôn có \`refresh_token\` chuẩn.

Vì vậy, Facebook cần service riêng. Có thể tái sử dụng \`OAuthTransactionService\` để bảo vệ state/browser binding và \`SecretCipherService\` để mã hóa state/token, nhưng phải triển khai đúng protocol Meta.

---

## 3. Meta platform findings

### 3.1 API version

- Meta Graph API docs hiện hiển thị latest version **v27.0**.
- Page Feed endpoint cũng đang hiển thị v27.0.
- Cấu hình đề xuất: \`META_GRAPH_API_VERSION=v27.0\`.
- Không hardcode version trong nhiều adapter/service.
- Trước mỗi lần nâng version phải rà soát changelog, endpoint reference, permissions và chạy contract tests.

Nguồn:
- [Graph API](https://developers.facebook.com/docs/graph-api/)
- [Page Feed](https://developers.facebook.com/docs/graph-api/reference/page/feed/)

### 3.2 Facebook Login for Business

Meta mô tả Facebook Login for Business là hướng xác thực/ủy quyền ưu tiên cho tech provider xây tích hợp với business tools.

Yêu cầu/cấu hình chính:
- Meta App loại Business.
- Thêm Facebook Login for Business.
- Tạo Login Configuration.
- Chọn token type phù hợp: User access token hoặc Business Integration System User access token.
- Chọn assets và permissions cần thiết.
- Dùng configuration ID trong login dialog.
- Callback URL phải khớp cấu hình trong Meta App.
- Tất cả permission được yêu cầu phải được người dùng cấp.
- Ứng dụng phục vụ doanh nghiệp không thuộc sở hữu/quản lý của nhà phát triển cần Advanced Access qua App Review.
- Advanced Access có yêu cầu ongoing review theo chính sách Meta.

Nguồn: [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business).

### 3.3 Token model

Không được coi User token và Page token là một loại credential:

- User access token đại diện người dùng đã cấp quyền.
- Page access token dùng để thao tác với tư cách Page; Page Feed publishing yêu cầu Page access token.
- Business Integration System User token là một mô hình khác, gắn với Business Portfolio và asset được chỉ định.

Với MVP User-token flow, cần:
1. Nhận token qua flow Meta.
2. Trao đổi token theo hướng dẫn Meta khi đủ điều kiện.
3. Lấy danh sách Page và Page access token từ API Page accounts.
4. Chỉ lưu Page assets mà user đã cấp quyền.
5. Mã hóa Page token ở backend nếu lưu; tuyệt đối không trả token cho frontend/GPT.
6. Theo dõi expiry, data-access expiry, scopes/granular scopes và lỗi invalidation.
7. Khi user mất task, gỡ app hoặc token bị invalid, chuyển connection/Page sang trạng thái cần kết nối lại.

Không hardcode thời hạn token theo giả định “vĩnh viễn”. Lấy expiry/debug metadata từ Meta và xử lý trường hợp token bị vô hiệu hóa trước thời hạn.

Nguồn:
- [Meta Access Tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens)
- [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business)
- [Debug Token](https://developers.facebook.com/docs/graph-api/reference/debug_token)

### 3.4 Page publishing

Page Feed v27.0 xác nhận:
- API hỗ trợ New Pages Experience.
- Đăng bài yêu cầu Page access token.
- Người cấp token cần Page task \`CREATE_CONTENT\`.
- Permission gồm \`pages_manage_posts\`, \`pages_read_engagement\`, \`pages_show_list\`.
- Feed endpoint nhận \`message\` hoặc \`link\`; media khác có endpoint/flow riêng.

Nguồn: [Page Feed](https://developers.facebook.com/docs/graph-api/reference/page/feed/).

### 3.5 Comments

- Đọc comments cần cùng permission như parent object.
- Muốn lấy comment ID trên Page post, cần Page task \`MODERATE\` trong trường hợp Meta quy định.
- Publish/reply comment yêu cầu Page access token của người có task \`MODERATE\` và permission \`pages_manage_engagement\`.
- Phải kiểm tra \`can_comment\` trước khi reply.
- Không giả định tất cả comment đều có thể phản hồi hoặc đọc đầy đủ.

Nguồn: [Comments endpoint](https://developers.facebook.com/docs/graph-api/reference/object/comments).

### 3.6 Messenger

Page Messages endpoint dùng để gửi tin nhắn từ Page cho khách hàng trong phản hồi một tin nhắn đã nhận. Không coi đây là công cụ gửi tin hàng loạt.

- Permission nền tảng: \`pages_messaging\`.
- Cần kiểm tra Page task \`MESSAGING\` và các permission/điều kiện của Conversation/Webhooks endpoint tương ứng.
- Cửa sổ phản hồi tiêu chuẩn là 24 giờ; các tag ngoại lệ phải đúng use case và policy.
- Human Agent không phải cách lách giới hạn quảng cáo; chỉ sử dụng trong trường hợp hỗ trợ con người được Meta cho phép.

Nguồn:
- [Page Messages](https://developers.facebook.com/docs/graph-api/reference/page/messages)
- [Messenger Platform](https://developers.facebook.com/docs/messenger-platform/)

### 3.7 Insights

Page Insights v27.0 có các giới hạn cần đưa vào sản phẩm:
- Chỉ khả dụng với Page đạt ngưỡng 100 likes theo tài liệu hiện tại.
- Phần lớn metric cập nhật khoảng mỗi 24 giờ.
- Dữ liệu lịch sử tối đa hai năm.
- Mỗi truy vấn \`since/until\` tối đa 90 ngày.
- Một số metric đã bị deprecate từ 15-06-2026.
- Page task \`ANALYZE\`.
- Permission \`read_insights\` và \`pages_read_engagement\`.

Nguồn: [Page Insights](https://developers.facebook.com/docs/graph-api/reference/insights/).

### 3.8 Webhooks

- Cần HTTPS endpoint có chứng thư TLS hợp lệ.
- Cấu hình object và field subscription cụ thể.
- Meta ký payload với SHA-256 trong header \`X-Hub-Signature-256\`; backend phải xác minh HMAC bằng App Secret trước khi tin payload.
- Meta có thể retry notification; phải deduplicate.
- Webhooks product tự nó không yêu cầu App Review, nhưng permission liên quan vẫn quyết định event có được gửi ở Live mode hay không.
- Page webhook subscription yêu cầu Page admin có task \`MODERATE\` cấp quyền \`pages_manage_metadata\` theo reference.

Nguồn:
- [Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/)
- [Webhooks Reference](https://developers.facebook.com/docs/graph-api/webhooks/reference)

---

## 4. Permission và Page task matrix

Đây là ma trận thiết kế sơ bộ, không phải lời khẳng định rằng mọi endpoint đều chỉ cần đúng các permission được liệt kê. Phải kiểm tra lại từng endpoint và App Dashboard trước khi submit App Review.

| Capability | Permission chính | Page task / điều kiện |
|---|---|---|
| Liệt kê Page | \`pages_show_list\` | User có quyền trên Page; xác minh task thực tế |
| Đọc Page Feed | \`pages_read_engagement\`, \`pages_read_user_content\` | Theo endpoint: CREATE_CONTENT, MANAGE hoặc MODERATE |
| Đăng text/link post | \`pages_manage_posts\`, \`pages_read_engagement\`, \`pages_show_list\` | CREATE_CONTENT |
| Đăng ảnh/video | \`pages_manage_posts\`; video có thể cần \`publish_video\` theo endpoint | CREATE_CONTENT |
| Đọc comments | Permission của parent object, thường gồm \`pages_read_engagement\` và \`pages_read_user_content\` | MODERATE để truy cập comment IDs trong trường hợp được quy định |
| Reply comment | \`pages_manage_engagement\` | MODERATE; Page access token |
| Messenger | \`pages_messaging\` | MESSAGING; thêm permission/điều kiện endpoint cụ thể |
| Page Webhooks | \`pages_manage_metadata\` | Page admin/MODERATE cấp subscription |
| Page Insights | \`read_insights\`, \`pages_read_engagement\` | ANALYZE; Page đạt điều kiện Insights |

### Permission strategy

- Không xin tất cả permission ngay ở lần đăng nhập đầu nếu chưa bật các chức năng tương ứng.
- Chia consent/use-case theo nhóm capability nếu Meta configuration cho phép.
- MVP ưu tiên: \`pages_show_list\`, \`pages_read_engagement\`, \`pages_manage_posts\`; chỉ thêm \`pages_read_user_content\` nếu MVP cần đọc nội dung do người dùng đăng/comment.
- Giai đoạn comment: thêm \`pages_manage_engagement\` và quyền đọc cần thiết.
- Giai đoạn Insights: thêm \`read_insights\`.
- Giai đoạn Messenger/Webhooks: thêm \`pages_messaging\`, \`pages_manage_metadata\` và các permission endpoint cụ thể.
- Không xin \`business_management\` mặc định; chỉ xin khi Business Portfolio/System User flow hoặc endpoint thực tế yêu cầu.

---

## 5. Target architecture decisions

### ADR-FB-001 — Native Meta Graph API adapter

**Quyết định:** Facebook được triển khai như first-party native adapter, không phải Remote MCP provider proxy.

Lý do:
- Gateway kiểm soát capability names/schema.
- Không phụ thuộc MCP server bên thứ ba hoặc catalog tool upstream thay đổi.
- Có thể thực thi policy, approval, Page validation và idempotency ở domain service.
- Dễ chuẩn hóa lỗi Graph API và versioning.

Adapter vẫn tuân thủ contract hiện tại:
- \`id\`
- \`displayName\`
- \`credential\`
- \`testConnection\`
- \`listTools\`
- \`callTool\`
- optional \`refreshCredential\`

Provider ID đề xuất: \`facebook\`.

### ADR-FB-002 — Dedicated Facebook OAuth

**Quyết định:** Tạo Facebook OAuth service riêng, không dùng generic MCP OAuth discovery.

Tái sử dụng:
- \`OAuthTransactionService\` cho user binding, browser nonce, TTL và one-time consume.
- \`SecretCipherService\` cho state và credential encryption.
- \`McpConnectionsService\` nếu mở rộng được public save/connect method an toàn.
- Google Workspace OAuth service làm mẫu về route/controller separation.

Yêu cầu:
- State ngẫu nhiên/được bảo vệ, gắn user và provider.
- Browser nonce hash, one-time consume.
- Callback allowlist và redirect URI cố định.
- App Secret chỉ tồn tại server-side.
- Không ghi code/token vào log.
- Token exchange chỉ thực hiện từ backend.
- Không gửi token về browser hoặc AI client.

### ADR-FB-003 — User connection và Page assets tách biệt

**Quyết định:** \`mcp_connections\` lưu credential kết nối Facebook của user; Page là asset riêng.

Mô hình logic đề xuất:

\`\`\`
app_users
   |
   +--- mcp_connections (provider = facebook)
              |
              +--- facebook_pages
                        |
                        +--- posts / comments / conversations
\`\`\`

Bảng dự kiến:
- \`facebook_pages\`: user_id, connection_id, external_page_id, name, category, tasks, permission snapshot, status, synced_at.
- Page token ciphertext/version: lưu tách biệt trong bảng Page asset hoặc credential vault liên kết; không trả qua API view.
- Các bảng posts/schedules/comments/messages/insights chỉ được thêm khi phase tương ứng triển khai.

Không dùng external Page ID làm internal primary key. Cần unique constraint phù hợp theo owner/connection + external Page ID.

### ADR-FB-004 — Không đưa Page token vào GPT context

Mọi capability nhận Page ID, không nhận access token.
Backend:
1. Xác minh user sở hữu connection.
2. Xác minh Page thuộc connection và trạng thái được cấp quyền.
3. Lấy/decrypt Page token server-side.
4. Gọi Graph API.
5. Sanitize output và audit.

Nếu chọn cách lấy Page token on-demand từ User token thay vì lưu, phải bảo đảm mọi lần lấy đều kiểm tra pagination, Page ownership và task; so sánh hiệu năng/rate limit trong PoC. Quyết định cuối về lưu token cần được chốt trước Phase 1.

### ADR-FB-005 — Capability-first tool surface

Tên capability dự kiến:
- \`facebook_connection_status\`
- \`facebook_list_pages\`
- \`facebook_get_page\`
- \`facebook_create_post_draft\`
- \`facebook_preview_post\`
- \`facebook_publish_post\`
- \`facebook_schedule_post\`
- \`facebook_list_posts\`
- \`facebook_list_comments\`
- \`facebook_reply_comment\`
- \`facebook_list_conversations\`
- \`facebook_send_message\`
- \`facebook_get_page_insights\`

Tên cuối và schema sẽ được chuẩn hóa trong Phase 1/2. Không expose raw Graph API endpoints thành một bộ tool tùy ý.

### ADR-FB-006 — Scheduler không dùng in-memory timer

- PostgreSQL là nguồn dữ liệu lịch đăng.
- Worker claim job bằng transaction/locking an toàn.
- Approval phải gắn payload hash, Page, action và thời điểm.
- Retry có giới hạn; không retry lỗi permission/token hết hạn vô hạn.
- Sau timeout không rõ kết quả, reconciliation trước khi gửi lại để tránh duplicate.
- Có trạng thái needs_reauth và failed_permanent.

Worker implementation được để Phase 3, nhưng schema/contract cần được tính đến ngay từ Phase 1.

---

## 6. Cấu hình môi trường dự kiến

Tên biến đề xuất; chưa thêm vào source ở Phase 0:

| Environment variable | Mục đích | Secret? |
|---|---|---|
| \`META_APP_ID\` | Meta App ID | Không phải secret, nhưng chỉ server config |
| \`META_APP_SECRET\` | Meta App Secret | **Có** |
| \`META_FACEBOOK_LOGIN_CONFIG_ID\` | Facebook Login for Business Configuration ID | Không |
| \`META_GRAPH_API_VERSION\` | Graph API version, default v27.0 | Không |
| \`META_OAUTH_REDIRECT_URI\` | Callback URI nếu không suy ra từ public base URL | Không |
| \`META_APP_SECRET_PROOF_ENABLED\` | Bật appsecret_proof cho server calls | Không |

Không gửi App Secret/token qua chat, issue, PR, source code hoặc frontend environment. Cấu hình secret trực tiếp trong secret manager của môi trường server (ví dụ Vercel/Koyeb/self-hosted environment).

Callback dự kiến nếu dùng route theo MCP connections:

\`\`\`text
<GATEWAY_PUBLIC_BASE_URL>/api/v1/mcp-connections/facebook/oauth/callback
\`\`\`

URL thực tế phải được xác nhận theo route được triển khai và khai báo chính xác trong Meta App Dashboard.

---

## 7. Test strategy và PoC checklist

### 7.1 App setup

- [ ] Xác định Meta Business Portfolio của chủ ứng dụng.
- [ ] Tạo/chọn Meta Business type App chuyên dụng cho Gateway.
- [ ] Thêm Facebook Login for Business.
- [ ] Tạo Login Configuration cho User access token để thử MVP.
- [ ] Xác định cấu hình System User token và Tech Provider prerequisites cho automation dài hạn.
- [ ] Khai báo callback URL HTTPS.
- [ ] Thêm app roles cho tester/admin.
- [ ] Thêm Page test và cấp đúng task cho tài khoản tester.
- [ ] Lưu App ID/Secret/Configuration ID trong secret manager.

### 7.2 OAuth smoke test

- [ ] Login thành công với app role.
- [ ] State sai bị từ chối.
- [ ] State hết hạn bị từ chối.
- [ ] Callback từ user khác bị từ chối.
- [ ] Browser nonce sai hoặc dùng lại bị từ chối.
- [ ] Code không thể exchange lần hai.
- [ ] App Secret không xuất hiện trong frontend/network response.
- [ ] Token exchange response được parse và lưu mã hóa.
- [ ] Token debugger xác nhận đúng app_id, user_id, token type, expiry và scopes.
- [ ] Thiếu permission được báo chính xác, không ghi token vào error.

### 7.3 Page access smoke test

- [ ] Liệt kê Page được cấp qua Graph API Explorer.
- [ ] Xử lý pagination.
- [ ] Lưu Page ID, tên và tasks.
- [ ] Page không được user grant không xuất hiện.
- [ ] User không có CREATE_CONTENT không được publish.
- [ ] User không có MODERATE không được comment moderation.
- [ ] User không có ANALYZE không được query Insights.
- [ ] Gỡ quyền Page hoặc revoke app thì thao tác tiếp theo bị từ chối/re-auth.

### 7.4 Graph API smoke test

- [ ] GET Page basic fields.
- [ ] GET Page Feed với permission/task phù hợp.
- [ ] POST test text/link post trên Page test (chỉ sau khi chủ Page duyệt).
- [ ] Kiểm tra Page token bắt buộc cho publishing.
- [ ] Kiểm tra appsecret_proof.
- [ ] Kiểm tra invalid token, missing permission, Page task missing, rate limit, malformed response và timeout.
- [ ] Không log query URL có access_token.

### 7.5 Webhook smoke test (phase sau, chuẩn bị từ Phase 0)

- [ ] HTTPS callback hoạt động.
- [ ] Challenge verification.
- [ ] Signature HMAC-SHA256 hợp lệ.
- [ ] Signature sai bị từ chối.
- [ ] Duplicate delivery không tạo xử lý trùng.
- [ ] Event payload được lưu trước khi xử lý async.

**Giới hạn kiểm thử hiện tại:** chưa có Meta App ID/Secret/Configuration ID, callback deployment và Page test account được cung cấp trong phiên làm việc này. Vì vậy, các bước live OAuth/Graph API chưa được chạy và không được đánh dấu pass.

---

## 8. Rủi ro / blockers

| Blocker | Tại sao cần | Chủ thể cần thao tác |
|---|---|---|
| Meta Business Portfolio của app owner | Cần cho Business-type app / Facebook Login for Business và Tech Provider path | Chủ ứng dụng |
| Meta Business App | App ID, App Secret, Login product/config | Chủ ứng dụng |
| Login Configuration ID | Chọn token type, assets và permissions | Chủ ứng dụng |
| App roles + Page test | Dev mode chỉ test được theo điều kiện app role | Chủ ứng dụng/tester |
| HTTPS callback domain | OAuth redirect và webhook | Người vận hành Gateway |
| App Review / Advanced Access | Phục vụ business/Page không thuộc app owner | Chủ ứng dụng |
| Privacy Policy / data deletion URL | Cần cho public app review và vận hành dữ liệu | Chủ ứng dụng |

### Cần chủ ứng dụng xác nhận

1. Đã có Meta Business Portfolio chưa?
2. Đã có Meta App loại Business chưa, hay cần tạo mới?
3. Có Page test mà tài khoản tester có Full Control hoặc task cần thiết không?
4. MVP chỉ dùng nội bộ trước hay mục tiêu sớm là cho khách hàng bên ngoài kết nối Page?

Không gửi App Secret trong câu trả lời chat. Khi có thông tin, cấu hình secret qua môi trường triển khai.

---

## 9. Phase 0 exit criteria

| Hạng mục | Trạng thái |
|---|---|
| Đọc kiến trúc/provider/OAuth/credential/audit source | **Hoàn tất — static source review** |
| Xác định khả năng tái sử dụng Gateway | **Hoàn tất** |
| Xác minh Graph API baseline và Page Feed | **Hoàn tất — Meta docs v27.0** |
| Xác minh Facebook Login for Business model | **Hoàn tất — Meta docs** |
| Lập permission/Page task matrix | **Hoàn tất ở mức thiết kế; endpoint cụ thể cần revalidate** |
| Chốt native adapter + dedicated OAuth direction | **Hoàn tất** |
| Chốt data model và security boundary sơ bộ | **Hoàn tất** |
| Meta App configuration | **Chờ chủ ứng dụng** |
| Live OAuth smoke test | **Blocked — chưa có App credentials/config** |
| Live Graph API test trên Page thử nghiệm | **Blocked — chưa có Page/test grant** |
| App Review readiness | **Chưa đánh giá — cần App Dashboard và business information** |

### Kết luận Phase 0

Phần discovery và thiết kế kỹ thuật đã hoàn tất ở mức repository/documentation review. Phase 0 chưa thể đóng hoàn toàn về kiểm thử tích hợp cho đến khi có Meta Business App, Login Configuration, secret cấu hình an toàn và Page test.

**Điều kiện bắt đầu Phase 1:** có App ID, App Secret, Login Configuration ID được cấu hình trong môi trường server; callback HTTPS hợp lệ; tester đăng nhập được và trả về ít nhất một Page với quyền mong muốn.

---

## 10. Tài liệu chính thức đã đối chiếu

- [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business)
- [Graph API Overview](https://developers.facebook.com/docs/graph-api/)
- [Page Feed](https://developers.facebook.com/docs/graph-api/reference/page/feed/)
- [Page](https://developers.facebook.com/docs/graph-api/reference/page/)
- [Comments](https://developers.facebook.com/docs/graph-api/reference/object/comments)
- [Page Messages](https://developers.facebook.com/docs/graph-api/reference/page/messages)
- [Page Insights](https://developers.facebook.com/docs/graph-api/reference/insights/)
- [Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/)
- [Webhooks Reference](https://developers.facebook.com/docs/graph-api/webhooks/reference)
- [Debug Token](https://developers.facebook.com/docs/graph-api/reference/debug_token)

Các endpoint/permission phải được xác minh lại tại thời điểm code và App Review. Meta App Dashboard là nơi quyết định cuối cùng về permission, feature, app mode và trạng thái review của ứng dụng cụ thể.
