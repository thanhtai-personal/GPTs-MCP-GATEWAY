# MCP Gateway

> **Trạng thái: experimental MVP.** Source hiện tại là baseline phát triển; chưa nên tuyên bố production-ready trước khi hoàn tất các bước trong [VALIDATION.md](./VALIDATION.md) và [Open-source Release Checklist](./docs/OPEN_SOURCE_RELEASE.md).

MCP Gateway giúp **Custom GPT discovery và gọi MCP service thông qua GPT Actions**, trong khi API key/OAuth token của provider vẫn được giữ ở backend.

Provider hiện hỗ trợ:

| Provider | Kết nối | Trạng thái |
| --- | --- | --- |
| Google Stitch | API key | dùng được |
| GitHub | OAuth (GitHub OAuth App) | dùng được |
| Notion | OAuth + PKCE + dynamic client registration | dùng được |
| Google Drive | Google OAuth (`drive.readonly` + `drive.file`), adapter Drive REST gốc | dùng được |
| Google Docs / Google Sheets | cùng Google OAuth, remote MCP của Google | chỉ khi tham gia Workspace Developer Preview |
| Figma | OAuth | chờ Figma duyệt client của Gateway |
| Lovable | OAuth | Lovable chỉ cho client được duyệt |
| Local PC (`local-agent/`) | agent ghép cặp trên máy | thử nghiệm |

Ngoài Custom GPT, Gateway còn là **MCP server** (`/api/v1/mcp`, OAuth 2.1 qua Supabase) để thêm làm plugin/connector trong ChatGPT hoặc Claude. Xem [MCP server setup](./docs/MCP_SERVER_SETUP.md).

> **Lưu ý tên gọi:** `Open ID` trong project là entitlement identifier riêng của MCP Gateway, **không phải OpenID Connect/OIDC**.

[English README](./README.md)

## Core concept

```text
User
  -> Custom GPT
  -> OpenAPI Action + Gateway token
  -> MCP Gateway
       -> token
       -> Open ID / entitlement
       -> MCP credential của đúng user
       -> tools/list hoặc tools/call
  -> Provider (Stitch, GitHub, Notion, Google Drive/Docs/Sheets, ...)
```

Ba khái niệm được tách riêng:

- **Gateway token**: secret dùng để authenticate GPT Action.
- **Open ID**: entitlement cho phép Gateway thực thi MCP.
- **Provider credential**: API key hoặc OAuth token của provider, được mã hóa và chỉ backend sử dụng.

GPT không nhận API key hay OAuth token của provider.

## Guest và trial

Guest đã đăng nhập có thể:

- thêm MCP connection;
- tải GPT Integration Kit;
- setup Custom GPT;
- chủ động tạo trial token một lần duy nhất.

Trial:

- chỉ bắt đầu khi user bấm tạo trial token;
- kéo dài chính xác 7 ngày;
- tạo một trial Open ID nội bộ, không export;
- không thể claim lại sau khi revoke/mất/hết hạn token.

## Member

MVP hiện tại cho Member:

- một paid/exportable Open ID cho account;
- tạo nhiều Gateway token gắn với Open ID đó;
- revoke token khi cần.

Payment/checkout chưa được implement. Khi dev/test, membership chỉ nên được promote bằng trusted server/database workflow.

## GPT Integration Kit

ZIP được generate gồm:

```text
instructions.md
GPTS-MCP-GATEWAY-Knowledge.md
openapi.yaml
setup-guide.md
```

Protocol hướng dẫn GPT:

```text
Intent
 -> Capability
 -> MCP service
 -> listMcpTools
 -> chọn tool theo schema runtime
 -> callMcpTool
 -> đọc kết quả
```

Không hardcode danh sách tool của provider trong Knowledge vì tool catalog runtime mới là nguồn đúng.

## Chạy local

Yêu cầu:

- Node.js 24;
- npm;
- Supabase project;
- credential của ít nhất một provider (ví dụ Stitch API key, hoặc Google OAuth client cho Drive).

```bash
cp server/.env.example server/.env
cp web/.env.example web/.env

openssl rand -base64 32
```

Apply theo thứ tự:

```text
database/migrations/001_initial_schema.sql
database/migrations/002_gpt_response_transfers.sql
database/migrations/003_site_settings.sql
database/migrations/004_mcp_oauth_transactions.sql
database/migrations/005_local_agents.sql
```

Sau đó:

```bash
npm --prefix server install
npm --prefix web install

npm run dev:server
npm run dev:web
```

Mặc định:

```text
Web:     http://127.0.0.1:5656
API:     http://127.0.0.1:5657/api/v1
Swagger: http://127.0.0.1:5657/docs
```

Không đưa `SUPABASE_SERVICE_ROLE_KEY` hoặc `MCP_CREDENTIAL_ENCRYPTION_KEY` vào frontend.

Hướng dẫn đầy đủ: [Self-hosting](./docs/SELF_HOSTING.md).

## Tài liệu chính

- [Documentation index](./docs/README.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [GPT Protocol](./docs/GPT_PROTOCOL.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Security Model](./docs/SECURITY_MODEL.md)
- [Data Handling](./docs/DATA_HANDLING.md)
- [Adding MCP Provider](./docs/ADDING_MCP_PROVIDER.md)
- [Project Status](./docs/PROJECT_STATUS.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
- [Open-source Release Checklist](./docs/OPEN_SOURCE_RELEASE.md)

## Open source và mô hình thương mại

Copyright (C) 2026 thanhtai-personal và các contributor của MCP Gateway.

MCP Gateway sử dụng **AGPL-3.0-or-later**. Xem [LICENSE](./LICENSE) và [NOTICE](./NOTICE).

Nếu bạn chạy bản đã sửa đổi như một dịch vụ mạng, AGPL mục 13 yêu cầu cung cấp source của bản sửa đổi đó cho người dùng.

Source được phép self-host và sử dụng thương mại theo điều khoản AGPL. Dịch vụ Gateway/Open ID chính thức vẫn có thể thu phí vì đây là dịch vụ được vận hành riêng, không phải “phí để được xem source”.

Phân biệt rõ:

- license cho source code;
- Open ID entitlement trên hosted Gateway chính thức.

Đọc [Open-source Policy](./OPEN_SOURCE_POLICY.md), [Commercial Model](./COMMERCIAL.md) và [Licensing](./docs/LICENSING.md).

## Disclaimer

Đây là project độc lập. Việc nhắc tới GPT/OpenAI, Google (Stitch, Drive, Docs, Sheets), GitHub, Notion, Figma, Lovable, Supabase, MCP hoặc sản phẩm bên thứ ba chỉ nhằm mô tả khả năng tích hợp, không hàm ý được tài trợ/chứng nhận.
