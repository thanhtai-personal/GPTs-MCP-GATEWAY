import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { SaveMcpConnectionDto } from '@server/root/modules/mcp-connections/dto/save-mcp-connection.dto';
import { StartMcpOAuthDto } from '@server/root/modules/mcp-connections/dto/start-mcp-oauth.dto';
import { GoogleWorkspaceOAuthService } from '@server/root/modules/mcp-connections/google-workspace-oauth.service';
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';
import { OAuthTransactionService } from '@server/root/modules/mcp-connections/oauth-transaction.service';

@Controller('mcp-connections')
export class McpConnectionsController {
  constructor(
    private readonly config: AppConfigService,
    private readonly connections: McpConnectionsService,
    private readonly googleWorkspaceOAuth: GoogleWorkspaceOAuthService,
    private readonly transactions: OAuthTransactionService,
  ) {}

  @Get('providers')
  providers(@Req() request: Request) {
    return this.connections.listSupportedProviders(request);
  }

  @Get()
  list(@Req() request: Request) {
    return this.connections.listOwn(request);
  }

  @Post('test')
  test(@Req() request: Request, @Body() dto: SaveMcpConnectionDto) {
    return this.connections.testOwn(request, dto);
  }

  @Put()
  save(@Req() request: Request, @Body() dto: SaveMcpConnectionDto) {
    return this.connections.saveOwn(request, dto);
  }

  @Post('google-workspace/oauth/start')
  async startGoogleWorkspaceOAuth(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { browserNonce, ...result } = await this.googleWorkspaceOAuth.start(request);
    response.setHeader('Cache-Control', 'no-store');
    this.transactions.setBrowserCookie(response, 'google-workspace', browserNonce);
    return result;
  }

  @Get('google-workspace/oauth/callback')
  async googleWorkspaceOAuthCallback(
    @Req() request: Request,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') oauthError: string | undefined,
    @Res() response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    const returnTo = '#mcp-services';

    if (oauthError || !code || !state) {
      this.transactions.clearBrowserCookie(response, 'google-workspace');
      response.redirect(
        this.webRedirect(
          'google-workspace',
          'error',
          oauthError || 'MCP_OAUTH_CALLBACK_INVALID',
          returnTo,
        ),
      );
      return;
    }

    try {
      await this.googleWorkspaceOAuth.complete(
        code,
        state,
        this.transactions.readBrowserCookie(request, 'google-workspace'),
      );
      this.transactions.clearBrowserCookie(response, 'google-workspace');
      response.redirect(
        this.webRedirect(
          'google-workspace',
          'connected',
          undefined,
          returnTo,
        ),
      );
    } catch (error) {
      this.transactions.clearBrowserCookie(response, 'google-workspace');
      response.redirect(
        this.webRedirect(
          'google-workspace',
          'error',
          this.errorCode(error),
          returnTo,
        ),
      );
    }
  }

  @Post(':provider/oauth/start')
  async startOAuth(
    @Req() request: Request,
    @Param('provider') provider: string,
    @Body() dto: StartMcpOAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { browserNonce, ...result } = await this.connections.startOAuth(request, provider, dto);
    response.setHeader('Cache-Control', 'no-store');
    this.transactions.setBrowserCookie(response, provider, browserNonce);
    return result;
  }

  @Get(':provider/oauth/callback')
  async oauthCallback(
    @Req() request: Request,
    @Param('provider') provider: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('iss') issuer: string | undefined,
    @Query('error') oauthError: string | undefined,
    @Res() response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    let returnTo: string | undefined;
    try {
      returnTo = state
        ? this.connections.oauthReturnTo(provider, state)
        : undefined;
    } catch {
      returnTo = undefined;
    }

    if (oauthError || !code || !state) {
      this.transactions.clearBrowserCookie(response, provider);
      response.redirect(
        this.webRedirect(
          provider,
          'error',
          oauthError || 'MCP_OAUTH_CALLBACK_INVALID',
          returnTo,
        ),
      );
      return;
    }

    try {
      await this.connections.completeOAuth(
        provider,
        code,
        state,
        issuer,
        this.transactions.readBrowserCookie(request, provider),
      );
      this.transactions.clearBrowserCookie(response, provider);
      response.redirect(
        this.webRedirect(provider, 'connected', undefined, returnTo),
      );
    } catch (error) {
      this.transactions.clearBrowserCookie(response, provider);
      response.redirect(
        this.webRedirect(
          provider,
          'error',
          this.errorCode(error),
          returnTo,
        ),
      );
    }
  }

  @Delete(':provider')
  remove(@Req() request: Request, @Param('provider') provider: string) {
    return this.connections.removeOwn(request, provider);
  }

  private webRedirect(
    provider: string,
    status: 'connected' | 'error',
    code?: string,
    returnTo?: string,
  ): string {
    const base = this.config.webBaseUrl.replace(/\/+$/u, '');
    const url = new URL(`${base}/app`);
    url.searchParams.set('mcpOAuth', provider);
    url.searchParams.set('status', status);
    if (code) url.searchParams.set('code', code);
    url.hash = (returnTo ?? '#mcp-services').replace(/^#/u, '');
    return url.toString();
  }

  private errorCode(error: unknown): string {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('getResponse' in error) ||
      typeof error.getResponse !== 'function'
    ) {
      return 'MCP_OAUTH_FAILED';
    }

    const response: unknown = error.getResponse();
    if (
      typeof response === 'object' &&
      response !== null &&
      'code' in response &&
      typeof response.code === 'string'
    ) {
      return response.code;
    }

    return 'MCP_OAUTH_FAILED';
  }
}
