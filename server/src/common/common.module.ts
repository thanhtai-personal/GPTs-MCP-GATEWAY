import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { SecretCipherService } from '@server/root/common/security/secret-cipher.service';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';

@Global()
@Module({
  providers: [AppConfigService, SupabaseService, SecretCipherService],
  exports: [AppConfigService, SupabaseService, SecretCipherService],
})
export class CommonModule {}
