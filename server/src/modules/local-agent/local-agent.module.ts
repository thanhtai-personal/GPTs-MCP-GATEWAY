import { Module } from '@nestjs/common';
import { AuthModule } from '@server/root/modules/auth/auth.module';
import { GatewayAccessGuard } from '@server/root/modules/mcp-gateway/gateway-access.guard';
import { LocalAgentController } from '@server/root/modules/local-agent/local-agent.controller';
import { LocalAgentManagementService } from '@server/root/modules/local-agent/local-agent-management.service';
import { LocalAgentService } from '@server/root/modules/local-agent/local-agent.service';
import { OpenIdModule } from '@server/root/modules/open-id/open-id.module';

@Module({
  imports: [AuthModule, OpenIdModule],
  controllers: [LocalAgentController],
  providers: [GatewayAccessGuard, LocalAgentManagementService, LocalAgentService],
  exports: [LocalAgentService],
})
export class LocalAgentModule {}
