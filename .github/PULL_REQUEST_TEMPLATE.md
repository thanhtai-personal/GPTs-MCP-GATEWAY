## Goal / root cause

<!-- What problem does this PR solve? -->

## Changes

<!-- Focused summary of modules/files/contracts changed. -->

## Database / API contract

- [ ] No database/API contract change.
- [ ] Database/API contract changed and docs/migration are included.

## Security

<!-- Does this touch auth, entitlement, credentials, provider networking, logs, or secrets? -->

## Validation

<!-- List commands actually run and exact results. Do not mark unexecuted checks as passed. -->

```text
npm run check
...
```

## Remaining limits

<!-- Anything not verified, environment limitations, follow-up work. -->

## Checklist

- [ ] No real secrets or `.env` files committed.
- [ ] No unrelated refactor/formatting churn.
- [ ] Documentation updated for public behavior/config changes.
- [ ] Existing migration history was not rewritten.
- [ ] Provider changes preserve the Gateway/Open ID credential boundary.
- [ ] I have the right to contribute these changes under AGPL-3.0-or-later.
- [ ] Dependency changes follow `docs/DEPENDENCY_SECURITY.md`; no blanket `npm audit fix --force` rewrite is included.
