import { Module } from '@nestjs/common';
import { AuthModule } from '@server/root/modules/auth/auth.module';
import { GptIntegrationController } from '@server/root/modules/gpt-integration/gpt-integration.controller';
import { GptIntegrationService } from '@server/root/modules/gpt-integration/gpt-integration.service';

@Module({
  imports: [AuthModule],
  controllers: [GptIntegrationController],
  providers: [GptIntegrationService],
})
export class GptIntegrationModule {}
