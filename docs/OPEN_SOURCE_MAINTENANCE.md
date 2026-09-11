# Open-source Maintenance Guide

This document is for repository maintainers after publication.

## Triage labels

A small initial set is enough:

```text
bug
security
documentation
provider
frontend
backend
database
good first issue
help wanted
breaking change
```

Avoid a large label taxonomy before real issue volume exists.

## Issue triage

For each issue, determine:

1. reproducible source/runtime bug;
2. documentation gap;
3. unsupported deployment question;
4. feature request;
5. provider-specific upstream behavior;
6. security-sensitive report that should move private.

Close/redirect secrets posted publicly as quickly as practical and rotate affected test credentials if maintainers own them.

## Release discipline

Before a release:

1. update `CHANGELOG.md`;
2. update `PROJECT_STATUS.md`;
3. run the release checklist;
4. ensure migrations are append-only;
5. verify generated GPT OpenAPI points at the intended public URL;
6. tag only after validation evidence exists.

## Compatibility

Treat these as public contracts once users depend on them:

- Gateway error codes;
- provider IDs;
- GPT OpenAPI operation IDs;
- migration history;
- environment variable names;
- GPT routing semantics.

Breaking any of them should be intentional and documented.

## Documentation policy

If source behavior changes, update the nearest source-of-truth document in the same PR.

Do not document planned behavior as implemented. Put plans in `REQUIREMENTS.md`/`PROJECT_STATUS.md`.

## Dependency maintenance

Dependency updates should be small and reviewable.

For NestJS, update the framework family deliberately and keep direct packages on the supported major. Do not merge automated changes that create peer-dependency override warnings.

Never use `npm audit fix --force` as a blanket maintenance command. Follow [Dependency Security](./DEPENDENCY_SECURITY.md).

## Security maintenance

Regularly review:

- dependency advisories;
- Supabase privilege model;
- provider auth changes;
- GPT/OpenAPI integration behavior;
- edge/proxy logs for credential exposure;
- encryption-key storage/backup procedures.

## Provider maintenance

Because runtime tool catalogs are discovered dynamically, many upstream tool additions should not require code changes.

Changes to provider:

- endpoint;
- authentication;
- transport framing;
- response format;
- API availability/rate limits

may require adapter updates.
