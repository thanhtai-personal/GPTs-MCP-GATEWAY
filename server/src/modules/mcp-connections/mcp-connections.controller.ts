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
import { AuthService } from '@server/root/modules/auth/auth.service';
import { CompleteMcpOAuthDto } from '@server/root/modules/mcp-connections/dto/complete-mcp-oauth.dto';
import { SaveMcpConnectionDto } from '@server/root/modules/mcp-connections/dto/save-mcp-connection.dto';
import { StartMcpOAuthDto } from '@server/root/modules/mcp-connections/dto/start-mcp-oauth.dto';
import { GoogleWorkspaceOAuthService } from '@server/root/modules/mcp-connections/google-workspace-oauth.service';
import { FacebookOAuthService } from '@server/root/modules/mcp-connections/facebook-oauth.service';
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';

const FORWARDED_PARAMS = [
  'code',
  'state',
  'iss',
  'error',
  'error_description',
] as const;

@Controller('mcp-connections')
export class McpConnectionsController {
  constructor(
    private readonly config: AppConfigService,
    private readonly connections: McpConnectionsService,
    private readonly googleWorkspaceOAuth: GoogleWorkspaceOAuthService,
    private readonly facebookOAuth: FacebookOAuthService,
    private readonly auth: AuthService,
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
  startGoogleWorkspaceOAuth(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    return this.googleWorkspaceOAuth.start(request);
  }

  @Get('google-workspace/oauth/callback')
  googleWorkspaceOAuthCallback(
    @Query() query: Record<string, unknown>,
    @Res() response: Response,
  ) {
    this.forwardToWeb(response, 'google-workspace', query);
  }

  @Post('google-workspace/oauth/complete')
  async completeGoogleWorkspaceOAuth(
    @Req() request: Request,
    @Body() dto: CompleteMcpOAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    const user = await this.auth.requireUser(request);
    await this.googleWorkspaceOAuth.complete(
      dto.code,
      dto.state,
      dto.browserNonce,
      user.id,
    );
    return {
      provider: 'google-workspace',
      status: 'connected' as const,
      returnTo: '#mcp-services',
    };
  }

  @Post('facebook/oauth/start')
  startFacebookOAuth(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    return this.facebookOAuth.start(request);
  }

  @Get('facebook/oauth/callback')
  facebookOAuthCallback(@Query() query: Record<string, unknown>, @Res() response: Response) {
    this.forwardToWeb(response, 'facebook', query);
  }

  @Post('facebook/oauth/complete')
  async completeFacebookOAuth(@Req() request: Request, @Body() dto: CompleteMcpOAuthDto, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    const user = await this.auth.requireUser(request);
    await this.facebookOAuth.complete(dto.code, dto.state, dto.browserNonce, user.id);
    return { provider: 'facebook', status: 'connected' as const, returnTo: '#mcp-services' };
  }

  @Post(':provider/oauth/start')
  startOAuth(
    @Req() request: Request,
    @Param('provider') provider: string,
    @Body() dto: StartMcpOAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    return this.connections.startOAuth(request, provider, dto);
  }

  /**
   * Provider redirect target (registered redirect_uri). It does not complete
   * the flow: it forwards code/state to the web app, which completes it with
   * the signed-in user's token and the browser nonce it kept at start.
   */
  @Get(':provider/oauth/callback')
  oauthCallback(
    @Param('provider') provider: string,
    @Query() query: Record<string, unknown>,
    @Res() response: Response,
  ) {
    this.forwardToWeb(response, provider, query);
  }

  @Post(':provider/oauth/complete')
  async completeOAuth(
    @Req() request: Request,
    @Param('provider') provider: string,
    @Body() dto: CompleteMcpOAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    const user = await this.auth.requireUser(request);
    const result = await this.connections.completeOAuth(
      provider,
      dto.code,
      dto.state,
      dto.iss,
      dto.browserNonce,
      user.id,
    );
    return {
      provider,
      status: 'connected' as const,
      returnTo: result.returnTo ?? '#mcp-services',
    };
  }

  @Delete(':provider')
  remove(@Req() request: Request, @Param('provider') provider: string) {
    return this.connections.removeOwn(request, provider);
  }

  private forwardToWeb(
    response: Response,
    provider: string,
    query: Record<string, unknown>,
  ): void {
    const base = this.config.webBaseUrl.replace(/\/+$/u, '');
    const url = new URL(`${base}/oauth/complete`);
    url.searchParams.set('provider', provider);
    for (const key of FORWARDED_PARAMS) {
      const value = query[key];
      if (typeof value === 'string' && value.length <= 8192) {
        url.searchParams.set(key, value);
      }
    }
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.redirect(303, url.toString());
  }
}
