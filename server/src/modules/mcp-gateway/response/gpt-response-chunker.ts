import type { GptChunkedResponse } from '@server/root/modules/mcp-gateway/response/gpt-response.types';

const MAX_RESERVED_CHUNKS = 999_999;

export class GptResponseChunkingError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'GptResponseChunkingError';
  }
}

export type ChunkEnvelopeInput = {
  transferId: string;
  totalChunks: number;
  totalChars: number;
  chunkIndex: number;
  chunk: string;
  expiresAt: string;
};

export function buildGptChunkResponse(
  input: ChunkEnvelopeInput,
): GptChunkedResponse {
  const hasMore = input.chunkIndex + 1 < input.totalChunks;
  return {
    mode: 'chunked',
    chunk: input.chunk,
    transfer: {
      id: input.transferId,
      contentType: 'application/json',
      totalChunks: input.totalChunks,
      totalChars: input.totalChars,
      chunkIndex: input.chunkIndex,
      nextChunkIndex: hasMore ? input.chunkIndex + 1 : null,
      hasMore,
      expiresAt: input.expiresAt,
    },
  };
}

export function serializedCharLength(value: unknown): number {
  return JSON.stringify(value).length;
}

export function splitSerializedGptPayload(input: {
  serializedPayload: string;
  transferId: string;
  expiresAt: string;
  maxResponseChars: number;
}): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < input.serializedPayload.length) {
    if (chunks.length >= MAX_RESERVED_CHUNKS) {
      throw new GptResponseChunkingError(
        'GPT_RESPONSE_TOO_MANY_CHUNKS',
        'Gateway response requires too many continuation chunks',
      );
    }

    const chunkIndex = chunks.length;
    let low = start + 1;
    let high = input.serializedPayload.length;
    let bestEnd = start;

    while (low <= high) {
      const midpoint = Math.floor((low + high) / 2);
      const end = safeUnicodeEnd(input.serializedPayload, start, midpoint);
      if (end <= start) {
        low = midpoint + 1;
        continue;
      }

      const candidate = input.serializedPayload.slice(start, end);
      const envelope = buildGptChunkResponse({
        transferId: input.transferId,
        totalChunks: MAX_RESERVED_CHUNKS,
        totalChars: input.serializedPayload.length,
        chunkIndex,
        chunk: candidate,
        expiresAt: input.expiresAt,
      });

      if (serializedCharLength(envelope) <= input.maxResponseChars) {
        bestEnd = end;
        low = midpoint + 1;
      } else {
        high = midpoint - 1;
      }
    }

    if (bestEnd <= start) {
      throw new GptResponseChunkingError(
        'GPT_RESPONSE_CHUNK_BUDGET_TOO_SMALL',
        'GPT_ACTION_RESPONSE_MAX_CHARS is too small for the Gateway response envelope',
      );
    }

    chunks.push(input.serializedPayload.slice(start, bestEnd));
    start = bestEnd;
  }

  const totalChunks = chunks.length;
  chunks.forEach((chunk, chunkIndex) => {
    const envelope = buildGptChunkResponse({
      transferId: input.transferId,
      totalChunks,
      totalChars: input.serializedPayload.length,
      chunkIndex,
      chunk,
      expiresAt: input.expiresAt,
    });
    if (serializedCharLength(envelope) > input.maxResponseChars) {
      throw new GptResponseChunkingError(
        'GPT_RESPONSE_CHUNK_BUDGET_EXCEEDED',
        'A generated Gateway response chunk exceeds the safe budget',
      );
    }
  });

  return chunks;
}

function safeUnicodeEnd(value: string, start: number, end: number): number {
  if (end <= start || end >= value.length) return end;
  const previous = value.charCodeAt(end - 1);
  const next = value.charCodeAt(end);
  const previousIsHighSurrogate = previous >= 0xd800 && previous <= 0xdbff;
  const nextIsLowSurrogate = next >= 0xdc00 && next <= 0xdfff;
  return previousIsHighSurrogate && nextIsLowSurrogate ? end - 1 : end;
}
