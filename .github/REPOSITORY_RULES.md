# Recommended GitHub Repository Rules

These settings cannot be enforced by a Git patch alone. Configure them in GitHub after the repository is created.

## Default branch

Use `main`.

## Branch protection / ruleset

Recommended rule for `main`:

- require pull requests before merge;
- require at least 1 approving review for external contributions;
- dismiss stale approvals when new commits materially change a PR;
- require conversation resolution before merge;
- require status checks:
  - `static-checks`
  - `server`
  - `web`
- block force pushes;
- block branch deletion;
- require linear history if the project uses squash/rebase;
- allow repository administrators to bypass only for emergency/security fixes;
- do not require signed commits until maintainers are ready to support that workflow consistently.

## Merge policy

Recommended:

- squash merge: enabled;
- merge commits: disabled;
- rebase merge: optional;
- automatically delete head branches after merge.

Keep release tags immutable.

## Security settings

Enable where available:

- private vulnerability reporting;
- dependency graph;
- Dependabot alerts;
- Dependabot security updates;
- secret scanning;
- push protection for secrets;
- CodeQL/default setup if it supports the repository stack without excessive noise.

## Actions permissions

Prefer:

- read repository contents by default;
- grant write permissions only to workflows that need them;
- pin third-party actions to reviewed major versions or commit SHAs when practical;
- do not expose production secrets to pull requests from forks.

The included CI workflow uses read-only permissions.

## Contribution policy

Public contributions must comply with:

- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [OPEN_SOURCE_POLICY.md](../OPEN_SOURCE_POLICY.md)
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)
- [SECURITY.md](../SECURITY.md)

## Releases

Before creating a public release/tag, complete [docs/OPEN_SOURCE_RELEASE.md](../docs/OPEN_SOURCE_RELEASE.md).
