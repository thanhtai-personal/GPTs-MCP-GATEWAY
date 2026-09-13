import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import {
  McpProtocolShapeError,
  parseMcpToolCallResult,
  parseMcpToolListPage,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider-boundary';
import { buildMcpParamHeaders } from '@server/root/modules/mcp-gateway/providers/remote/mcp-param-headers';
import type {
  McpOAuthCredential,
  McpToolArguments,
  McpToolCallResult,
  McpToolDefinition,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
import {
  RemoteMcpConnection,
  RemoteMcpHttpTransport,
} from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.transport';

@Injectable()
export class RemoteMcpHttpClient {
  constructor(private readonly transport: RemoteMcpHttpTransport) {}

  async listTools(
    endpoint: string,
    credential: McpOAuthCredential,
    providerName: string,
  ): Promise<McpToolDefinition[]> {
    const connection = await this.transport.connect(
      endpoint,
      credential,
      providerName,
    );

    try {
      return await this.listToolsFromConnection(connection, providerName);
    } finally {
      await connection.close();
    }
  }

  async callTool(
    endpoint: string,
    credential: McpOAuthCredential,
    providerName: string,
    toolName: string,
    argumentsValue: McpToolArguments,
  ): Promise<McpToolCallResult> {
    const connection = await this.transport.connect(
      endpoint,
      credential,
      providerName,
    );

    try {
      const tools = await this.listToolsFromConnection(
        connection,
        providerName,
      );
      const tool = tools.find((candidate) => candidate.name === toolName);
      if (!tool) {
        throw new NotFoundException({
          code: 'MCP_TOOL_NOT_FOUND',
          message: `MCP tool not found: ${toolName}`,
        });
      }
      const requestHeaders = this.buildToolHeaders(tool, argumentsValue);
      const result = await connection.request<unknown>(
        'tools/call',
        {
          name: toolName,
          arguments: argumentsValue,
        },
        toolName,
        requestHeaders,
      );

      try {
        return parseMcpToolCallResult(result);
      } catch (error) {
        this.throwInvalidResponse(error);
      }
    } finally {
      await connection.close();
    }
  }

  private async listToolsFromConnection(
    connection: RemoteMcpConnection,
    providerName: string,
  ): Promise<McpToolDefinition[]> {
    const tools: McpToolDefinition[] = [];
    const seenCursors = new Set<string>();
    let cursor: string | undefined;

    for (let pageIndex = 0; pageIndex < 64; pageIndex += 1) {
      const result = await connection.request<unknown>(
        'tools/list',
        cursor === undefined ? {} : { cursor },
      );

      const page = this.parseToolPage(result);
      tools.push(...page.tools);

      if (page.nextCursor === undefined) return tools;
      if (seenCursors.has(page.nextCursor)) {
        throw new BadGatewayException({
          code: 'MCP_INVALID_RESPONSE',
          message: 'MCP tools/list returned a repeated pagination cursor',
        });
      }

      seenCursors.add(page.nextCursor);
      cursor = page.nextCursor;
    }

    throw new BadGatewayException({
      code: 'MCP_INVALID_RESPONSE',
      message: `${providerName} MCP tools/list exceeded the 64-page safety limit`,
    });
  }

  private buildToolHeaders(
    tool: McpToolDefinition,
    argumentsValue: McpToolArguments,
  ): Record<string, string> {
    try {
      return buildMcpParamHeaders(tool.inputSchema, argumentsValue);
    } catch (error) {
      this.throwInvalidResponse(error);
    }
  }

  private parseToolPage(result: unknown) {
    try {
      return parseMcpToolListPage(result);
    } catch (error) {
      this.throwInvalidResponse(error);
    }
  }

  private throwInvalidResponse(error: unknown): never {
    if (error instanceof McpProtocolShapeError) {
      throw new BadGatewayException({
        code: 'MCP_INVALID_RESPONSE',
        message: error.message,
      });
    }
    throw error;
  }
}
