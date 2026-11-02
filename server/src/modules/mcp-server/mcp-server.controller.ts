import {
  Controller,
  Delete,
  Get,
  HttpException,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { AuthService } from '@server/root/modules/auth/auth.service';
import { mcpOAuthClientId } from '@server/root/modules/auth/oauth-token-claims';
import {
  type JsonRpcResponse,
  type McpSession,
  McpServerService,
} from '@server/root/modules/mcp-server/mcp-server.service';
import { mcpAuthChallenge } from '@server/root/modules/mcp-server/mcp-server.oauth';

const MAX_BATCH = 20;

/**
 * Remote MCP endpoint (Streamable HTTP, stateless, JSON responses) for
 * ChatGPT / Claude / other MCP clients. Authentication is OAuth 2.1 through
 * the Supabase OAuth server; a missing or invalid token returns 401 with a
 * WWW-Authenticate challenge so clients start OAuth discovery.
 */
@Controller('mcp')
export class McpServerController {
  constructor(
    private readonly config: AppConfigService,
    private readonly auth: AuthService,
    private readonly mcp: McpServerService,
  ) {}

  @Post()
  async handle(@Req() request: Request, @Res() response: Response): Promise<void> {
    const session = await this.authenticate(request, response);
    if (!session) return;

    const body: unknown = request.body;
    const messages = Array.isArray(body) ? body : [body];
    if (!messages.length || messages.length > MAX_BATCH) {
      response.status(400).json({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32600, message: 'Invalid Request' },
      });
      return;
    }

    const replies: JsonRpcResponse[] = [];
    for (const message of messages) {
      const reply = await this.mcp.handleMessage(session, message);
      if (reply) replies.push(reply);
    }

    response.setHeader('Cache-Control', 'no-store');
    if (!replies.length) {
      response.status(202).end();
      return;
    }
    response.status(200).json(Array.isArray(body) ? replies : replies[0]);
  }

  /** No server-initiated SSE stream: stateless JSON-only transport. */
  @Get()
  async stream(@Req() request: Request, @Res() response: Response): Promise<void> {
    if (!(await this.authenticate(request, response))) return;
    response.setHeader('Allow', 'POST');
    response.status(405).json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32000, message: 'Method not allowed: use POST' },
    });
  }

  /** Stateless server: there is no session to terminate. */
  @Delete()
  async terminate(@Req() request: Request, @Res() response: Response): Promise<void> {
    if (!(await this.authenticate(request, response))) return;
    response.setHeader('Allow', 'POST');
    response.status(405).end();
  }

  private async authenticate(
    request: Request,
    response: Response,
  ): Promise<McpSession | null> {
    const header = request.headers.authorization ?? '';
    const match = /^Bearer\s+(\S+)$/iu.exec(header);
    const token = match?.[1];
    const clientId = token
      ? mcpOAuthClientId(token, {
          issuer: this.config.supabaseOAuthIssuerUrl,
          audience: this.config.mcpOAuthAudience,
        })
      : null;
    if (!token || !clientId) {
      this.challenge(response);
      return null;
    }
    try {
      const user = await this.auth.requireMcpOAuthUser(token);
      return { user, clientId };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.challenge(response);
        return null;
      }
      if (error instanceof HttpException) {
        response.status(error.getStatus()).json(error.getResponse());
        return null;
      }
      throw error;
    }
  }

  private challenge(response: Response): void {
    response.setHeader('WWW-Authenticate', mcpAuthChallenge(this.config));
    response.setHeader('Cache-Control', 'no-store');
    response.status(401).json({
      error: 'invalid_token',
      error_description: 'MCP Gateway OAuth authentication required',
    });
  }
}
