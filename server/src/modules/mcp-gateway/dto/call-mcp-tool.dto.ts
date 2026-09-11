import { IsObject, IsOptional, IsString } from 'class-validator';
import type {
  McpToolArguments,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

export class CallMcpToolDto {
  @IsOptional()
  @IsObject()
  arguments?: McpToolArguments;

  @IsOptional()
  @IsString()
  argumentsJson?: string;
}
