import { BadRequestException } from '@nestjs/common';
import type { CallMcpToolDto } from '@server/root/modules/mcp-gateway/dto/call-mcp-tool.dto';
import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import type {
  JsonObject,
  McpToolArguments,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

export function resolveMcpToolArguments(dto: CallMcpToolDto): McpToolArguments {
  if (dto.arguments !== undefined && dto.argumentsJson !== undefined) {
    throw invalidArguments(
      'Provide either arguments or argumentsJson, not both',
    );
  }

  if (dto.arguments !== undefined) {
    assertJsonObject(dto.arguments);
    return dto.arguments;
  }

  if (dto.argumentsJson === undefined || dto.argumentsJson.trim() === '') {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(dto.argumentsJson);
  } catch {
    throw invalidArguments('argumentsJson must contain valid JSON');
  }

  assertJsonObject(parsed);
  return parsed;
}

function assertJsonObject(value: unknown): asserts value is JsonObject {
  if (!isJsonObject(value)) {
    throw invalidArguments('MCP tool arguments must be a JSON object');
  }
}

function invalidArguments(message: string): BadRequestException {
  return new BadRequestException({
    code: 'MCP_TOOL_ARGUMENTS_INVALID',
    message,
  });
}
