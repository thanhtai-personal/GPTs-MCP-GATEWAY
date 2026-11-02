import { Module } from '@nestjs/common';
import { AuthModule } from '@server/root/modules/auth/auth.module';
import { McpGatewayModule } from '@server/root/modules/mcp-gateway/mcp-gateway.module';
import { McpServerController } from '@server/root/modules/mcp-server/mcp-server.controller';
import { McpServerService } from '@server/root/modules/mcp-server/mcp-server.service';
import { OpenIdModule } from '@server/root/modules/open-id/open-id.module';

@Module({
  imports: [AuthModule, OpenIdModule, McpGatewayModule],
  controllers: [McpServerController],
  providers: [McpServerService],
})
export class McpServerModule {}
