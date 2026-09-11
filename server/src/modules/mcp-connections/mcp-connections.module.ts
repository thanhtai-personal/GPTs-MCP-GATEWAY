import { Module } from '@nestjs/common';
import { AuthModule } from '@server/root/modules/auth/auth.module';
import { McpConnectionsController } from '@server/root/modules/mcp-connections/mcp-connections.controller';
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';
import { McpProviderRegistry } from '@server/root/modules/mcp-gateway/providers/mcp-provider.registry';
import { StitchMcpAdapter } from '@server/root/modules/mcp-gateway/providers/stitch/stitch-mcp.adapter';

@Module({
  imports: [AuthModule],
  controllers: [McpConnectionsController],
  providers: [McpConnectionsService, McpProviderRegistry, StitchMcpAdapter],
  exports: [McpConnectionsService, McpProviderRegistry, StitchMcpAdapter],
})
export class McpConnectionsModule {}
