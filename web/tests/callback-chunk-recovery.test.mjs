import assert from "node:assert/strict";
import test from "node:test";
import {
  isCallbackChunkLoadFailure,
  shouldRetryCallbackChunk,
} from "../src/shared/components/callback-chunk-recovery.ts";

test("recognizes a missing OAuth callback route chunk", () => {
  assert.equal(
    isCallbackChunkLoadFailure(
      new TypeError(
        "Failed to fetch dynamically imported module: https://example.com/assets/auth.callback-old.js",
      ),
      "/auth/callback",
    ),
    true,
  );
  assert.equal(
    isCallbackChunkLoadFailure(new Error("OAUTH_CALLBACK_CODE_MISSING"), "/auth/callback"),
    false,
  );
  assert.equal(
    isCallbackChunkLoadFailure(new Error("Loading chunk 123 failed"), "/app"),
    false,
  );
});

test("retries a callback chunk failure only once during a short window", () => {
  const now = 1_000_000;
  assert.equal(shouldRetryCallbackChunk(null, now), true);
  assert.equal(shouldRetryCallbackChunk(String(now - 5_000), now), false);
  assert.equal(shouldRetryCallbackChunk(String(now - 61_000), now), true);
  assert.equal(shouldRetryCallbackChunk("invalid", now), true);
});
