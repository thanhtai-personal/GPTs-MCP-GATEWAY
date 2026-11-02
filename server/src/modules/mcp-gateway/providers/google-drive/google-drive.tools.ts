import type { McpToolDefinition } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

const fileId = {
  type: 'string',
  description: 'Google Drive file ID (the part after /d/ in a Drive URL).',
};
const pageSize = { type: 'integer', minimum: 1, maximum: 100, default: 20 };
const pageToken = {
  type: 'string',
  description: 'nextPageToken from a previous call.',
};

const SCOPE_NOTE =
  'Gateway uses the drive.file scope for writes: this only works on files created through Gateway (or explicitly opened with it). Other files return a permission error; tell the user instead of retrying.';

const readOnly = { readOnlyHint: true, openWorldHint: true };

export const GOOGLE_DRIVE_TOOLS: McpToolDefinition[] = [
  {
    name: 'search_files',
    title: 'Search Drive',
    description:
      "Search the user's Google Drive. Accepts plain keywords (matches file name and full text) or raw Drive query syntax, e.g. \"mimeType = 'application/vnd.google-apps.document' and name contains 'Q4'\". Trashed files are excluded unless the query mentions trashed.",
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keywords or raw Drive q syntax.' },
        pageSize,
        pageToken,
      },
      required: ['query'],
      additionalProperties: false,
    },
    annotations: readOnly,
  },
  {
    name: 'list_files',
    title: 'List recent files or a folder',
    description:
      'Without folderId: most recently modified files. With folderId: the contents of that folder (folders first).',
    inputSchema: {
      type: 'object',
      properties: {
        folderId: { type: 'string', description: "Folder ID; use 'root' for My Drive." },
        pageSize,
        pageToken,
      },
      additionalProperties: false,
    },
    annotations: readOnly,
  },
  {
    name: 'get_file_metadata',
    title: 'Get file metadata',
    description: 'Name, type, size, owners, parents, link and sharing state of a file.',
    inputSchema: {
      type: 'object',
      properties: { fileId },
      required: ['fileId'],
      additionalProperties: false,
    },
    annotations: readOnly,
  },
  {
    name: 'read_file_content',
    title: 'Read file content',
    description:
      'Read a file as text. Google Docs and Slides become plain text, Google Sheets become CSV (first sheet only), text-like files (txt, md, csv, json, html, xml...) are returned as-is. Binary files (PDF, images, Office) return metadata only.',
    inputSchema: {
      type: 'object',
      properties: {
        fileId,
        maxChars: {
          type: 'integer',
          minimum: 100,
          maximum: 200000,
          default: 50000,
          description: 'Truncate long content to this many characters.',
        },
      },
      required: ['fileId'],
      additionalProperties: false,
    },
    annotations: readOnly,
  },
  {
    name: 'create_file',
    title: 'Create file or folder',
    description:
      "Create a file or folder in the user's Drive. googleType='doc' converts text/markdown/html content into a Google Doc, 'sheet' converts CSV into a Google Sheet, 'folder' creates a folder. Without googleType the content is stored as a plain file with mimeType. " +
      SCOPE_NOTE,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        content: { type: 'string', description: 'Text content of the file.' },
        mimeType: {
          type: 'string',
          default: 'text/plain',
          description: 'Mime type of content: text/plain, text/markdown, text/html, text/csv, application/json...',
        },
        googleType: { type: 'string', enum: ['doc', 'sheet', 'folder'] },
        folderId: {
          type: 'string',
          description: 'Parent folder ID. Omit to create in My Drive root.',
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  },
  {
    name: 'update_file',
    title: 'Update file',
    description:
      'Rename a file and/or replace its whole content. Replacing a Google Doc with text/plain, text/markdown or text/html rewrites the document. ' +
      SCOPE_NOTE,
    inputSchema: {
      type: 'object',
      properties: {
        fileId,
        name: { type: 'string' },
        content: { type: 'string' },
        mimeType: { type: 'string', default: 'text/plain' },
      },
      required: ['fileId'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
  {
    name: 'trash_file',
    title: 'Move to trash',
    description:
      'Move a file to Drive trash, or restore it with restore=true. Never deletes permanently. ' +
      SCOPE_NOTE,
    inputSchema: {
      type: 'object',
      properties: {
        fileId,
        restore: { type: 'boolean', default: false },
      },
      required: ['fileId'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
  {
    name: 'share_file',
    title: 'Share file',
    description:
      'Share a file with an email address, or with anyone who has the link. Confirm with the user before sharing publicly. ' +
      SCOPE_NOTE,
    inputSchema: {
      type: 'object',
      properties: {
        fileId,
        role: {
          type: 'string',
          enum: ['reader', 'commenter', 'writer'],
          default: 'reader',
        },
        email: { type: 'string', description: 'Recipient email address.' },
        anyoneWithLink: { type: 'boolean', default: false },
        notify: {
          type: 'boolean',
          default: true,
          description: 'Send Google notification email to the recipient.',
        },
      },
      required: ['fileId'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  },
];
