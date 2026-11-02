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
  readonly upstreamMaxResponseBytes = integer('MCP_UPSTREAM_MAX_RESPONSE_BYTES', 16_777_216);
  readonly mcpOAuthStateTtlSeconds = integer('MCP_OAUTH_STATE_TTL_SECONDS', 600);
  readonly lovableMcpOAuthClientId =
    process.env.LOVABLE_MCP_OAUTH_CLIENT_ID?.trim() || undefined;
  readonly lovableMcpOAuthClientSecret =
    process.env.LOVABLE_MCP_OAUTH_CLIENT_SECRET?.trim() || undefined;
  readonly figmaMcpOAuthClientId = process.env.FIGMA_MCP_OAUTH_CLIENT_ID?.trim() || undefined;
  readonly figmaMcpOAuthClientSecret =
    process.env.FIGMA_MCP_OAUTH_CLIENT_SECRET?.trim() || undefined;
  readonly githubMcpOAuthClientId =
    process.env.GITHUB_MCP_OAUTH_CLIENT_ID?.trim() || undefined;
  readonly githubMcpOAuthClientSecret =
    process.env.GITHUB_MCP_OAUTH_CLIENT_SECRET?.trim() || undefined;
  readonly googleWorkspaceOAuthClientId =
    process.env.GOOGLE_WORKSPACE_OAUTH_CLIENT_ID?.trim() || undefined;
  readonly googleWorkspaceOAuthClientSecret =
    process.env.GOOGLE_WORKSPACE_OAUTH_CLIENT_SECRET?.trim() || undefined;
  /** Audience required in OAuth access tokens presented to /api/v1/mcp. */
  readonly mcpOAuthAudience =
    process.env.MCP_OAUTH_AUDIENCE?.trim() || 'authenticated';
  /** Hosts allowed as OAuth client redirect targets on the consent page. */
  readonly mcpOAuthAllowedRedirectHosts = (
    process.env.MCP_OAUTH_ALLOWED_REDIRECT_HOSTS ??
    'chatgpt.com,openai.com,claude.ai,claude.com,grok.com,console.x.ai'
  )
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  readonly gptActionResponseMaxChars = integer(
    'GPT_ACTION_RESPONSE_MAX_CHARS',
    80_000,
  );
  readonly gptResponseTransferTtlSeconds = integer(
    'GPT_RESPONSE_TRANSFER_TTL_SECONDS',
    600,
  );
  readonly gptResponseMaxStoredChars = integer(
    'GPT_RESPONSE_MAX_STORED_CHARS',
    5_000_000,
  );

  /** Public URL of the MCP endpoint (OAuth protected resource). */
  get mcpResourceUrl(): string {
    return `${this.publicBaseUrl.replace(/\/+$/u, '')}/api/v1/mcp`;
  }

  get mcpProtectedResourceMetadataUrl(): string {
    return `${this.publicBaseUrl.replace(/\/+$/u, '')}/.well-known/oauth-protected-resource`;
  }

  /** Supabase OAuth 2.1 server (issuer of MCP access tokens). */
  get supabaseOAuthIssuerUrl(): string {
    return `${this.supabaseUrl.replace(/\/+$/u, '')}/auth/v1`;
  }

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
