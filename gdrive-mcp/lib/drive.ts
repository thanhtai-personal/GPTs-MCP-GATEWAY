import { google, drive_v3 } from "googleapis";
import { Readable } from "node:stream";

let cached: drive_v3.Drive | null = null;

export function getDrive(): drive_v3.Drive {
  if (cached) return cached;
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN env vars"
    );
  }
  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  cached = google.drive({ version: "v3", auth });
  return cached;
}

export const FILE_FIELDS =
  "id, name, mimeType, size, modifiedTime, createdTime, parents, webViewLink, owners(displayName, emailAddress), trashed";

const LIST_FIELDS = `nextPageToken, files(${FILE_FIELDS})`;

/** Google-native formats -> export mime type used when reading content */
const EXPORT_MAP: Record<string, string> = {
  "application/vnd.google-apps.document": "text/plain",
  "application/vnd.google-apps.spreadsheet": "text/csv",
  "application/vnd.google-apps.presentation": "text/plain",
  "application/vnd.google-apps.drawing": "image/svg+xml",
  "application/vnd.google-apps.script": "application/vnd.google-apps.script+json",
};

/** Short names the model can use when creating files */
export const GOOGLE_TYPES = {
  doc: "application/vnd.google-apps.document",
  sheet: "application/vnd.google-apps.spreadsheet",
  slides: "application/vnd.google-apps.presentation",
  folder: "application/vnd.google-apps.folder",
} as const;

function isTextLike(mime: string) {
  return (
    mime.startsWith("text/") ||
    [
      "application/json",
      "application/xml",
      "application/javascript",
      "application/x-yaml",
      "application/yaml",
      "application/x-sh",
      "application/sql",
    ].includes(mime)
  );
}

function escapeQ(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/** Accepts plain keywords or a raw Drive query (q) string. */
export function buildQuery(query: string, includeTrashed = false) {
  const looksRaw = /\b(contains|=|!=|<|>|in parents|has\s*\{)/i.test(query);
  const q = looksRaw
    ? query
    : `(name contains '${escapeQ(query)}' or fullText contains '${escapeQ(query)}')`;
  return includeTrashed || /trashed\s*=/.test(q) ? q : `(${q}) and trashed = false`;
}

export async function searchFiles(query: string, pageSize = 20, pageToken?: string) {
  const res = await getDrive().files.list({
    q: buildQuery(query),
    pageSize,
    pageToken,
    fields: LIST_FIELDS,
    orderBy: "modifiedTime desc",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data;
}

export async function listRecent(pageSize = 20, folderId?: string) {
  const q = folderId
    ? `'${escapeQ(folderId)}' in parents and trashed = false`
    : "trashed = false";
  const res = await getDrive().files.list({
    q,
    pageSize,
    fields: LIST_FIELDS,
    orderBy: folderId ? "folder,name" : "modifiedTime desc",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data;
}

export async function getMetadata(fileId: string) {
  const res = await getDrive().files.get({
    fileId,
    fields: `${FILE_FIELDS}, description, shared, permissions(id, role, type, emailAddress)`,
    supportsAllDrives: true,
  });
  return res.data;
}

export async function readContent(fileId: string, maxChars = 50_000) {
  const drive = getDrive();
  const meta = await getMetadata(fileId);
  const mime = meta.mimeType ?? "";
  let text: string;

  if (EXPORT_MAP[mime]) {
    const res = await drive.files.export(
      { fileId, mimeType: EXPORT_MAP[mime] },
      { responseType: "text" }
    );
    text = String(res.data);
  } else if (isTextLike(mime)) {
    const res = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "text" }
    );
    text = String(res.data);
  } else {
    return {
      meta,
      text: null,
      note: `Binary file (${mime}); content not returned. Open it via webViewLink.`,
    };
  }

  const truncated = text.length > maxChars;
  return {
    meta,
    text: truncated ? text.slice(0, maxChars) : text,
    note: truncated ? `Truncated to ${maxChars} of ${text.length} characters.` : undefined,
  };
}

export async function createFile(opts: {
  name: string;
  content?: string;
  mimeType?: string;
  googleType?: keyof typeof GOOGLE_TYPES;
  folderId?: string;
}) {
  const sourceMime = opts.mimeType ?? "text/plain";
  const targetMime = opts.googleType ? GOOGLE_TYPES[opts.googleType] : sourceMime;
  const res = await getDrive().files.create({
    requestBody: {
      name: opts.name,
      mimeType: targetMime,
      parents: opts.folderId ? [opts.folderId] : undefined,
    },
    media:
      opts.content !== undefined && opts.googleType !== "folder"
        ? {
            // Uploading text/csv to a Sheet, or text/plain|text/html|markdown to a Doc, converts it
            mimeType: opts.googleType === "sheet" ? "text/csv" : sourceMime,
            body: Readable.from([opts.content]),
          }
        : undefined,
    fields: FILE_FIELDS,
    supportsAllDrives: true,
  });
  return res.data;
}

export async function updateFile(opts: {
  fileId: string;
  name?: string;
  content?: string;
  mimeType?: string;
  addParent?: string;
  removeParent?: string;
}) {
  const res = await getDrive().files.update({
    fileId: opts.fileId,
    requestBody: opts.name ? { name: opts.name } : {},
    media:
      opts.content !== undefined
        ? { mimeType: opts.mimeType ?? "text/plain", body: Readable.from([opts.content]) }
        : undefined,
    addParents: opts.addParent,
    removeParents: opts.removeParent,
    fields: FILE_FIELDS,
    supportsAllDrives: true,
  });
  return res.data;
}

export async function trashFile(fileId: string, restore = false) {
  const res = await getDrive().files.update({
    fileId,
    requestBody: { trashed: !restore },
    fields: FILE_FIELDS,
    supportsAllDrives: true,
  });
  return res.data;
}

export async function shareFile(opts: {
  fileId: string;
  role: "reader" | "commenter" | "writer";
  email?: string;
  anyoneWithLink?: boolean;
  notify?: boolean;
}) {
  const res = await getDrive().permissions.create({
    fileId: opts.fileId,
    requestBody: opts.anyoneWithLink
      ? { type: "anyone", role: opts.role }
      : { type: "user", role: opts.role, emailAddress: opts.email },
    sendNotificationEmail: opts.anyoneWithLink ? undefined : opts.notify ?? true,
    fields: "id, role, type, emailAddress",
    supportsAllDrives: true,
  });
  return res.data;
}
