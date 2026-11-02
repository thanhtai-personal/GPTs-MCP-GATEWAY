import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '@server/root/modules/auth/auth.service';
import { OAuthAuthorizationService } from '@server/root/modules/auth/oauth-authorization.service';

@Controller('account')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly oauthAuthorization: OAuthAuthorizationService,
  ) {}

  @Get('me')
  getMe(@Req() request: Request) {
    return this.auth.requireUser(request);
  }

  /** Consent page: details of a pending MCP client authorization. */
  @Get('oauth/authorizations/:authorizationId')
  oauthAuthorizationDetails(
    @Req() request: Request,
    @Param('authorizationId') authorizationId: string,
  ) {
    return this.oauthAuthorization.details(request, authorizationId);
  }

  @Post('oauth/authorizations/:authorizationId/approve')
  approveOAuthAuthorization(
    @Req() request: Request,
    @Param('authorizationId') authorizationId: string,
  ) {
    return this.oauthAuthorization.decide(request, authorizationId, 'approve');
  }

  @Post('oauth/authorizations/:authorizationId/deny')
  denyOAuthAuthorization(
    @Req() request: Request,
    @Param('authorizationId') authorizationId: string,
  ) {
    return this.oauthAuthorization.decide(request, authorizationId, 'deny');
  }
}
