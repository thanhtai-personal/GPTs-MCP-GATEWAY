import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UpdateLandingVideoDto } from '@server/root/modules/site-settings/dto/update-landing-video.dto';
import { SiteSettingsService } from '@server/root/modules/site-settings/site-settings.service';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly settings: SiteSettingsService) {}

  @Get('public/landing-video')
  getPublicLandingVideo() {
    return this.settings.getPublicLandingVideo();
  }

  @Get('admin/landing-video')
  getAdminLandingVideo(@Req() request: Request) {
    return this.settings.getAdminLandingVideo(request);
  }

  @Put('admin/landing-video')
  updateLandingVideo(
    @Req() request: Request,
    @Body() dto: UpdateLandingVideoDto,
  ) {
    return this.settings.updateLandingVideo(request, dto);
  }
}
