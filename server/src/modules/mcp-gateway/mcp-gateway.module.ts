import { Module } from '@nestjs/common';
import { McpConnectionsModule } from '@server/root/modules/mcp-connections/mcp-connections.module';
import { GatewayAccessGuard } from '@server/root/modules/mcp-gateway/gateway-access.guard';
import { McpGatewayController } from '@server/root/modules/mcp-gateway/mcp-gateway.controller';
import { McpGatewayService } from '@server/root/modules/mcp-gateway/mcp-gateway.service';
import { OpenIdModule } from '@server/root/modules/open-id/open-id.module';

@Module({
  imports: [OpenIdModule, McpConnectionsModule],
  controllers: [McpGatewayController],
  providers: [GatewayAccessGuard, McpGatewayService],
})
export class McpGatewayModule {}
