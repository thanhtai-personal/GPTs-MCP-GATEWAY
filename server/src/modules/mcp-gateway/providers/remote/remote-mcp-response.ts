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
  maxBytes = 16_777_216,
): Promise<JsonRpcResponse<T>> {
  const contentType = response.headers.get('content-type') ?? '';
  const text = await readLimitedText(response, maxBytes);
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as JsonRpcResponse<T>;
    } catch {
      throw new BadGatewayException({
        code: 'MCP_INVALID_RESPONSE',
        message: 'Remote MCP returned invalid JSON',
      });
    }
  }

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

async function readLimitedText(response: Response, maxBytes: number): Promise<string> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (declaredLength > maxBytes) {
    await response.body?.cancel();
    throw responseTooLarge();
  }

  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw responseTooLarge();
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

function responseTooLarge(): BadGatewayException {
  return new BadGatewayException({
    code: 'MCP_RESPONSE_TOO_LARGE',
    message: 'Remote MCP response exceeded the configured byte limit',
  });
}
