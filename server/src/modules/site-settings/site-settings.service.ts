import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';
import { AuthService } from '@server/root/modules/auth/auth.service';
import type { UpdateLandingVideoDto } from '@server/root/modules/site-settings/dto/update-landing-video.dto';

const LANDING_VIDEO_KEY = 'landing_walkthrough_youtube_id';
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

type SiteSettingRow = {
  key: string;
  value: { videoId?: unknown };
  updated_at: string;
};

@Injectable()
export class SiteSettingsService {
  constructor(
    private readonly auth: AuthService,
    private readonly supabase: SupabaseService,
  ) {}

  async getPublicLandingVideo() {
    const row = await this.findLandingVideo();
    return {
      youtubeVideoId:
        typeof row?.value.videoId === 'string' && YOUTUBE_ID.test(row.value.videoId)
          ? row.value.videoId
          : null,
    };
  }

  async getAdminLandingVideo(request: Request) {
    await this.requireAdmin(request);
    return this.getPublicLandingVideo();
  }

  async updateLandingVideo(request: Request, dto: UpdateLandingVideoDto) {
    const admin = await this.requireAdmin(request);
    const input = dto.youtubeInput.trim();
    const client = this.supabase.createServiceRoleClient();

    if (!input) {
      const { error } = await client
        .from('site_settings')
        .delete()
        .eq('key', LANDING_VIDEO_KEY);

      if (error) this.throwStorageUnavailable();
      return { youtubeVideoId: null };
    }

    const videoId = this.extractYoutubeVideoId(input);
    if (!videoId) {
      throw new BadRequestException({
        code: 'INVALID_YOUTUBE_VIDEO',
        message: 'Provide a YouTube URL, video ID, or iframe embed code',
      });
    }

    const { error } = await client.from('site_settings').upsert(
      {
        key: LANDING_VIDEO_KEY,
        value: { videoId },
        updated_by: admin.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    );

    if (error) this.throwStorageUnavailable();
    return { youtubeVideoId: videoId };
  }

  private async findLandingVideo(): Promise<SiteSettingRow | null> {
    const client = this.supabase.createServiceRoleClient();
    const { data, error } = await client
      .from('site_settings')
      .select('key,value,updated_at')
      .eq('key', LANDING_VIDEO_KEY)
      .maybeSingle<SiteSettingRow>();

    if (error) this.throwStorageUnavailable();
    return data ?? null;
  }

  private async requireAdmin(request: Request) {
    const user = await this.auth.requireUser(request);
    if (user.systemRole !== 'admin') {
      throw new ForbiddenException({
        code: 'ADMIN_REQUIRED',
        message: 'Administrator access is required',
      });
    }
    return user;
  }

  private extractYoutubeVideoId(input: string): string | null {
    if (YOUTUBE_ID.test(input)) return input;

    const iframeSrc = input.match(
      /<iframe[^>]+src=["']([^"']+)["'][^>]*>/i,
    )?.[1];
    const candidate = iframeSrc ?? input;

    let url: URL;
    try {
      url = new URL(candidate);
    } catch {
      return null;
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    let id: string | null = null;

    if (host === 'youtu.be') {
      id = url.pathname.split('/').filter(Boolean)[0] ?? null;
    } else if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      if (url.pathname === '/watch') {
        id = url.searchParams.get('v');
      } else {
        const parts = url.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live'].includes(parts[0] ?? '')) {
          id = parts[1] ?? null;
        }
      }
    }

    return id && YOUTUBE_ID.test(id) ? id : null;
  }

  private throwStorageUnavailable(): never {
    throw new ServiceUnavailableException({
      code: 'SITE_SETTINGS_STORAGE_UNAVAILABLE',
      message: 'Site settings storage is unavailable',
    });
  }
}
