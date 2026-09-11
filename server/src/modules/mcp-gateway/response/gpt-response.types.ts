export type GptCompleteResponse<T = unknown> = {
  mode: 'complete';
  data: T;
};

export type GptChunkTransfer = {
  id: string;
  contentType: 'application/json';
  totalChunks: number;
  totalChars: number;
  chunkIndex: number;
  nextChunkIndex: number | null;
  hasMore: boolean;
  expiresAt: string;
};

export type GptChunkedResponse = {
  mode: 'chunked';
  chunk: string;
  transfer: GptChunkTransfer;
};

export type GptActionResponse<T = unknown> =
  | GptCompleteResponse<T>
  | GptChunkedResponse;
