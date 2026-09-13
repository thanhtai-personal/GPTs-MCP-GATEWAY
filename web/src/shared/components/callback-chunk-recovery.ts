const CALLBACK_PATH = "/auth/callback";
const RETRY_WINDOW_MS = 60_000;

export const CALLBACK_CHUNK_RETRY_KEY = "mcp-gateway:auth-callback:chunk-retry";

export function isCallbackChunkLoadFailure(error: unknown, pathname: string): boolean {
  if (pathname !== CALLBACK_PATH || !(error instanceof Error)) return false;

  return /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|loading chunk .+ failed|chunkloaderror/i.test(
    error.message,
  );
}

export function shouldRetryCallbackChunk(lastAttempt: string | null, now: number): boolean {
  if (lastAttempt === null) return true;

  const timestamp = Number(lastAttempt);
  return !Number.isFinite(timestamp) || now - timestamp > RETRY_WINDOW_MS;
}
