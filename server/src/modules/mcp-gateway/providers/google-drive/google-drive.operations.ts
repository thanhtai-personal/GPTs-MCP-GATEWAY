import { BadRequestException } from '@nestjs/common';
import {
  DRIVE_FILE_FIELDS,
  GoogleDriveApiClient,
  GoogleDriveApiError,
} from '@server/root/modules/mcp-gateway/providers/google-drive/google-drive-api.client';
import type {
  JsonObject,
  JsonValue,
  McpToolArguments,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

const LIST_FIELDS = `nextPageToken,files(${DRIVE_FILE_FIELDS})`;
const ALL_DRIVES = { supportsAllDrives: true } as const;

const EXPORT_AS: Record<string, string> = {
  'application/vnd.google-apps.document': 'text/plain',
  'application/vnd.google-apps.spreadsheet': 'text/csv',
  'application/vnd.google-apps.presentation': 'text/plain',
  'application/vnd.google-apps.drawing': 'image/svg+xml',
};

const GOOGLE_TYPES = {
  doc: 'application/vnd.google-apps.document',
  sheet: 'application/vnd.google-apps.spreadsheet',
  folder: 'application/vnd.google-apps.folder',
} as const;

const TEXT_LIKE = new Set([
  'application/json',
  'application/xml',
  'application/javascript',
  'application/x-yaml',
  'application/yaml',
  'application/sql',
  'application/x-sh',
]);

type Handler = (
  api: GoogleDriveApiClient,
  token: string,
  args: McpToolArguments,
) => Promise<JsonValue>;

function invalid(message: string): BadRequestException {
  return new BadRequestException({ code: 'MCP_TOOL_ARGUMENTS_INVALID', message });
}

function str(args: McpToolArguments, key: string, required: true): string;
function str(args: McpToolArguments, key: string, required?: false): string | undefined;
function str(args: McpToolArguments, key: string, required = false) {
  const value = args[key];
  if (value === undefined || value === null || value === '') {
    if (required) throw invalid(`${key} is required`);
    return undefined;
  }
  if (typeof value !== 'string') throw invalid(`${key} must be a string`);
  return value;
}

function int(args: McpToolArguments, key: string, fallback: number, min: number, max: number) {
  const value = args[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw invalid(`${key} must be an integer`);
  }
  return Math.min(max, Math.max(min, value));
}

function bool(args: McpToolArguments, key: string, fallback: boolean) {
  const value = args[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'boolean') throw invalid(`${key} must be a boolean`);
  return value;
}

function oneOf<T extends string>(
  args: McpToolArguments,
  key: string,
  options: readonly T[],
  fallback?: T,
): T | undefined {
  const value = str(args, key) ?? fallback;
  if (value !== undefined && !options.includes(value as T)) {
    throw invalid(`${key} must be one of: ${options.join(', ')}`);
  }
  return value as T | undefined;
}

function id(value: string): string {
  return encodeURIComponent(value);
}

function escapeQ(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function buildDriveQuery(query: string): string {
  const looksRaw = /\b(contains|in parents|has\s*\{)|[=<>]/i.test(query);
  const q = looksRaw
    ? query
    : `(name contains '${escapeQ(query)}' or fullText contains '${escapeQ(query)}')`;
  return /\btrashed\b/i.test(q) ? q : `(${q}) and trashed = false`;
}

function isTextLike(mimeType: string): boolean {
  return mimeType.startsWith('text/') || TEXT_LIKE.has(mimeType);
}

const searchFiles: Handler = (api, token, args) =>
  api.getJson(token, '/files', {
    q: buildDriveQuery(str(args, 'query', true)),
    pageSize: int(args, 'pageSize', 20, 1, 100),
    pageToken: str(args, 'pageToken'),
    orderBy: 'modifiedTime desc',
    fields: LIST_FIELDS,
    includeItemsFromAllDrives: true,
    ...ALL_DRIVES,
  });

const listFiles: Handler = (api, token, args) => {
  const folderId = str(args, 'folderId');
  return api.getJson(token, '/files', {
    q: folderId
      ? `'${escapeQ(folderId)}' in parents and trashed = false`
      : 'trashed = false',
    pageSize: int(args, 'pageSize', 20, 1, 100),
    pageToken: str(args, 'pageToken'),
    orderBy: folderId ? 'folder,name' : 'modifiedTime desc',
    fields: LIST_FIELDS,
    includeItemsFromAllDrives: true,
    ...ALL_DRIVES,
  });
};

const getMetadata = (api: GoogleDriveApiClient, token: string, fileId: string) =>
  api.getJson(token, `/files/${id(fileId)}`, {
    fields: `${DRIVE_FILE_FIELDS},description,shared,capabilities(canEdit,canShare,canTrash)`,
    ...ALL_DRIVES,
  });

const getFileMetadata: Handler = (api, token, args) =>
  getMetadata(api, token, str(args, 'fileId', true));

const readFileContent: Handler = async (api, token, args) => {
  const fileId = str(args, 'fileId', true);
  const maxChars = int(args, 'maxChars', 50_000, 100, 200_000);
  const meta = await getMetadata(api, token, fileId);
  const mimeType = typeof meta.mimeType === 'string' ? meta.mimeType : '';

  let text: string;
  if (EXPORT_AS[mimeType]) {
    text = await api.getText(token, `/files/${id(fileId)}/export`, {
      mimeType: EXPORT_AS[mimeType],
    });
  } else if (isTextLike(mimeType)) {
    text = await api.getText(token, `/files/${id(fileId)}`, { alt: 'media', ...ALL_DRIVES });
  } else {
    return {
      file: meta,
      content: null,
      note: `Binary file (${mimeType || 'unknown type'}): content is not returned. Share webViewLink with the user instead.`,
    };
  }

  const truncated = text.length > maxChars;
  const result: JsonObject = { file: meta, content: truncated ? text.slice(0, maxChars) : text };
  if (truncated) result.note = `Truncated to ${maxChars} of ${text.length} characters. Call again with a larger maxChars if needed.`;
  return result;
};

const createFile: Handler = (api, token, args) => {
  const googleType = oneOf(args, 'googleType', ['doc', 'sheet', 'folder'] as const);
  const content = str(args, 'content');
  const folderId = str(args, 'folderId');
  const sourceMime = str(args, 'mimeType') ?? 'text/plain';
  const metadata: JsonObject = {
    name: str(args, 'name', true),
    mimeType: googleType ? GOOGLE_TYPES[googleType] : sourceMime,
  };
  if (folderId) metadata.parents = [folderId];
  const query = { fields: DRIVE_FILE_FIELDS, ...ALL_DRIVES };
  if (googleType === 'folder' || content === undefined) {
    return api.sendJson(token, 'POST', '/files', metadata, query);
  }
  return api.upload(
    token,
    'POST',
    '/files',
    metadata,
    { mimeType: googleType === 'sheet' ? 'text/csv' : sourceMime, content },
    query,
  );
};

const copyFile: Handler = (api, token, args) => {
  const fileId = str(args, 'fileId', true);
  const name = str(args, 'name');
  const folderId = str(args, 'folderId');
  const metadata: JsonObject = {};
  if (name) metadata.name = name;
  if (folderId) metadata.parents = [folderId];
  return api.sendJson(token, 'POST', `/files/${id(fileId)}/copy`, metadata, {
    fields: DRIVE_FILE_FIELDS,
    ...ALL_DRIVES,
  });
};

const updateFile: Handler = (api, token, args) => {
  const fileId = str(args, 'fileId', true);
  const name = str(args, 'name');
  const content = str(args, 'content');
  if (name === undefined && content === undefined) throw invalid('Provide name and/or content');
  const metadata: JsonObject = name === undefined ? {} : { name };
  const query = { fields: DRIVE_FILE_FIELDS, ...ALL_DRIVES };
  if (content === undefined) {
    return api.sendJson(token, 'PATCH', `/files/${id(fileId)}`, metadata, query);
  }
  return api.upload(
    token,
    'PATCH',
    `/files/${id(fileId)}`,
    metadata,
    { mimeType: str(args, 'mimeType') ?? 'text/plain', content },
    query,
  );
};

const trashFile: Handler = (api, token, args) =>
  api.sendJson(
    token,
    'PATCH',
    `/files/${id(str(args, 'fileId', true))}`,
    { trashed: !bool(args, 'restore', false) },
    { fields: DRIVE_FILE_FIELDS, ...ALL_DRIVES },
  );

const shareFile: Handler = (api, token, args) => {
  const fileId = str(args, 'fileId', true);
  const role = oneOf(args, 'role', ['reader', 'commenter', 'writer'] as const, 'reader');
  const anyoneWithLink = bool(args, 'anyoneWithLink', false);
  const email = str(args, 'email');
  if (!anyoneWithLink && !email) throw invalid('Provide email or set anyoneWithLink=true');
  const permission: JsonObject = anyoneWithLink
    ? { type: 'anyone', role: role ?? 'reader' }
    : { type: 'user', role: role ?? 'reader', emailAddress: email ?? '' };
  return api.sendJson(token, 'POST', `/files/${id(fileId)}/permissions`, permission, {
    fields: 'id,role,type,emailAddress',
    sendNotificationEmail: anyoneWithLink ? undefined : bool(args, 'notify', true),
    ...ALL_DRIVES,
  });
};

export const GOOGLE_DRIVE_HANDLERS: Record<string, Handler> = {
  search_files: searchFiles,
  list_files: listFiles,
  get_file_metadata: getFileMetadata,
  read_file_content: readFileContent,
  create_file: createFile,
  copy_file: copyFile,
  update_file: updateFile,
  trash_file: trashFile,
  share_file: shareFile,
};

export { GoogleDriveApiError };
