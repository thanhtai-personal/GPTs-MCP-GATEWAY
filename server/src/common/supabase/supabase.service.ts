import { Injectable } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppConfigService } from '@server/root/common/config/app-config.service';

@Injectable()
export class SupabaseService {
  constructor(private readonly config: AppConfigService) {}

  createAnonClient(): SupabaseClient {
    return createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  createServiceRoleClient(): SupabaseClient {
    return createClient(
      this.config.supabaseUrl,
      this.config.supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }
}
