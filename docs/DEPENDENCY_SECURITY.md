# Dependency Security Policy

This document defines how dependency vulnerabilities are triaged and fixed.

## Never use `npm audit fix --force` as routine maintenance

`npm audit fix --force` is allowed to cross semver-major boundaries. In a framework ecosystem such as NestJS, that can produce an internally inconsistent tree.

A concrete failure mode is mixing:

```text
@nestjs/common 11.x
@nestjs/core 7.x or 12.x
@nestjs/platform-express 11.x
@nestjs/swagger 5.x or 12.x
```

npm may continue after peer-dependency override warnings, but the resulting install is not a supported NestJS stack.

The repository therefore keeps the direct Nest runtime packages on the same Nest 11 line and uses explicit security upgrades/overrides.

## Current Nest policy

The server intentionally stays on NestJS 11 for the current release line.

Direct framework versions are pinned so contributors do not accidentally migrate only part of Nest:

```text
@nestjs/common            11.2.3
@nestjs/core              11.2.3
@nestjs/platform-express  11.2.3
@nestjs/testing           11.2.3
@nestjs/swagger           11.4.7
@nestjs/throttler         6.5.0
```

`@nestjs/swagger` has its own version sequence; it is kept on the compatible Nest 11 major.

Nest 12 is a deliberate framework migration and must be handled as a separate change with peer-dependency review, source compatibility review and full validation.

## Multer advisory override

NestJS 11's Express adapter can transitively pin Multer older than the latest patched 2.x release.

The server package uses:

```json
{
  "overrides": {
    "multer": "2.3.0"
  }
}
```

The project does not currently expose a file-upload feature, so this is a transitive Express-adapter dependency rather than an application upload API. The override still removes known vulnerable Multer 2.2.0 code from the installed tree.

When Nest updates its own dependency to a safe Multer release, re-evaluate and remove the override if it is no longer necessary.

## Required remediation workflow

For a dependency advisory:

1. save `npm audit --json` output outside Git if it contains environment-specific information;
2. identify direct vs transitive dependency;
3. verify the advisory and fixed versions;
4. inspect framework peer requirements;
5. change package manifests intentionally;
6. remove any dependency tree already corrupted by a forced fix;
7. perform a clean install;
8. inspect the resolved tree;
9. run audit;
10. run typecheck/build/tests.

For the server:

```bash
npm install
npm ls @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/swagger @nestjs/testing multer
npm audit --audit-level=high
npm run typecheck
npm run build
npm test -- --runInBand
```

## Recovering from a forced audit fix

If `npm audit fix --force` has already rewritten `server/package.json`, the lockfile, or the installed tree, run the repository recovery command from the project root:

```bash
npm run repair:server-deps
npm --prefix server install
npm --prefix server ls @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/swagger @nestjs/testing multer
npm --prefix server audit --audit-level=high
npm --prefix server run typecheck
npm --prefix server run build
npm --prefix server test -- --runInBand
```

`repair:server-deps` intentionally rewrites the reviewed framework versions in `server/package.json`, removes `server/node_modules` and `server/package-lock.json`, and leaves the actual install to npm. This makes recovery deterministic even if a previous forced audit fix changed the manifest itself.

Do not run `npm audit fix --force` again after the clean install. If audit still reports an issue, triage that issue explicitly.

## Lockfiles

Before the first public release, commit clean `server/package-lock.json` and `web/package-lock.json` files generated from the reviewed manifests.

Once committed:

- use `npm ci` in CI;
- do not hand-edit lockfiles;
- dependency PRs should include manifest + lockfile changes;
- audit results should be evaluated against the committed tree.

## Accepted risk

An audit warning is not fixed by hiding it or by breaking framework compatibility.

If no safe compatible fix exists, document:

- advisory;
- affected dependency path;
- whether project code reaches the vulnerable behavior;
- mitigations;
- planned upgrade/removal;
- why the risk is temporarily accepted.

Material unresolved high/critical production-path vulnerabilities block a public release.
