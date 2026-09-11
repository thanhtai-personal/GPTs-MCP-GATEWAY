import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import type {
  JsonObject,
  McpToolCallResult,
  McpToolDefinition,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

export class McpProtocolShapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'McpProtocolShapeError';
  }
}

export type McpToolListPage = {
  tools: McpToolDefinition[];
  nextCursor?: string;
};

export function parseMcpToolListPage(value: unknown): McpToolListPage {
  if (!isJsonObject(value) || !Array.isArray(value.tools)) {
    throw new McpProtocolShapeError(
      'MCP tools/list result must contain a tools array',
    );
  }

  const tools = value.tools.map((tool, index) =>
    parseToolDefinition(tool, index),
  );

  return {
    tools,
    ...(typeof value.nextCursor === 'string'
      ? { nextCursor: value.nextCursor }
      : {}),
  };
}

export function parseMcpToolCallResult(value: unknown): McpToolCallResult {
  if (!isJsonObject(value)) {
    throw new McpProtocolShapeError(
      'MCP tools/call result must be a JSON object',
    );
  }

  if (
    value.isError !== undefined &&
    typeof value.isError !== 'boolean'
  ) {
    throw new McpProtocolShapeError(
      'MCP tools/call isError must be a boolean when present',
    );
  }

  return value as McpToolCallResult;
}

function parseToolDefinition(
  value: unknown,
  index: number,
): McpToolDefinition {
  if (!isJsonObject(value)) {
    throw new McpProtocolShapeError(
      `MCP tool at index ${index} must be a JSON object`,
    );
  }

  if (typeof value.name !== 'string' || value.name.trim() === '') {
    throw new McpProtocolShapeError(
      `MCP tool at index ${index} has no valid name`,
    );
  }

  if (!isJsonObject(value.inputSchema)) {
    throw new McpProtocolShapeError(
      `MCP tool ${value.name} has no valid inputSchema`,
    );
  }

  return {
    name: value.name,
    ...(typeof value.title === 'string' ? { title: value.title } : {}),
    ...(typeof value.description === 'string'
      ? { description: value.description }
      : {}),
    inputSchema: value.inputSchema,
    ...(isJsonObject(value.outputSchema)
      ? { outputSchema: value.outputSchema }
      : {}),
    ...(isJsonObject(value.annotations)
      ? { annotations: value.annotations }
      : {}),
    ...(isJsonObject(value._meta)
      ? { meta: value._meta }
      : {}),
  };
}
