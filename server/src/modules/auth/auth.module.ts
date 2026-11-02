import { Module } from '@nestjs/common';
import { AuthController } from '@server/root/modules/auth/auth.controller';
import { AuthService } from '@server/root/modules/auth/auth.service';
import { OAuthAuthorizationService } from '@server/root/modules/auth/oauth-authorization.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, OAuthAuthorizationService],
  exports: [AuthService],
})
export class AuthModule {}
