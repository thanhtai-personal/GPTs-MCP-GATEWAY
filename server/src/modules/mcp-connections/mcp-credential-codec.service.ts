import { BadRequestException, Injectable } from '@nestjs/common';
import { SecretCipherService } from '@server/root/common/security/secret-cipher.service';
import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';
import type {
  McpOAuthCredential,
  McpProviderAdapter,
  McpProviderCredential,
} from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

@Injectable()
export class McpCredentialCodec {
  constructor(private readonly cipher: SecretCipherService) {}

  encode(credential: McpProviderCredential): {
    ciphertext: string;
    version: 1 | 2;
  } {
    if (credential.kind === 'api_key') {
      return {
        ciphertext: this.cipher.encrypt(credential.value.trim()),
        version: 1,
      };
    }

    return {
      ciphertext: this.cipher.encrypt(JSON.stringify(credential)),
      version: 2,
    };
  }

  decode(
    ciphertext: string,
    version: number,
    provider: McpProviderAdapter,
  ): McpProviderCredential {
    const plaintext = this.cipher.decrypt(ciphertext);

    if (version === 1) {
      if (provider.credential.kind !== 'api_key') {
        throw new BadRequestException({
          code: 'MCP_CREDENTIAL_FORMAT_MISMATCH',
          message: `${provider.displayName} connection must be reconnected`,
        });
      }
      return {
        kind: 'api_key',
        value: plaintext.trim(),
      };
    }

    if (version !== 2) {
      throw new BadRequestException({
        code: 'MCP_CREDENTIAL_FORMAT_UNSUPPORTED',
        message: `${provider.displayName} credential format is unsupported`,
      });
    }

    let value: unknown;
    try {
      value = JSON.parse(plaintext);
    } catch {
      throw this.invalid(provider);
    }

    if (
      !isJsonObject(value) ||
      value.kind !== 'oauth' ||
      typeof value.accessToken !== 'string' ||
      value.tokenType !== 'Bearer'
    ) {
      throw this.invalid(provider);
    }

    return {
      kind: 'oauth',
      accessToken: value.accessToken,
      tokenType: 'Bearer',
      ...(typeof value.refreshToken === 'string'
        ? { refreshToken: value.refreshToken }
        : {}),
      ...(typeof value.expiresAt === 'string'
        ? { expiresAt: value.expiresAt }
        : {}),
      ...(typeof value.scope === 'string' ? { scope: value.scope } : {}),
      ...(typeof value.clientId === 'string' ? { clientId: value.clientId } : {}),
      ...(typeof value.clientSecret === 'string'
        ? { clientSecret: value.clientSecret }
        : {}),
      ...(value.accessMode === 'read' || value.accessMode === 'write'
        ? { accessMode: value.accessMode }
        : {}),
    };
  }

  shouldRefresh(credential: McpOAuthCredential): boolean {
    if (!credential.expiresAt) return false;
    const expiresAt = Date.parse(credential.expiresAt);
    if (!Number.isFinite(expiresAt)) return true;
    return expiresAt <= Date.now() + 60_000;
  }

  private invalid(provider: McpProviderAdapter): BadRequestException {
    return new BadRequestException({
      code: 'MCP_CREDENTIAL_FORMAT_INVALID',
      message: `${provider.displayName} credential is invalid`,
    });
  }
}
