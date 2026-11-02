import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import type { JsonObject } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

export const DRIVE_FILE_FIELDS =
  'id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,owners(displayName,emailAddress),trashed';

/** Drive returned a non-auth error the GPT can act on (not found, forbidden, bad query). */
export class GoogleDriveApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GoogleDriveApiError';
  }
}

type Query = Record<string, string | number | boolean | undefined>;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  query?: Query;
  json?: JsonObject;
  body?: string;
  contentType?: string;
  upload?: boolean;
};

export type DriveMedia = { mimeType: string; content: string };

@Injectable()
export class GoogleDriveApiClient {
  constructor(private readonly config: AppConfigService) {}

  async getJson(accessToken: string, path: string, query?: Query) {
    return this.parseJson(await this.request(accessToken, path, { query }));
  }

  async getText(accessToken: string, path: string, query?: Query) {
    const response = await this.request(accessToken, path, { query });
    const declared = Number(response.headers.get('content-length') ?? 0);
    if (declared > this.config.upstreamMaxResponseBytes) {
      throw new GoogleDriveApiError(413, 'File is too large to read through Gateway');
    }
    return response.text();
  }

  async sendJson(
    accessToken: string,
    method: 'POST' | 'PATCH',
    path: string,
    json: JsonObject,
    query?: Query,
  ) {
    return this.parseJson(
      await this.request(accessToken, path, { method, json, query }),
    );
  }

  /** Multipart upload: metadata + content in one request. */
  async upload(
    accessToken: string,
    method: 'POST' | 'PATCH',
    path: string,
    metadata: JsonObject,
    media: DriveMedia,
    query?: Query,
  ) {
    const boundary = `gateway_${randomBytes(12).toString('hex')}`;
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      `Content-Type: ${media.mimeType}; charset=UTF-8`,
      '',
      media.content,
      `--${boundary}--`,
      '',
    ].join('\r\n');

    return this.parseJson(
      await this.request(accessToken, path, {
        method,
        upload: true,
        body,
        contentType: `multipart/related; boundary=${boundary}`,
        query: { ...query, uploadType: 'multipart' },
      }),
    );
  }

  private async request(
    accessToken: string,
    path: string,
    options: RequestOptions,
  ): Promise<Response> {
    const url = new URL(`${options.upload ? UPLOAD_API : API}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    };
    let body: string | undefined = options.body;
    if (options.json) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.json);
    } else if (options.contentType) {
      headers['Content-Type'] = options.contentType;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: options.method ?? 'GET',
        headers,
        body,
        signal: AbortSignal.timeout(this.config.upstreamTimeoutMs),
      });
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'MCP_UPSTREAM_UNAVAILABLE',
        message: 'Google Drive API is unavailable',
        details: {
          cause: error instanceof Error ? error.name : 'network_error',
        },
      });
    }

    if (response.ok) return response;
    throw await this.toError(response);
  }

  private async toError(response: Response): Promise<Error> {
    let message = `Google Drive API returned HTTP ${response.status}`;
    try {
      const value: unknown = await response.json();
      if (
        isJsonObject(value) &&
        isJsonObject(value.error) &&
        typeof value.error.message === 'string'
      ) {
        message = value.error.message;
      }
    } catch {
      // keep the generic message
    }

    if (response.status === 401) {
      return new UnauthorizedException({
        code: 'MCP_OAUTH_RECONNECT_REQUIRED',
        message: 'Google authorization must be reconnected',
      });
    }
    if (response.status >= 500 || response.status === 429) {
      return new ServiceUnavailableException({
        code: 'MCP_UPSTREAM_UNAVAILABLE',
        message,
      });
    }
    return new GoogleDriveApiError(response.status, message);
  }

  private async parseJson(response: Response): Promise<JsonObject> {
    const value: unknown = await response.json();
    if (!isJsonObject(value)) {
      throw new ServiceUnavailableException({
        code: 'MCP_INVALID_RESPONSE',
        message: 'Google Drive API returned an unexpected response',
      });
    }
    return value;
  }
}
