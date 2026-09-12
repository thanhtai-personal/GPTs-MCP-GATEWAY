import { IsIn, IsOptional } from 'class-validator';
import type { McpProviderAccessMode } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

const APP_RETURN_TARGETS = [
  '#overview',
  '#mcp-services',
  '#open-id',
  '#gpt-integration',
  '#settings',
] as const;

export class StartMcpOAuthDto {
  @IsOptional()
  @IsIn(['read', 'write'])
  accessMode?: McpProviderAccessMode;

  @IsOptional()
  @IsIn(APP_RETURN_TARGETS)
  returnTo?: string;
}
