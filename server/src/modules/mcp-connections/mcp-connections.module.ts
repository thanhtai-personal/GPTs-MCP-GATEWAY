import { Module } from '@nestjs/common';
import { AuthModule } from '@server/root/modules/auth/auth.module';
import { McpConnectionsController } from '@server/root/modules/mcp-connections/mcp-connections.controller';
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';
import { McpProviderRegistry } from '@server/root/modules/mcp-gateway/providers/mcp-provider.registry';
import {
  MCP_PROVIDER_ADAPTERS,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.tokens';
import type {
  McpProviderAdapter,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
import { StitchMcpAdapter } from '@server/root/modules/mcp-gateway/providers/stitch/stitch-mcp.adapter';

@Module({
  imports: [AuthModule],
  controllers: [McpConnectionsController],
  providers: [
    StitchMcpAdapter,
    {
      provide: MCP_PROVIDER_ADAPTERS,
      inject: [StitchMcpAdapter],
      useFactory: (stitch: StitchMcpAdapter): McpProviderAdapter[] => [stitch],
    },
    McpProviderRegistry,
    McpConnectionsService,
  ],
  exports: [McpConnectionsService, McpProviderRegistry],
})
export class McpConnectionsModule {}
