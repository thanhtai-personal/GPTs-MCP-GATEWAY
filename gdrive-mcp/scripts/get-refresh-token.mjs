// Usage: GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... npm run token
// Needs an OAuth client of type "Desktop app" (loopback redirect is allowed automatically).
import http from "node:http";
import { google } from "googleapis";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first.");
  process.exit(1);
}

const PORT = 53682;
const redirect = `http://127.0.0.1:${PORT}/callback`;
const oauth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirect);

const url = oauth.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive"],
});

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url ?? "/", redirect);
  if (u.pathname !== "/callback") return res.end();
  const code = u.searchParams.get("code");
  if (!code) {
    res.end("No code");
    return;
  }
  try {
    const { tokens } = await oauth.getToken(code);
    res.end("Done! Quay lại terminal để lấy refresh token.");
    console.log("\nGOOGLE_REFRESH_TOKEN=" + tokens.refresh_token + "\n");
  } catch (e) {
    res.end("Error: " + e.message);
    console.error(e);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log("Mở link này trong trình duyệt và đăng nhập tài khoản Google Drive cần kết nối:\n");
  console.log(url + "\n");
});
