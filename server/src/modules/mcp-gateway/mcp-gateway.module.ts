import { Module } from '@nestjs/common';
import { LocalAgentModule } from '@server/root/modules/local-agent/local-agent.module';
import { McpConnectionsModule } from '@server/root/modules/mcp-connections/mcp-connections.module';
import { GatewayAccessGuard } from '@server/root/modules/mcp-gateway/gateway-access.guard';
import { McpGatewayController } from '@server/root/modules/mcp-gateway/mcp-gateway.controller';
import { McpGatewayService } from '@server/root/modules/mcp-gateway/mcp-gateway.service';
import { GptResponseInterceptor } from '@server/root/modules/mcp-gateway/response/gpt-response.interceptor';
import { GptResponseService } from '@server/root/modules/mcp-gateway/response/gpt-response.service';
import { OpenIdModule } from '@server/root/modules/open-id/open-id.module';

@Module({
  imports: [OpenIdModule, McpConnectionsModule, LocalAgentModule],
  controllers: [McpGatewayController],
  providers: [GatewayAccessGuard, McpGatewayService, GptResponseService, GptResponseInterceptor],
})
export class McpGatewayModule {}
