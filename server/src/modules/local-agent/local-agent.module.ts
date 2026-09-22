import { Module } from '@nestjs/common';
import { GatewayAccessGuard } from '@server/root/modules/mcp-gateway/gateway-access.guard';
import { LocalAgentController } from '@server/root/modules/local-agent/local-agent.controller';
import { LocalAgentService } from '@server/root/modules/local-agent/local-agent.service';
import { OpenIdModule } from '@server/root/modules/open-id/open-id.module';

@Module({
  imports: [OpenIdModule],
  controllers: [LocalAgentController],
  providers: [GatewayAccessGuard, LocalAgentService],
  exports: [LocalAgentService],
})
export class LocalAgentModule {}
