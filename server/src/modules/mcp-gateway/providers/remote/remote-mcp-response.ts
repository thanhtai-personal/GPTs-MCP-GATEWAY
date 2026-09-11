import { BadGatewayException } from '@nestjs/common';

export type JsonRpcResponse<T> = {
  jsonrpc?: string;
  id?: string | number | null;
  result?: T;
  error?: {
    code?: number;
    message?: string;
    data?: unknown;
  };
};

export async function parseRemoteMcpResponse<T>(
  response: Response,
): Promise<JsonRpcResponse<T>> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as JsonRpcResponse<T>;
  }

  const text = await response.text();
  const dataLines = text
    .split(/\r?\n/u)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);

  for (const line of dataLines) {
    try {
      const parsed = JSON.parse(line) as JsonRpcResponse<T>;
      if (parsed.result !== undefined || parsed.error) {
        return parsed;
      }
    } catch {
      // Ignore unrelated SSE data and continue to the JSON-RPC message.
    }
  }

  throw new BadGatewayException({
    code: 'MCP_INVALID_RESPONSE',
    message: 'Remote MCP returned an unsupported response',
  });
}
