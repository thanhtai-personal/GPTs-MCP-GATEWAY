import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import type { JsonObject } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

const API_BASES = {
  docs: 'https://docs.googleapis.com/v1',
  sheets: 'https://sheets.googleapis.com/v4',
} as const;

type GoogleApi = keyof typeof API_BASES;
type Query = Record<string, string | number | boolean | undefined>;

@Injectable()
export class GoogleWorkspaceApiClient {
  constructor(private readonly config: AppConfigService) {}

  getJson(api: GoogleApi, accessToken: string, path: string, query?: Query) {
    return this.request(api, accessToken, 'GET', path, undefined, query);
  }

  sendJson(
    api: GoogleApi,
    accessToken: string,
    method: 'POST' | 'PUT',
    path: string,
    body: JsonObject,
    query?: Query,
  ) {
    return this.request(api, accessToken, method, path, body, query);
  }

  private async request(
    api: GoogleApi,
    accessToken: string,
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body?: JsonObject,
    query?: Query,
  ): Promise<JsonObject> {
    const url = new URL(`${API_BASES[api]}${path}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(this.config.upstreamTimeoutMs),
      });
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'GOOGLE_WORKSPACE_API_UNAVAILABLE',
        message: 'Google Workspace API is unavailable',
        details: { cause: error instanceof Error ? error.name : 'network_error' },
      });
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message =
        isJsonObject(payload) &&
        isJsonObject(payload.error) &&
        typeof payload.error.message === 'string'
          ? payload.error.message
          : `Google Workspace API returned HTTP ${response.status}`;

      if (response.status === 401) {
        throw new UnauthorizedException({
          code: 'MCP_OAUTH_RECONNECT_REQUIRED',
          message: 'Google authorization must be reconnected',
        });
      }
      if (response.status === 403) {
        throw new ForbiddenException({
          code: 'GOOGLE_WORKSPACE_API_PERMISSION_DENIED',
          message,
        });
      }
      if (response.status === 404) {
        throw new NotFoundException({
          code: 'GOOGLE_WORKSPACE_RESOURCE_NOT_FOUND',
          message,
        });
      }
      if (response.status === 400) {
        throw new BadRequestException({
          code: 'GOOGLE_WORKSPACE_REQUEST_INVALID',
          message,
        });
      }
      if (response.status === 429 || response.status >= 500) {
        throw new ServiceUnavailableException({
          code: 'GOOGLE_WORKSPACE_API_UNAVAILABLE',
          message,
        });
      }
      throw new BadGatewayException({
        code: 'GOOGLE_WORKSPACE_API_FAILED',
        message,
      });
    }

    if (!isJsonObject(payload)) {
      throw new BadGatewayException({
        code: 'GOOGLE_WORKSPACE_INVALID_RESPONSE',
        message: 'Google Workspace API returned an unexpected response',
      });
    }
    return payload;
  }
}
