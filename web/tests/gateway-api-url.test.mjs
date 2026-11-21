import test from "node:test";
import assert from "node:assert/strict";

function gatewayUrl(baseUrl, path) {
  const normalizedBase = baseUrl.replace(/\/+$/u, "");
  return new URL(path.replace(/^\/+/, ""), `${normalizedBase}/`).toString();
}

test("consent details URL retains the /api/v1 prefix", () => {
  assert.equal(
    gatewayUrl("https://kata-mcp-api.vercel.app/api/v1", "/account/oauth/authorizations/auth_123"),
    "https://kata-mcp-api.vercel.app/api/v1/account/oauth/authorizations/auth_123",
  );
});

test("approve and deny URLs retain the /api/v1 prefix", () => {
  for (const action of ["approve", "deny"]) {
    assert.equal(
      gatewayUrl("https://kata-mcp-api.vercel.app/api/v1", `/account/oauth/authorizations/auth_123/${action}`),
      `https://kata-mcp-api.vercel.app/api/v1/account/oauth/authorizations/auth_123/${action}`,
    );
  }
});

test("GPT Integration Kit ZIP endpoint retains the versioned API prefix", () => {
  assert.equal(
    gatewayUrl("https://kata-mcp-api.vercel.app/api/v1", "/gpt-integration/package?language=en"),
    "https://kata-mcp-api.vercel.app/api/v1/gpt-integration/package?language=en",
  );
});

test("individual GPT Integration Kit file endpoint retains the versioned API prefix", () => {
  assert.equal(
    gatewayUrl("https://kata-mcp-api.vercel.app/api/v1", "/gpt-integration/file/instructions.md?language=en"),
    "https://kata-mcp-api.vercel.app/api/v1/gpt-integration/file/instructions.md?language=en",
  );
});

test("normalizes a trailing slash in the API base", () => {
  assert.equal(
    gatewayUrl("https://api.example.com/api/v1/", "/account/me"),
    "https://api.example.com/api/v1/account/me",
  );
});
