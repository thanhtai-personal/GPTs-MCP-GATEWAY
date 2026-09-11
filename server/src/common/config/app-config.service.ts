import { Injectable } from '@nestjs/common';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function integer(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

@Injectable()
export class AppConfigService {
  readonly port = integer('PORT', 5657);
  readonly webBaseUrl = process.env.WEB_BASE_URL?.trim() || 'http://127.0.0.1:5656';
  readonly publicBaseUrl =
    process.env.GATEWAY_PUBLIC_BASE_URL?.trim() || `http://127.0.0.1:${this.port}`;
  readonly corsAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? this.webBaseUrl)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  readonly rateLimitPerMinute = integer('GATEWAY_RATE_LIMIT_PER_MINUTE', 60);
  readonly upstreamTimeoutMs = integer('MCP_UPSTREAM_TIMEOUT_MS', 30_000);

  get supabaseUrl(): string {
    return required('SUPABASE_URL');
  }

  get supabaseAnonKey(): string {
    return required('SUPABASE_ANON_KEY');
  }

  get supabaseServiceRoleKey(): string {
    return required('SUPABASE_SERVICE_ROLE_KEY');
  }

  get credentialEncryptionKey(): string {
    return required('MCP_CREDENTIAL_ENCRYPTION_KEY');
  }
}
