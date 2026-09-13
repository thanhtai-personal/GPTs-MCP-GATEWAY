import {
  BadGatewayException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import type { McpOAuthCredential } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
import { parseRemoteMcpResponse } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-response';

const MODERN_PROTOCOL_VERSION = '2026-07-28';
const LEGACY_PROTOCOL_VERSION = '2025-11-25';
const CLIENT_INFO = {
  name: 'mcp-gateway',
  version: '0.1.0',
};

type ProtocolEra = 'modern' | 'legacy';

type ConnectionState = {
  era: ProtocolEra;
  protocolVersion: string;
  sessionId?: string;
};

export class RemoteMcpConnection {
  constructor(
    private readonly transport: RemoteMcpHttpTransport,
    private readonly endpoint: string,
    private readonly credential: McpOAuthCredential,
    private readonly providerName: string,
    private readonly state: ConnectionState,
  ) {}

  request<T>(
    method: string,
    params: Record<string, unknown>,
    toolName?: string,
    requestHeaders?: Record<string, string>,
  ): Promise<T> {
    return this.transport.request<T>(
      this.endpoint,
      this.credential,
      this.providerName,
      this.state,
      method,
      params,
      toolName,
      requestHeaders,
    );
  }

  close(): Promise<void> {
    return this.transport.close(
      this.endpoint,
      this.credential,
      this.state,
    );
  }
}

@Injectable()
export class RemoteMcpHttpTransport {
  constructor(private readonly config: AppConfigService) {}

  async connect(
    endpoint: string,
    credential: McpOAuthCredential,
    providerName: string,
  ): Promise<RemoteMcpConnection> {
    const modern = await this.tryModern(endpoint, credential, providerName);
    const state = modern
      ? {
          era: 'modern' as const,
          protocolVersion: MODERN_PROTOCOL_VERSION,
        }
      : await this.initializeLegacy(endpoint, credential, providerName);

    return new RemoteMcpConnection(
      this,
      endpoint,
      credential,
      providerName,
      state,
    );
  }

  async request<T>(
    endpoint: string,
    credential: McpOAuthCredential,
    providerName: string,
    state: ConnectionState,
    method: string,
    params: Record<string, unknown>,
    toolName?: string,
    requestHeaders?: Record<string, string>,
  ): Promise<T> {
    const response = await this.post(
      endpoint,
      credential,
      providerName,
      {
        jsonrpc: '2.0',
        id: crypto.randomUUID(),
        method,
        params:
          state.era === 'modern'
            ? {
                ...params,
                _meta: this.modernMeta(),
              }
            : params,
      },
      {
        ...this.protocolHeaders(state, method, toolName),
        ...requestHeaders,
      },
    );

    const payload = await parseRemoteMcpResponse<T>(response, this.config.upstreamMaxResponseBytes);
    if (payload.error) {
      throw new BadGatewayException({
        code: 'MCP_TOOL_CALL_FAILED',
        message:
          payload.error.message ||
          `${providerName} MCP returned a JSON-RPC error`,
        details: { rpcCode: payload.error.code ?? null },
      });
    }
    if (payload.result === undefined) {
      throw new BadGatewayException({
        code: 'MCP_INVALID_RESPONSE',
        message: `${providerName} MCP returned no result`,
      });
    }
    return payload.result;
  }

  async close(
    endpoint: string,
    credential: McpOAuthCredential,
    state: ConnectionState,
  ): Promise<void> {
    if (state.era !== 'legacy' || !state.sessionId) return;

    try {
      await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `${credential.tokenType} ${credential.accessToken}`,
          'MCP-Protocol-Version': state.protocolVersion,
          'Mcp-Session-Id': state.sessionId,
        },
        signal: AbortSignal.timeout(this.config.upstreamTimeoutMs),
      });
    } catch {
      // Session cleanup is best effort and must not replace the tool result.
    }
  }

  private async tryModern(
    endpoint: string,
    credential: McpOAuthCredential,
    providerName: string,
  ): Promise<boolean> {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `${credential.tokenType} ${credential.accessToken}`,
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
          'MCP-Protocol-Version': MODERN_PROTOCOL_VERSION,
          'Mcp-Method': 'server/discover',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: crypto.randomUUID(),
          method: 'server/discover',
          params: {
            _meta: this.modernMeta(),
          },
        }),
        signal: AbortSignal.timeout(this.config.upstreamTimeoutMs),
      });
    } catch (error) {
      throw this.unavailable(providerName, error);
    }

    this.throwAuthOrRateLimit(response, providerName);

    if ([400, 404, 405, 406, 415, 422].includes(response.status)) {
      return false;
    }
    if (!response.ok) {
      throw this.upstreamError(providerName, response.status);
    }

    const payload = await parseRemoteMcpResponse<unknown>(response, this.config.upstreamMaxResponseBytes);
    if (payload.result !== undefined) return true;

    if (
      payload.error?.code === -32601 ||
      payload.error?.code === -32600
    ) {
      return false;
    }

    if (payload.error) {
      throw new BadGatewayException({
        code: 'MCP_PROTOCOL_NEGOTIATION_FAILED',
        message:
          payload.error.message ||
          `${providerName} MCP protocol negotiation failed`,
        details: { rpcCode: payload.error.code ?? null },
      });
    }

    return false;
  }

  private async initializeLegacy(
    endpoint: string,
    credential: McpOAuthCredential,
    providerName: string,
  ): Promise<ConnectionState> {
    const response = await this.post(
      endpoint,
      credential,
      providerName,
      {
        jsonrpc: '2.0',
        id: crypto.randomUUID(),
        method: 'initialize',
        params: {
          protocolVersion: LEGACY_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: CLIENT_INFO,
        },
      },
      {},
    );

    const payload = await parseRemoteMcpResponse<unknown>(response, this.config.upstreamMaxResponseBytes);
    if (payload.error) {
      throw new BadGatewayException({
        code: 'MCP_PROTOCOL_NEGOTIATION_FAILED',
        message:
          payload.error.message ||
          `${providerName} MCP initialization failed`,
        details: { rpcCode: payload.error.code ?? null },
      });
    }

    const result = payload.result;
    if (
      typeof result !== 'object' ||
      result === null ||
      !('protocolVersion' in result) ||
      typeof result.protocolVersion !== 'string'
    ) {
      throw new BadGatewayException({
        code: 'MCP_PROTOCOL_NEGOTIATION_FAILED',
        message: `${providerName} MCP returned an invalid initialize result`,
      });
    }

    const state: ConnectionState = {
      era: 'legacy',
      protocolVersion: result.protocolVersion,
      ...(response.headers.get('mcp-session-id')
        ? { sessionId: response.headers.get('mcp-session-id')! }
        : {}),
    };

    await this.sendInitializedNotification(
      endpoint,
      credential,
      providerName,
      state,
    );

    return state;
  }

  private async sendInitializedNotification(
    endpoint: string,
    credential: McpOAuthCredential,
    providerName: string,
    state: ConnectionState,
  ): Promise<void> {
    const response = await this.fetchPost(
      endpoint,
      credential,
      {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      },
      this.protocolHeaders(state),
    );

    this.throwAuthOrRateLimit(response, providerName);
    if (!response.ok) {
      throw this.upstreamError(providerName, response.status);
    }
  }

  private post(
    endpoint: string,
    credential: McpOAuthCredential,
    providerName: string,
    body: Record<string, unknown>,
    headers: Record<string, string>,
  ): Promise<Response> {
    return this.fetchPost(endpoint, credential, body, headers).then(
      (response) => {
        this.throwAuthOrRateLimit(response, providerName);
        if (!response.ok) {
          throw this.upstreamError(providerName, response.status);
        }
        return response;
      },
      (error: unknown) => {
        throw this.unavailable(providerName, error);
      },
    );
  }

  private fetchPost(
    endpoint: string,
    credential: McpOAuthCredential,
    body: Record<string, unknown>,
    headers: Record<string, string>,
  ): Promise<Response> {
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `${credential.tokenType} ${credential.accessToken}`,
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.upstreamTimeoutMs),
    });
  }

  private protocolHeaders(
    state: ConnectionState,
    method?: string,
    toolName?: string,
  ): Record<string, string> {
    return {
      'MCP-Protocol-Version': state.protocolVersion,
      ...(state.sessionId ? { 'Mcp-Session-Id': state.sessionId } : {}),
      ...(state.era === 'modern' && method ? { 'Mcp-Method': method } : {}),
      ...(state.era === 'modern' && toolName ? { 'Mcp-Name': toolName } : {}),
    };
  }

  private modernMeta() {
    return {
      'io.modelcontextprotocol/protocolVersion': MODERN_PROTOCOL_VERSION,
      'io.modelcontextprotocol/clientInfo': CLIENT_INFO,
      'io.modelcontextprotocol/clientCapabilities': {},
    };
  }

  private throwAuthOrRateLimit(
    response: Response,
    providerName: string,
  ): void {
    if (response.status === 401) {
      throw new UnauthorizedException({
        code: 'MCP_OAUTH_RECONNECT_REQUIRED',
        message: `${providerName} authorization is invalid or expired`,
      });
    }
    if (response.status === 403) {
      throw new ForbiddenException({
        code: 'MCP_PROVIDER_PERMISSION_DENIED',
        message:
          `${providerName} denied access. Verify OAuth scopes, enabled APIs, ` +
          'provider account permissions, and any preview-program eligibility.',
        details: { status: 403 },
      });
    }
    if (response.status === 429) {
      throw new ServiceUnavailableException({
        code: 'MCP_RATE_LIMITED',
        message: `${providerName} MCP rate limit was reached`,
      });
    }
  }

  private unavailable(
    providerName: string,
    error: unknown,
  ): ServiceUnavailableException {
    return new ServiceUnavailableException({
      code: 'MCP_SERVICE_UNAVAILABLE',
      message: `${providerName} MCP is unavailable`,
      details: {
        cause: error instanceof Error ? error.name : 'network_error',
      },
    });
  }

  private upstreamError(
    providerName: string,
    status: number,
  ): BadGatewayException {
    return new BadGatewayException({
      code: 'MCP_SERVICE_UNAVAILABLE',
      message: `${providerName} MCP returned an upstream error`,
      details: { status },
    });
  }
}
