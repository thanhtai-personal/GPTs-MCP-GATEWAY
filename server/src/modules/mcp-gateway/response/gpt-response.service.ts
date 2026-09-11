import {
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { SecretCipherService } from '@server/root/common/security/secret-cipher.service';
import { SupabaseService } from '@server/root/common/supabase/supabase.service';
import type { GatewayPrincipal } from '@server/root/modules/open-id/gateway-credential.service';
import {
  buildGptChunkResponse,
  GptResponseChunkingError,
  serializedCharLength,
  splitSerializedGptPayload,
} from '@server/root/modules/mcp-gateway/response/gpt-response-chunker';
import type {
  GptActionResponse,
  GptChunkedResponse,
} from '@server/root/modules/mcp-gateway/response/gpt-response.types';

type TransferRow = {
  id: string;
  user_id: string;
  credential_id: string;
  total_chunks: number;
  total_chars: number;
  expires_at: string;
};

type ChunkRow = {
  transfer_id: string;
  chunk_index: number;
  content_ciphertext: string;
};

@Injectable()
export class GptResponseService {
  constructor(
    private readonly config: AppConfigService,
    private readonly cipher: SecretCipherService,
    private readonly supabase: SupabaseService,
  ) {}

  async wrap(
    principal: GatewayPrincipal,
    value: unknown,
  ): Promise<GptActionResponse> {
    const complete = {
      mode: 'complete' as const,
      data: value ?? null,
    };
    if (serializedCharLength(complete) <= this.config.gptActionResponseMaxChars) {
      return complete;
    }

    const serializedPayload = JSON.stringify(value ?? null);
    if (serializedPayload.length > this.config.gptResponseMaxStoredChars) {
      throw new PayloadTooLargeException({
        code: 'GPT_RESPONSE_STORAGE_LIMIT',
        message:
          'The MCP result is too large for Gateway response transfer storage. Use a narrower MCP query or provider pagination.',
        totalChars: serializedPayload.length,
        maxStoredChars: this.config.gptResponseMaxStoredChars,
      });
    }

    const transferId = randomUUID();
    const expiresAt = new Date(
      Date.now() + this.config.gptResponseTransferTtlSeconds * 1000,
    ).toISOString();
    let chunks: string[];
    try {
      chunks = splitSerializedGptPayload({
        serializedPayload,
        transferId,
        expiresAt,
        maxResponseChars: this.config.gptActionResponseMaxChars,
      });
    } catch (error) {
      if (error instanceof GptResponseChunkingError) {
        throw new PayloadTooLargeException({
          code: error.code,
          message: error.message,
        });
      }
      throw error;
    }

    await this.persistTransfer({
      principal,
      transferId,
      serializedPayload,
      chunks,
      expiresAt,
    });

    return buildGptChunkResponse({
      transferId,
      totalChunks: chunks.length,
      totalChars: serializedPayload.length,
      chunkIndex: 0,
      chunk: chunks[0],
      expiresAt,
    });
  }

  async getChunk(
    principal: GatewayPrincipal,
    transferId: string,
    chunkIndex: number,
  ): Promise<GptChunkedResponse> {
    const client = this.supabase.createServiceRoleClient();
    const { data: transfer, error: transferError } = await client
      .from('gpt_response_transfers')
      .select(
        'id,user_id,credential_id,total_chunks,total_chars,expires_at',
      )
      .eq('id', transferId)
      .eq('user_id', principal.user.id)
      .eq('credential_id', principal.credentialId)
      .maybeSingle<TransferRow>();

    if (transferError) {
      throw new ServiceUnavailableException({
        code: 'GPT_RESPONSE_TRANSFER_STORAGE_UNAVAILABLE',
        message: 'Gateway response transfer storage is unavailable',
      });
    }
    if (!transfer) {
      throw new NotFoundException({
        code: 'GPT_RESPONSE_TRANSFER_NOT_FOUND',
        message: 'Gateway response transfer was not found',
      });
    }
    if (transfer.expires_at <= new Date().toISOString()) {
      await client.from('gpt_response_transfers').delete().eq('id', transfer.id);
      throw new NotFoundException({
        code: 'GPT_RESPONSE_TRANSFER_EXPIRED',
        message: 'Gateway response transfer has expired',
      });
    }
    if (
      !Number.isInteger(chunkIndex) ||
      chunkIndex < 0 ||
      chunkIndex >= transfer.total_chunks
    ) {
      throw new NotFoundException({
        code: 'GPT_RESPONSE_CHUNK_NOT_FOUND',
        message: 'Gateway response chunk was not found',
      });
    }

    const { data: chunk, error: chunkError } = await client
      .from('gpt_response_chunks')
      .select('transfer_id,chunk_index,content_ciphertext')
      .eq('transfer_id', transfer.id)
      .eq('chunk_index', chunkIndex)
      .maybeSingle<ChunkRow>();

    if (chunkError) {
      throw new ServiceUnavailableException({
        code: 'GPT_RESPONSE_TRANSFER_STORAGE_UNAVAILABLE',
        message: 'Gateway response chunk storage is unavailable',
      });
    }
    if (!chunk) {
      throw new NotFoundException({
        code: 'GPT_RESPONSE_CHUNK_NOT_FOUND',
        message: 'Gateway response chunk was not found',
      });
    }

    return buildGptChunkResponse({
      transferId: transfer.id,
      totalChunks: transfer.total_chunks,
      totalChars: transfer.total_chars,
      chunkIndex,
      chunk: this.cipher.decrypt(chunk.content_ciphertext),
      expiresAt: transfer.expires_at,
    });
  }

  private async persistTransfer(input: {
    principal: GatewayPrincipal;
    transferId: string;
    serializedPayload: string;
    chunks: string[];
    expiresAt: string;
  }): Promise<void> {
    const client = this.supabase.createServiceRoleClient();
    const now = new Date().toISOString();

    // Opportunistic cleanup keeps the serverless deployment free of a cron dependency.
    await client.from('gpt_response_transfers').delete().lt('expires_at', now);

    const { error: transferError } = await client
      .from('gpt_response_transfers')
      .insert({
        id: input.transferId,
        user_id: input.principal.user.id,
        credential_id: input.principal.credentialId,
        total_chunks: input.chunks.length,
        total_chars: input.serializedPayload.length,
        expires_at: input.expiresAt,
      });

    if (transferError) {
      throw new ServiceUnavailableException({
        code: 'GPT_RESPONSE_TRANSFER_STORAGE_UNAVAILABLE',
        message: 'Could not create Gateway response transfer',
      });
    }

    const rows = input.chunks.map((chunk, chunkIndex) => ({
      transfer_id: input.transferId,
      chunk_index: chunkIndex,
      content_ciphertext: this.cipher.encrypt(chunk),
      content_chars: chunk.length,
    }));

    const batchSize = 20;
    for (let start = 0; start < rows.length; start += batchSize) {
      const { error: chunksError } = await client
        .from('gpt_response_chunks')
        .insert(rows.slice(start, start + batchSize));

      if (chunksError) {
        await client
          .from('gpt_response_transfers')
          .delete()
          .eq('id', input.transferId);
        throw new ServiceUnavailableException({
          code: 'GPT_RESPONSE_TRANSFER_STORAGE_UNAVAILABLE',
          message: 'Could not persist Gateway response chunks',
        });
      }
    }
  }

}
