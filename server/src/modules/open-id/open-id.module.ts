import { Module } from '@nestjs/common';
import { AuthModule } from '@server/root/modules/auth/auth.module';
import { GatewayCredentialService } from '@server/root/modules/open-id/gateway-credential.service';
import { OpenIdController } from '@server/root/modules/open-id/open-id.controller';
import { OpenIdService } from '@server/root/modules/open-id/open-id.service';
import { TrialService } from '@server/root/modules/open-id/trial.service';

@Module({
  imports: [AuthModule],
  controllers: [OpenIdController],
  providers: [GatewayCredentialService, OpenIdService, TrialService],
  exports: [GatewayCredentialService],
})
export class OpenIdModule {}
