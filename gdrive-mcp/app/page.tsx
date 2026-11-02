export default function Home() {
  const configured = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.MCP_API_KEY
  );
  return (
    <main>
      <h1>Google Drive MCP</h1>
      <p>
        MCP endpoint: <code>/api/mcp</code>
      </p>
      <p>Env: {configured ? "✅ đã cấu hình" : "⚠️ thiếu biến môi trường (xem .env.example)"}</p>
      <p>
        Tools: search_files, list_recent_files, get_file_metadata, read_file_content, create_file,
        update_file, trash_file, share_file
      </p>
    </main>
  );
}
