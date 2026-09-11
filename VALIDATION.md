# Validation report

Validation performed in the artifact environment on 2026-09-11.

## Passed

- `node scripts/check-source.mjs`
  - 71 TS/TSX/MJS source files checked.
  - no browser reference to `SUPABASE_SERVICE_ROLE_KEY`.
  - no deep `../../` imports.
  - no source file over the configured 430-line soft gate.
- `node scripts/check-schema-contract.mjs`
  - initial migration contains account, MCP connection, Open ID, Gateway credential, lifetime trial entitlement and atomic trial RPC contracts.
- TypeScript 5.8.3 `transpileModule` syntax pass
  - 67 `.ts/.tsx` files, 0 syntax diagnostics.
- Local alias/import target resolution
  - 0 missing local import targets.
- GPT ZIP utility executable smoke test
  - generated archive opened successfully;
  - CRC test passed;
  - entries: `instructions.md`, `knowledge.md`, `openapi.yaml`, `setup-guide.md`.
- Generated OpenAPI template
  - parsed successfully as OpenAPI `3.1.0`;
  - includes `getGatewayProfile`, `listMcpServices`, `listMcpTools`, `callMcpTool`.
- Basic secret pattern scan
  - no real OpenAI-style secrets, Google API keys, or JWT-looking tokens found.
  - no real `.env` file included.
- SEO generator
  - generated `robots.txt` and `sitemap.xml`.

## Not verified in this environment

- `npm install` could not finish before the sandbox interrupted the install process, so dependency-backed Nest/Vite full typecheck/build was not run.
- The migration was not applied to a live/local Supabase instance.
- Stitch runtime smoke test was not run because no user `STITCH_API_KEY` was supplied.
- Payment/checkout is intentionally outside this MVP; membership can be promoted only through a trusted admin/database flow for testing.

These limits are runtime/environment validation gaps, not reported as passes.

## Open-source documentation patch validation — 2026-09-11

Additional validation run after the public documentation/community files were added:

- `npm run check` — pass.
  - source check: 72 TS/TSX/MJS files.
  - schema contract check: pass.
  - docs check: 24 Markdown files scanned; 19 required public documents present; relative links resolved.
- GitHub issue-template YAML parsed successfully for:
  - `.github/ISSUE_TEMPLATE/bug_report.yml`
  - `.github/ISSUE_TEMPLATE/feature_request.yml`
  - `.github/ISSUE_TEMPLATE/config.yml`
- Basic secret-pattern scan over public documentation/community templates — no Google/OpenAI/JWT-looking real secrets found.
- Documentation checks were executed with the artifact runtime Node.js `v22.16.0`; the project target remains Node.js 24 from `.nvmrc`.

The dependency-backed build/live-runtime gaps listed above remain unchanged.
