import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '@server/root/modules/auth/auth.service';

@Controller('account')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('me')
  getMe(@Req() request: Request) {
    return this.auth.requireUser(request);
  }
}
