import test from "node:test";
import assert from "node:assert/strict";

function gatewayUrl(baseUrl, path) {
  const normalizedBase = baseUrl.replace(/\/+$/u, "");
  return new URL(path.replace(/^\/+/, ""), `${normalizedBase}/`).toString();
}

test("consent details resolves below the configured /api/v1 base", () => {
  assert.equal(
    gatewayUrl("https://kata-mcp-api.vercel.app/api/v1", "/account/oauth/authorizations/auth_123"),
    "https://kata-mcp-api.vercel.app/api/v1/account/oauth/authorizations/auth_123",
  );
});

test("approve and deny resolve below the configured /api/v1 base", () => {
  for (const action of ["approve", "deny"]) {
    assert.equal(
      gatewayUrl("https://kata-mcp-api.vercel.app/api/v1", `/account/oauth/authorizations/auth_123/${action}`),
      `https://kata-mcp-api.vercel.app/api/v1/account/oauth/authorizations/auth_123/${action}`,
    );
  }
});

test("normalizes a trailing slash in the API base", () => {
  assert.equal(
    gatewayUrl("https://api.example.com/api/v1/", "/account/me"),
    "https://api.example.com/api/v1/account/me",
  );
});
