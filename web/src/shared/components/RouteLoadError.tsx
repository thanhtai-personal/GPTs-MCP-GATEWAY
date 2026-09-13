import { ErrorComponent } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  CALLBACK_CHUNK_RETRY_KEY,
  isCallbackChunkLoadFailure,
  shouldRetryCallbackChunk,
} from "./callback-chunk-recovery";

export function RouteLoadError({ error }: ErrorComponentProps) {
  const isCallbackChunkFailure =
    typeof window !== "undefined" &&
    isCallbackChunkLoadFailure(error, window.location.pathname);

  useEffect(() => {
    if (!isCallbackChunkFailure) return;

    try {
      const now = Date.now();
      if (!shouldRetryCallbackChunk(sessionStorage.getItem(CALLBACK_CHUNK_RETRY_KEY), now)) {
        return;
      }
      sessionStorage.setItem(CALLBACK_CHUNK_RETRY_KEY, String(now));
      window.location.reload();
    } catch {
      // Storage can be unavailable; the visible reload button remains usable.
    }
  }, [isCallbackChunkFailure]);

  if (!isCallbackChunkFailure) return <ErrorComponent error={error} />;

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ maxWidth: 480, textAlign: "center" }}>
        <h1>Không thể tải trang đăng nhập</h1>
        <p>Trang có thể vừa được cập nhật. Hãy tải lại để tiếp tục đăng nhập.</p>
        <button type="button" className="button" onClick={() => window.location.reload()}>
          Tải lại trang
        </button>
        <p><a href="/">Bắt đầu đăng nhập lại</a></p>
      </section>
    </main>
  );
}
