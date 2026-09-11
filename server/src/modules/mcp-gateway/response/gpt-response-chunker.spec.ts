import {
  buildGptChunkResponse,
  serializedCharLength,
  splitSerializedGptPayload,
} from '@server/root/modules/mcp-gateway/response/gpt-response-chunker';

describe('splitSerializedGptPayload', () => {
  const transferId = '00000000-0000-4000-8000-000000000001';
  const expiresAt = '2026-09-11T12:00:00.000Z';

  it('keeps every serialized envelope under the configured budget', () => {
    const payload = JSON.stringify({
      content: Array.from({ length: 300 }, (_, index) => ({
        index,
        value: `"quoted-${index}"\\${'x'.repeat(40)}`,
      })),
    });
    const maxResponseChars = 2_000;

    const chunks = splitSerializedGptPayload({
      serializedPayload: payload,
      transferId,
      expiresAt,
      maxResponseChars,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join('')).toBe(payload);

    chunks.forEach((chunk, chunkIndex) => {
      const envelope = buildGptChunkResponse({
        transferId,
        totalChunks: chunks.length,
        totalChars: payload.length,
        chunkIndex,
        chunk,
        expiresAt,
      });
      expect(serializedCharLength(envelope)).toBeLessThanOrEqual(
        maxResponseChars,
      );
    });
  });

  it('does not split a surrogate pair', () => {
    const payload = JSON.stringify({
      content: '😀'.repeat(2_000),
    });

    const chunks = splitSerializedGptPayload({
      serializedPayload: payload,
      transferId,
      expiresAt,
      maxResponseChars: 1_200,
    });

    expect(chunks.join('')).toBe(payload);
    for (const chunk of chunks) {
      if (!chunk) continue;
      const last = chunk.charCodeAt(chunk.length - 1);
      expect(last >= 0xd800 && last <= 0xdbff).toBe(false);
    }
  });
});
