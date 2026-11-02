# Google Drive MCP (Next.js)

MCP server đơn giản để kết nối **một** tài khoản Google Drive với Claude / ChatGPT / bất kỳ MCP client nào.
Chạy trên Next.js (App Router), deploy lên Vercel được ngay.

Endpoint: `https://<domain>/api/mcp` (Streamable HTTP)

## Tools

| Tool | Chức năng |
|---|---|
| `search_files` | Tìm theo từ khoá (tên + nội dung) hoặc cú pháp Drive `q` |
| `list_recent_files` | File mới sửa gần đây, hoặc nội dung một thư mục |
| `get_file_metadata` | Metadata, link, quyền chia sẻ |
| `read_file_content` | Đọc nội dung: Docs/Slides → text, Sheets → CSV, file text |
| `create_file` | Tạo file/thư mục; chuyển text/markdown/html → Google Doc, CSV → Google Sheet |
| `update_file` | Đổi tên, ghi đè nội dung, di chuyển thư mục |
| `trash_file` | Cho vào thùng rác / khôi phục (không xoá vĩnh viễn) |
| `share_file` | Chia sẻ cho email hoặc "ai có link" |

## Cài đặt

### 1. Tạo OAuth client trên Google Cloud

1. Vào <https://console.cloud.google.com/> → tạo project mới.
2. **APIs & Services → Library** → bật **Google Drive API**.
3. **APIs & Services → OAuth consent screen** → chọn *External*, điền tên app + email, thêm chính email của bạn vào *Test users*.
4. **Credentials → Create credentials → OAuth client ID** → loại **Desktop app**. Lưu lại Client ID và Client secret.

> ⚠️ Khi app ở trạng thái *Testing*, refresh token sẽ hết hạn sau 7 ngày. Để dùng lâu dài, vào OAuth consent screen bấm **Publish app** (dùng cho cá nhân thì không cần Google xác minh, chỉ hiện cảnh báo "unverified" khi đăng nhập).

### 2. Lấy refresh token

```bash
npm install
GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy npm run token
```

Mở link được in ra, đăng nhập tài khoản Drive muốn kết nối, cho phép quyền → terminal in ra `GOOGLE_REFRESH_TOKEN=...`.

### 3. Cấu hình biến môi trường

```bash
cp .env.example .env.local
# điền GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, MCP_API_KEY
npm run dev
```

Tạo `MCP_API_KEY` ngẫu nhiên:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### 4. Deploy

Push lên GitHub → Import vào Vercel → thêm 4 biến môi trường ở trên → Deploy.

## Kết nối với client

Endpoint được bảo vệ bằng `MCP_API_KEY`, gửi theo một trong hai cách:

- Header: `Authorization: Bearer <MCP_API_KEY>`
- Query: `https://<domain>/api/mcp?key=<MCP_API_KEY>` (cho client không đặt được header, ví dụ custom connector của Claude.ai / ChatGPT)

**Claude.ai**: Settings → Connectors → Add custom connector → URL `https://<domain>/api/mcp?key=<MCP_API_KEY>`.

**Claude Code**:

```bash
claude mcp add --transport http gdrive https://<domain>/api/mcp --header "Authorization: Bearer <MCP_API_KEY>"
```

**Thử nhanh bằng MCP Inspector**:

```bash
npx @modelcontextprotocol/inspector
# Transport: Streamable HTTP, URL: http://localhost:3000/api/mcp?key=<MCP_API_KEY>
```

## Lưu ý bảo mật

- Ai có URL kèm `key` là toàn quyền với Drive của bạn — giữ kín, đổi key nếu lộ.
- Scope đang dùng là `drive` (đọc/ghi toàn bộ). Muốn chỉ đọc, đổi scope trong `scripts/get-refresh-token.mjs` thành `drive.readonly` và lấy lại token (các tool ghi sẽ báo lỗi).
