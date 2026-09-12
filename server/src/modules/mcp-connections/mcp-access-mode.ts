import { BadRequestException } from '@nestjs/common';
import type {
  McpProviderAccessMode,
  McpProviderAdapter,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

export function resolveProviderAccessMode(
  provider: McpProviderAdapter,
  requested?: McpProviderAccessMode,
): McpProviderAccessMode | undefined {
  if (
    provider.credential.kind !== 'oauth' ||
    !provider.credential.accessModes
  ) {
    if (requested) {
      throw new BadRequestException({
        code: 'MCP_ACCESS_MODE_NOT_SUPPORTED',
        message: `${provider.displayName} does not expose selectable access modes`,
      });
    }
    return undefined;
  }

  const mode = requested ?? provider.credential.accessModes.default;
  if (
    !provider.credential.accessModes.options.some(
      (option) => option.id === mode,
    )
  ) {
    throw new BadRequestException({
      code: 'MCP_ACCESS_MODE_INVALID',
      message: `Unsupported access mode for ${provider.displayName}`,
    });
  }

  return mode;
}
