import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { AppConfigService } from '@server/root/common/config/app-config.service';

const VERSION = 'v1';
const IV_BYTES = 12;
const TAG_BYTES = 16;

@Injectable()
export class SecretCipherService {
  private readonly key: Buffer;

  constructor(config: AppConfigService) {
    this.key = Buffer.from(config.credentialEncryptionKey, 'base64');
    if (this.key.length !== 32) {
      throw new Error('MCP_CREDENTIAL_ENCRYPTION_KEY must decode to exactly 32 bytes');
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return [VERSION, iv, tag, ciphertext]
      .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
      .join(':');
  }

  decrypt(serialized: string): string {
    const [version, ivRaw, tagRaw, ciphertextRaw] = serialized.split(':');
    if (version !== VERSION || !ivRaw || !tagRaw || !ciphertextRaw) {
      throw new Error('Unsupported encrypted credential format');
    }
    const iv = Buffer.from(ivRaw, 'base64url');
    const tag = Buffer.from(tagRaw, 'base64url');
    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
      throw new Error('Invalid encrypted credential metadata');
    }
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextRaw, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}
