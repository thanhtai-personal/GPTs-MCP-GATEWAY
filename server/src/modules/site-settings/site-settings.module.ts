import { Module } from '@nestjs/common';
import { AuthModule } from '@server/root/modules/auth/auth.module';
import { SiteSettingsController } from '@server/root/modules/site-settings/site-settings.controller';
import { SiteSettingsService } from '@server/root/modules/site-settings/site-settings.service';

@Module({
  imports: [AuthModule],
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService],
})
export class SiteSettingsModule {}
