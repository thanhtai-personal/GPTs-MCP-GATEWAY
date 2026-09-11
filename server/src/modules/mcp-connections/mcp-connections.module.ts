import { Module } from '@nestjs/common';
import { AuthModule } from '@server/root/modules/auth/auth.module';
import { FigmaMcpAdapter } from '@server/root/modules/mcp-gateway/providers/figma/figma-mcp.adapter';
import { LovableMcpAdapter } from '@server/root/modules/mcp-gateway/providers/lovable/lovable-mcp.adapter';
import { McpProviderRegistry } from '@server/root/modules/mcp-gateway/providers/mcp-provider.registry';
import {
  MCP_PROVIDER_ADAPTERS,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.tokens';
import type {
  McpProviderAdapter,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
import { RemoteMcpHttpClient } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.client';
import { RemoteMcpHttpTransport } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.transport';
import { StitchMcpAdapter } from '@server/root/modules/mcp-gateway/providers/stitch/stitch-mcp.adapter';
import { McpConnectionsController } from '@server/root/modules/mcp-connections/mcp-connections.controller';
import { McpCredentialCodec } from '@server/root/modules/mcp-connections/mcp-credential-codec.service';
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';
import { McpOAuthProtocolClient } from '@server/root/modules/mcp-connections/mcp-oauth-protocol.client';
import { McpOAuthService } from '@server/root/modules/mcp-connections/mcp-oauth.service';

@Module({
  imports: [AuthModule],
  controllers: [McpConnectionsController],
  providers: [
    RemoteMcpHttpTransport,
    RemoteMcpHttpClient,
    StitchMcpAdapter,
    LovableMcpAdapter,
    FigmaMcpAdapter,
    {
      provide: MCP_PROVIDER_ADAPTERS,
      inject: [StitchMcpAdapter, LovableMcpAdapter, FigmaMcpAdapter],
      useFactory: (
        stitch: StitchMcpAdapter,
        lovable: LovableMcpAdapter,
        figma: FigmaMcpAdapter,
      ): McpProviderAdapter[] => [stitch, lovable, figma],
    },
    McpProviderRegistry,
    McpCredentialCodec,
    McpOAuthProtocolClient,
    McpOAuthService,
    McpConnectionsService,
  ],
  exports: [McpConnectionsService, McpProviderRegistry],
})
export class McpConnectionsModule {}
