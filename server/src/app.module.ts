import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from '@server/root/common/common.module';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { AuditModule } from '@server/root/modules/audit/audit.module';
import { AuthModule } from '@server/root/modules/auth/auth.module';
import { GptIntegrationModule } from '@server/root/modules/gpt-integration/gpt-integration.module';
import { HealthModule } from '@server/root/modules/health/health.module';
import { McpConnectionsModule } from '@server/root/modules/mcp-connections/mcp-connections.module';
import { McpGatewayModule } from '@server/root/modules/mcp-gateway/mcp-gateway.module';
import { OpenIdModule } from '@server/root/modules/open-id/open-id.module';

@Module({
  imports: [
    CommonModule,
    AuditModule,
    ThrottlerModule.forRootAsync({
      imports: [CommonModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => [
        {
          limit: config.rateLimitPerMinute,
          ttl: 60_000,
        },
      ],
    }),
    HealthModule,
    AuthModule,
    McpConnectionsModule,
    OpenIdModule,
    GptIntegrationModule,
    McpGatewayModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
