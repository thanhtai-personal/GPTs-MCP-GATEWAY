import { createMcpHandler } from "mcp-handler";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  createFile,
  getMetadata,
  listRecent,
  readContent,
  searchFiles,
  shareFile,
  trashFile,
  updateFile,
} from "@/lib/drive";

export const runtime = "nodejs";
export const maxDuration = 60;

const json = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

async function safe(fn: () => Promise<unknown>) {
  try {
    return json(await fn());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
  }
}

const mcpHandler = createMcpHandler(
  (server) => {
    server.tool(
      "search_files",
      "Search Google Drive. Accepts plain keywords (matches name + full text) or a raw Drive query, e.g. \"mimeType = 'application/vnd.google-apps.document' and name contains 'Q4'\".",
      {
        query: z.string().describe("Keywords or raw Drive q syntax"),
        pageSize: z.number().int().min(1).max(100).default(20),
        pageToken: z.string().optional(),
      },
      ({ query, pageSize, pageToken }) => safe(() => searchFiles(query, pageSize, pageToken))
    );

    server.tool(
      "list_recent_files",
      "List recently modified files, or list the contents of a folder when folderId is given.",
      {
        pageSize: z.number().int().min(1).max(100).default(20),
        folderId: z.string().optional(),
      },
      ({ pageSize, folderId }) => safe(() => listRecent(pageSize, folderId))
    );

    server.tool(
      "get_file_metadata",
      "Get metadata (name, type, owners, link, permissions) for a file.",
      { fileId: z.string() },
      ({ fileId }) => safe(() => getMetadata(fileId))
    );

    server.tool(
      "read_file_content",
      "Read a file as text. Google Docs/Slides -> plain text, Sheets -> CSV (first sheet), text files as-is.",
      {
        fileId: z.string(),
        maxChars: z.number().int().min(100).max(500_000).default(50_000),
      },
      ({ fileId, maxChars }) => safe(() => readContent(fileId, maxChars))
    );

    server.tool(
      "create_file",
      "Create a file or folder. Use googleType='doc' to turn text/markdown/html into a Google Doc, 'sheet' to turn CSV into a Google Sheet, 'folder' for a folder.",
      {
        name: z.string(),
        content: z.string().optional(),
        mimeType: z
          .string()
          .optional()
          .describe("Mime type of content, e.g. text/plain, text/markdown, text/html, text/csv"),
        googleType: z.enum(["doc", "sheet", "slides", "folder"]).optional(),
        folderId: z.string().optional().describe("Parent folder id"),
      },
      (args) => safe(() => createFile(args))
    );

    server.tool(
      "update_file",
      "Rename a file, replace its content, or move it (addParent/removeParent folder ids). Replacing content of a Google Doc with text/plain or text/html works.",
      {
        fileId: z.string(),
        name: z.string().optional(),
        content: z.string().optional(),
        mimeType: z.string().optional(),
        addParent: z.string().optional(),
        removeParent: z.string().optional(),
      },
      (args) => safe(() => updateFile(args))
    );

    server.tool(
      "trash_file",
      "Move a file to trash (restore=true to take it back out). Does not permanently delete.",
      { fileId: z.string(), restore: z.boolean().default(false) },
      ({ fileId, restore }) => safe(() => trashFile(fileId, restore))
    );

    server.tool(
      "share_file",
      "Share a file with an email address, or with anyone who has the link.",
      {
        fileId: z.string(),
        role: z.enum(["reader", "commenter", "writer"]).default("reader"),
        email: z.string().email().optional(),
        anyoneWithLink: z.boolean().default(false),
        notify: z.boolean().default(true),
      },
      (args) =>
        safe(async () => {
          if (!args.anyoneWithLink && !args.email) {
            throw new Error("Provide email or set anyoneWithLink=true");
          }
          return shareFile(args);
        })
    );
  },
  { serverInfo: { name: "gdrive-mcp", version: "0.1.0" } },
  { basePath: "/api", maxDuration: 60, verboseLogs: false }
);

/** Accepts `Authorization: Bearer <key>` or `?key=<key>` (for clients that can't set headers). */
function authorized(req: Request) {
  const expected = process.env.MCP_API_KEY;
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const given = bearer || new URL(req.url).searchParams.get("key") || "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handler(req: Request) {
  if (!authorized(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return mcpHandler(req);
}

export { handler as GET, handler as POST, handler as DELETE };
