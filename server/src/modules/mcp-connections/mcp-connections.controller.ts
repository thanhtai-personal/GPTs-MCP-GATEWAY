import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
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
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';

@Controller('mcp-connections')
export class McpConnectionsController {
  constructor(
    private readonly config: AppConfigService,
    private readonly connections: McpConnectionsService,
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

  @Post(':provider/oauth/start')
  startOAuth(
    @Req() request: Request,
    @Param('provider') provider: string,
  ) {
    return this.connections.startOAuth(request, provider);
  }

  @Get(':provider/oauth/callback')
  async oauthCallback(
    @Param('provider') provider: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('iss') issuer: string | undefined,
    @Query('error') oauthError: string | undefined,
    @Res() response: Response,
  ) {
    if (oauthError || !code || !state) {
      response.redirect(
        this.webRedirect(provider, 'error', oauthError || 'MCP_OAUTH_CALLBACK_INVALID'),
      );
      return;
    }

    try {
      await this.connections.completeOAuth(provider, code, state, issuer);
      response.redirect(this.webRedirect(provider, 'connected'));
    } catch (error) {
      response.redirect(
        this.webRedirect(provider, 'error', this.errorCode(error)),
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
  ): string {
    const base = this.config.webBaseUrl.replace(/\/+$/u, '');
    const url = new URL(`${base}/app`);
    url.searchParams.set('mcpOAuth', provider);
    url.searchParams.set('status', status);
    if (code) url.searchParams.set('code', code);
    return url.toString();
  }

  private errorCode(error: unknown): string {
    if (!(error instanceof HttpException)) {
      return 'MCP_OAUTH_FAILED';
    }

    const response = error.getResponse();
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
