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
  - entries: `instructions.md`, `GPTS-MCP-GATEWAY-Knowledge.md`, `openapi.yaml`, `setup-guide.md`.
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

## Open-source rules + dependency repair patch — 2026-09-11

Validation run after selecting AGPL-3.0-or-later and repairing the dependency policy:

- `npm run check` — pass.
  - source check: 74 source files;
  - schema contract: pass;
  - docs check: 28 Markdown files; 24 required public documents;
  - dependency policy: Nest 11 pins accepted, Multer 2.3.0 override accepted, no server lockfile present in artifact.
- `npm run repair:server-deps` — pass against the artifact tree.
  - no `server/node_modules` or `server/package-lock.json` existed, so the script performed no deletion and printed the reviewed reinstall/validation commands.
- GitHub YAML parse — pass for CI, Dependabot and issue-template YAML files.
- `git diff --check` — pass.
- Basic secret-pattern scan — no Google/OpenAI/JWT-looking real credentials found.

Dependency versions were updated in the manifest but a clean network-backed `npm install` / `npm audit` could not be rerun in this artifact environment. The user's local audit output demonstrates that repeated `npm audit fix --force` produced a mixed Nest 7/11/12 tree; after applying this patch, the local tree still needs to be reset and reinstalled so a fresh `server/package-lock.json` can be generated and committed.

Required local revalidation:

```text
npm run repair:server-deps
npm --prefix server install
npm --prefix server ls @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/swagger @nestjs/testing multer
npm --prefix server audit --audit-level=high
npm --prefix server run typecheck
npm --prefix server run build
npm --prefix server test -- --runInBand
```

Do not run `npm audit fix --force` as a follow-up.


## Rebased recovery patch v2 — 2026-09-11

The v2 patch was verified against a fresh baseline checkout that was intentionally mutated to simulate the user's post-`npm audit fix --force` state:

- `@nestjs/core` changed to `^7.5.5`;
- `@nestjs/swagger` changed to `^5.0.8`;
- `@nestjs/testing` changed to `^7.5.5`;
- a broken `server/package-lock.json` was present;
- a stale `server/node_modules` tree was present.

Validation:

- `git apply --check mcp-gateway-open-source-rules-rebased-v2.git.patch` — pass.
- `git apply ...` — pass without touching the already-mutated `server/package.json`.
- `node scripts/repair-server-dependencies.mjs` — pass.
  - rewrote the reviewed Nest 11 versions into `server/package.json`;
  - set AGPL package metadata;
  - restored the Multer 2.3.0 override;
  - removed the simulated broken `server/package-lock.json`;
  - removed the simulated stale `server/node_modules`.
- post-repair `check-source` — pass.
- post-repair `check-schema-contract` — pass.
- post-repair `check-docs` — pass.
- post-repair `check-dependency-policy` — pass.

This verifies patch applicability and deterministic manifest recovery. It does **not** replace the required network-backed clean install/audit/build/test on the user's machine.
