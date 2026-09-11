import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import type {
  McpProviderAdapter,
  McpToolCallResult,
  McpToolDefinition,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

type JsonRpcResponse<T> = {
  jsonrpc?: string;
  id?: string | number | null;
  result?: T;
  error?: {
    code?: number;
    message?: string;
    data?: unknown;
  };
};

type ToolsListResult = {
  tools?: McpToolDefinition[];
};

const STITCH_MCP_ENDPOINT = 'https://stitch.googleapis.com/mcp';

@Injectable()
export class StitchMcpAdapter implements McpProviderAdapter {
  readonly id = 'stitch' as const;
  readonly displayName = 'Google Stitch';

  constructor(private readonly config: AppConfigService) {}

  async testConnection(apiKey: string): Promise<void> {
    await this.listTools(apiKey);
  }

  async listTools(apiKey: string): Promise<McpToolDefinition[]> {
    const response = await this.rpc<ToolsListResult>(apiKey, 'tools/list', {});
    return Array.isArray(response.tools) ? response.tools : [];
  }

  async callTool(
    apiKey: string,
    toolName: string,
    argumentsValue: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    return this.rpc<McpToolCallResult>(apiKey, 'tools/call', {
      name: toolName,
      arguments: argumentsValue,
    });
  }

  private async rpc<T>(
    apiKey: string,
    method: string,
    params: Record<string, unknown>,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(STITCH_MCP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: crypto.randomUUID(),
          method,
          params,
        }),
        signal: AbortSignal.timeout(this.config.upstreamTimeoutMs),
      });
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'MCP_SERVICE_UNAVAILABLE',
        message: 'Stitch MCP is unavailable',
        details: { cause: error instanceof Error ? error.name : 'network_error' },
      });
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedException({
        code: 'MCP_INVALID_CREDENTIAL',
        message: 'Stitch API key is invalid or unauthorized',
      });
    }
    if (response.status === 429) {
      throw new ServiceUnavailableException({
        code: 'MCP_RATE_LIMITED',
        message: 'Stitch MCP rate limit was reached',
      });
    }
    if (!response.ok) {
      throw new BadGatewayException({
        code: 'MCP_SERVICE_UNAVAILABLE',
        message: 'Stitch MCP returned an upstream error',
        details: { status: response.status },
      });
    }

    const payload = await this.parseResponse<T>(response);
    if (payload.error) {
      throw new BadGatewayException({
        code: 'MCP_TOOL_CALL_FAILED',
        message: payload.error.message || 'Stitch MCP returned a JSON-RPC error',
        details: { rpcCode: payload.error.code ?? null },
      });
    }
    if (payload.result === undefined) {
      throw new BadGatewayException({
        code: 'MCP_INVALID_RESPONSE',
        message: 'Stitch MCP returned no result',
      });
    }
    return payload.result;
  }

  private async parseResponse<T>(response: Response): Promise<JsonRpcResponse<T>> {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as JsonRpcResponse<T>;
    }

    const text = await response.text();
    const dataLine = text
      .split(/\r?\n/u)
      .find((line) => line.startsWith('data:'));
    if (!dataLine) {
      throw new BadGatewayException({
        code: 'MCP_INVALID_RESPONSE',
        message: 'Stitch MCP returned an unsupported response',
      });
    }
    return JSON.parse(dataLine.slice(5).trim()) as JsonRpcResponse<T>;
  }
}
