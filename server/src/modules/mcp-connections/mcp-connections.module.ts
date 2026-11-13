import { Module } from '@nestjs/common';
import { AuthModule } from '@server/root/modules/auth/auth.module';
import { FigmaMcpAdapter } from '@server/root/modules/mcp-gateway/providers/figma/figma-mcp.adapter';
import { GithubMcpAdapter } from '@server/root/modules/mcp-gateway/providers/github/github-mcp.adapter';
import { GoogleDocsMcpAdapter } from '@server/root/modules/mcp-gateway/providers/google/google-docs-mcp.adapter';
import { GoogleWorkspaceApiClient } from '@server/root/modules/mcp-gateway/providers/google/google-workspace-api.client';
import { GoogleDriveApiClient } from '@server/root/modules/mcp-gateway/providers/google-drive/google-drive-api.client';
import { GoogleDriveAdapter } from '@server/root/modules/mcp-gateway/providers/google-drive/google-drive.adapter';
import { GoogleSheetsMcpAdapter } from '@server/root/modules/mcp-gateway/providers/google/google-sheets-mcp.adapter';
import { GoogleWorkspaceTokenService } from '@server/root/modules/mcp-gateway/providers/google/google-workspace-token.service';
import { LovableMcpAdapter } from '@server/root/modules/mcp-gateway/providers/lovable/lovable-mcp.adapter';
import { NotionMcpAdapter } from '@server/root/modules/mcp-gateway/providers/notion/notion-mcp.adapter';
import { McpProviderRegistry } from '@server/root/modules/mcp-gateway/providers/mcp-provider.registry';
import { MCP_PROVIDER_ADAPTERS } from '@server/root/modules/mcp-gateway/providers/mcp-provider.tokens';
import type { McpProviderAdapter } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
import { RemoteMcpHttpClient } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.client';
import { RemoteMcpHttpTransport } from '@server/root/modules/mcp-gateway/providers/remote/remote-mcp-http.transport';
import { StitchMcpAdapter } from '@server/root/modules/mcp-gateway/providers/stitch/stitch-mcp.adapter';
import { McpConnectionsController } from '@server/root/modules/mcp-connections/mcp-connections.controller';
import { FacebookContentStudioController } from '@server/root/modules/mcp-connections/facebook-content-studio.controller';
import { GoogleWorkspaceOAuthService } from '@server/root/modules/mcp-connections/google-workspace-oauth.service';
import { FacebookOAuthService } from '@server/root/modules/mcp-connections/facebook-oauth.service';
import { FacebookGraphApiClient } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-graph-api.client';
import { FacebookMcpAdapter } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-mcp.adapter';
import { FacebookPagePostRepository } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-page-post.repository';
import { FacebookPagePublishingService } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-page-publishing.service';
import { FacebookPagePublishingWorker } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-page-publishing.worker';
import { McpCredentialCodec } from '@server/root/modules/mcp-connections/mcp-credential-codec.service';
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';
import { McpOAuthClientRegistrationClient } from '@server/root/modules/mcp-connections/mcp-oauth-client-registration.client';
import { McpOAuthProtocolClient } from '@server/root/modules/mcp-connections/mcp-oauth-protocol.client';
import { McpOAuthService } from '@server/root/modules/mcp-connections/mcp-oauth.service';
import { OAuthTransactionService } from '@server/root/modules/mcp-connections/oauth-transaction.service';

@Module({
  imports: [AuthModule],
  controllers: [McpConnectionsController, FacebookContentStudioController],
  providers: [
    RemoteMcpHttpTransport,
    RemoteMcpHttpClient,
    StitchMcpAdapter,
    LovableMcpAdapter,
    FigmaMcpAdapter,
    GithubMcpAdapter,
    GoogleWorkspaceTokenService,
    GoogleWorkspaceApiClient,
    GoogleDriveApiClient,
    GoogleDriveAdapter,
    GoogleDocsMcpAdapter,
    GoogleSheetsMcpAdapter,
    NotionMcpAdapter,
    FacebookGraphApiClient,
    FacebookPagePostRepository,
    FacebookPagePublishingService,
    FacebookPagePublishingWorker,
    FacebookMcpAdapter,
    {
      provide: MCP_PROVIDER_ADAPTERS,
      inject: [
        StitchMcpAdapter,
        LovableMcpAdapter,
        FigmaMcpAdapter,
        GithubMcpAdapter,
        GoogleDriveAdapter,
        GoogleDocsMcpAdapter,
        GoogleSheetsMcpAdapter,
        NotionMcpAdapter,
        FacebookMcpAdapter,
      ],
      useFactory: (
        stitch: StitchMcpAdapter,
        lovable: LovableMcpAdapter,
        figma: FigmaMcpAdapter,
        github: GithubMcpAdapter,
        googleDrive: GoogleDriveAdapter,
        googleDocs: GoogleDocsMcpAdapter,
        googleSheets: GoogleSheetsMcpAdapter,
        notion: NotionMcpAdapter,
        facebook: FacebookMcpAdapter,
      ): McpProviderAdapter[] => [
        stitch,
        lovable,
        figma,
        github,
        googleDrive,
        googleDocs,
        googleSheets,
        notion,
        facebook,
      ],
    },
    McpProviderRegistry,
    McpCredentialCodec,
    McpOAuthClientRegistrationClient,
    McpOAuthProtocolClient,
    McpOAuthService,
    OAuthTransactionService,
    McpConnectionsService,
    GoogleWorkspaceOAuthService,
    FacebookOAuthService,
  ],
  exports: [McpConnectionsService, McpProviderRegistry],
})
export class McpConnectionsModule {}
