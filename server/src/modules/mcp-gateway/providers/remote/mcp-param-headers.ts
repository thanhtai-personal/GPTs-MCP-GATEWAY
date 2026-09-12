import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import { McpProtocolShapeError } from '@server/root/modules/mcp-gateway/providers/mcp-provider-boundary';
import type {
  JsonObject,
  JsonValue,
  McpJsonSchema,
  McpToolArguments,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

const HTTP_TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/u;
const BASE64_SENTINEL = /^=\?base64\?.*\?=$/s;

type HeaderDeclaration = {
  name: string;
  path: string[];
};

export function buildMcpParamHeaders(
  inputSchema: McpJsonSchema,
  argumentsValue: McpToolArguments,
): Record<string, string> {
  const declarations: HeaderDeclaration[] = [];
  collectHeaderDeclarations(inputSchema, [], declarations, new Set());

  return Object.fromEntries(
    declarations.flatMap(({ name, path }) => {
      const value = valueAtPath(argumentsValue, path);
      if (value === undefined || value === null) return [];
      return [[`Mcp-Param-${name}`, encodeHeaderValue(value)]];
    }),
  );
}

function collectHeaderDeclarations(
  schema: McpJsonSchema,
  path: string[],
  declarations: HeaderDeclaration[],
  names: Set<string>,
): void {
  const properties = schema.properties;
  if (!isJsonObject(properties)) return;

  for (const [propertyName, propertyValue] of Object.entries(properties)) {
    if (!isJsonObject(propertyValue)) continue;

    const propertyPath = [...path, propertyName];
    const headerName = propertyValue['x-mcp-header'];
    if (headerName !== undefined) {
      validateDeclaration(propertyValue, headerName, names);
      declarations.push({ name: headerName, path: propertyPath });
    }

    collectHeaderDeclarations(
      propertyValue,
      propertyPath,
      declarations,
      names,
    );
  }
}

function validateDeclaration(
  schema: JsonObject,
  headerName: JsonValue,
  names: Set<string>,
): asserts headerName is string {
  if (typeof headerName !== 'string' || !HTTP_TOKEN.test(headerName)) {
    throw new McpProtocolShapeError(
      'MCP x-mcp-header must contain a valid HTTP field-name token',
    );
  }
  if (!['string', 'integer', 'boolean'].includes(String(schema.type))) {
    throw new McpProtocolShapeError(
      `MCP x-mcp-header ${headerName} must annotate a string, integer, or boolean`,
    );
  }

  const normalizedName = headerName.toLowerCase();
  if (names.has(normalizedName)) {
    throw new McpProtocolShapeError(
      `MCP x-mcp-header ${headerName} is duplicated`,
    );
  }
  names.add(normalizedName);
}

function valueAtPath(
  argumentsValue: McpToolArguments,
  path: string[],
): JsonValue | undefined {
  let current: JsonValue = argumentsValue;
  for (const segment of path) {
    if (
      !isJsonObject(current) ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      return undefined;
    }
    current = current[segment]!;
  }
  return current;
}

function encodeHeaderValue(value: JsonValue): string {
  let serialized: string;
  if (typeof value === 'string') {
    serialized = value;
  } else if (typeof value === 'boolean') {
    serialized = value ? 'true' : 'false';
  } else if (typeof value === 'number' && Number.isSafeInteger(value)) {
    serialized = String(value);
  } else {
    throw new McpProtocolShapeError(
      'MCP header parameter value must be a string, safe integer, or boolean',
    );
  }

  const isPlainAscii = /^[\t\x20-\x7E]*$/.test(serialized);
  const hasOuterWhitespace = /^[\t ]|[\t ]$/.test(serialized);
  if (
    isPlainAscii &&
    !hasOuterWhitespace &&
    !BASE64_SENTINEL.test(serialized)
  ) {
    return serialized;
  }

  return `=?base64?${Buffer.from(serialized, 'utf8').toString('base64')}?=`;
}
