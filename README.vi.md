# MCP Gateway

> **Trạng thái: experimental MVP.** Source hiện tại là baseline phát triển; chưa nên tuyên bố production-ready trước khi hoàn tất các bước trong [VALIDATION.md](./VALIDATION.md) và [Open-source Release Checklist](./docs/OPEN_SOURCE_RELEASE.md).

MCP Gateway giúp **Custom GPT discovery và gọi MCP service thông qua GPT Actions**, trong khi API key của MCP provider vẫn được giữ ở backend.

Provider đầu tiên hiện có là **Google Stitch**.

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
  -> MCP Provider (Stitch)
```

Ba khái niệm được tách riêng:

- **Gateway token**: secret dùng để authenticate GPT Action.
- **Open ID**: entitlement cho phép Gateway thực thi MCP.
- **Provider credential**: API key của Stitch/MCP provider, được mã hóa và chỉ backend sử dụng.

GPT không nhận Stitch API key.

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
knowledge.md
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

Không hardcode danh sách Stitch tools trong Knowledge vì tool catalog runtime mới là nguồn đúng.

## Chạy local

Yêu cầu:

- Node.js 24;
- npm;
- Supabase project;
- Stitch API key nếu muốn test provider thật.

```bash
cp server/.env.example server/.env
cp web/.env.example web/.env

openssl rand -base64 32
```

Apply:

```text
database/migrations/001_initial_schema.sql
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

## License trước khi public

Repo hiện vẫn là `UNLICENSED`.

Mình không tự chọn MIT/Apache-2.0/AGPL-3.0 trong source vì lựa chọn đó ảnh hưởng trực tiếp tới chiến lược thương mại hosted Open ID.

Trước khi public, owner cần chốt license, thêm file `LICENSE` và cập nhật package metadata.

Đọc [Licensing Decision](./docs/LICENSING.md).

## Disclaimer

Đây là project độc lập. Việc nhắc tới GPT/OpenAI, Google Stitch, Supabase, MCP hoặc sản phẩm bên thứ ba chỉ nhằm mô tả khả năng tích hợp, không hàm ý được tài trợ/chứng nhận.
