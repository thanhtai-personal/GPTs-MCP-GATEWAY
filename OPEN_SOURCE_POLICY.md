# Open-source Policy

MCP Gateway is released under the **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)**.

This policy explains how the project stays genuinely open source while the official hosted Gateway/Open ID service may be commercial.

## What the open-source license covers

The repository source code is licensed under AGPL-3.0-or-later unless a file says otherwise.

You may, subject to the license:

- use the software privately or commercially;
- inspect and modify the source;
- self-host it;
- redistribute the original or modified source;
- run a network service based on it.

For covered modified versions offered to users over a network, AGPL section 13 requires the corresponding source to be offered to those users under the AGPL terms.

Read the canonical license text in [LICENSE](./LICENSE).

## What the license does not give you

The repository license does not grant:

- access to an official hosted MCP Gateway deployment;
- a paid/hosted Open ID issued by the project operator;
- provider API keys or other credentials;
- rights to impersonate or misrepresent an official project service;
- rights to third-party trademarks, APIs, or services.

An Open ID issued by an official hosted deployment is a **service entitlement**, not a software-license key.

## Commercial model

The code being open source does not make the hosted service free.

The intended model is:

```text
Open-source code
  -> anyone may inspect/self-host under AGPL

Official hosted service
  -> operated, secured and maintained by the service owner
  -> may charge for hosted Open ID/member entitlements
```

A self-hoster controls their own database and may change entitlement rules in their fork. The commercial value of the official service must therefore come from the operated service, reliability, integrations, support, convenience and official Open ID entitlement — not from pretending the published source cannot be changed.

See [COMMERCIAL.md](./COMMERCIAL.md).

## Contribution rule

By submitting a contribution, you agree that your contribution is provided under the same AGPL-3.0-or-later license as the project.

Do not contribute code you do not have the right to license.

Third-party code copied into the repository must have a compatible license and retain notices required by that license.

## Security rule

Never commit real credentials, tokens, API keys, service-role keys or `.env` files.

Do not use `npm audit fix --force` as a normal remediation workflow. It may intentionally install semver-major packages and produce an invalid peer-dependency tree.

Security dependency changes must be deliberate:

1. identify the vulnerable package and actual affected path;
2. update a compatible dependency or explicit override;
3. inspect peer dependencies;
4. perform a clean install;
5. run audit, typecheck, build and tests;
6. document any accepted residual risk.

See [docs/DEPENDENCY_SECURITY.md](./docs/DEPENDENCY_SECURITY.md).

## Compatibility rule

These are treated as public contracts once released:

- database migration history;
- environment variable names;
- Gateway error codes;
- MCP provider IDs;
- GPT OpenAPI operation IDs;
- GPT routing protocol;
- documented HTTP endpoints.

Breaking changes must be intentional, documented and versioned.

## Pull-request rule

Changes should be merged through pull requests after required checks pass.

A PR should state:

- goal/root cause;
- scope;
- security impact;
- migration/API impact;
- validation actually run;
- remaining limitations.

Repository rule settings recommended for GitHub are documented in [.github/REPOSITORY_RULES.md](./.github/REPOSITORY_RULES.md).

## Project name and official service

Forks may accurately state that they are based on MCP Gateway, but should not imply that a fork is the official hosted service or is endorsed by the original project owner when it is not.

This policy supplements the license and project documentation; if it conflicts with the AGPL license for covered code, the license controls.
