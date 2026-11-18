import test from "node:test";
import assert from "node:assert/strict";

function gatewayUrl(baseUrl, path) {
  const normalizedBase = baseUrl.replace(/\\/+$/u, "");
  return new URL(path.replace(/^\\/+/, ""), `${normalizedBase}/`).toString();
}

test("keeps the /api/v1 prefix when resolving an absolute-looking route path", () => {
  assert.equal(
    gatewayUrl(
      "https://kata-mcp-api.vercel.app/api/v1",
      "/account/oauth/authorizations/auth_123",
    ),
    "https://kata-mcp-api.vercel.app/api/v1/account/oauth/authorizations/auth_123",
  );
});

test("normalizes a trailing slash in the configured API base", () => {
  assert.equal(
    gatewayUrl("https://api.example.com/api/v1/", "/account/me"),
    "https://api.example.com/api/v1/account/me",
  );
});

test("preserves a nested path on an API base configured below a reverse proxy prefix", () => {
  assert.equal(
    gatewayUrl("https://example.com/gateway/api/v1", "/account/me"),
    "https://example.com/gateway/api/v1/account/me",
  );
});
