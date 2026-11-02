# Licensing

MCP Gateway is licensed under **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)**.

The canonical license text is at [../LICENSE](../LICENSE).

The npm manifests may remain `"private": true`; that flag only prevents accidental npm-registry publication and does not make the Git repository proprietary.

## Why AGPL fits this project

MCP Gateway is network-server software and the product concept includes an official hosted Gateway/Open ID service.

AGPL keeps the code genuinely open source while requiring covered modified versions made available over a network to provide corresponding source under the AGPL terms.

This supports reciprocal source availability without pretending that open source means the official hosted service must be free.

## Commercial use

AGPL permits commercial use.

A third party can run a commercial service using AGPL-covered software if they comply with the license.

Therefore, the project must **not** claim that AGPL reserves all commercial hosting exclusively to the original owner.

The official commercial boundary is instead:

- source code: AGPL;
- official hosted service: operated separately;
- hosted Open ID: entitlement on that hosted deployment;
- provider credentials: owned by each user;
- support/SLA/billing: service terms, not source-license terms.

See [../COMMERCIAL.md](../COMMERCIAL.md).

## Why not a “non-commercial open-source” clause

A license that forbids commercial use does not satisfy the standard Open Source Definition's no-discrimination-against-fields-of-endeavor principle.

If the project ever chooses a source-available/non-commercial license, documentation should say **source available**, not open source.

That is not the current policy.

## Dual licensing

The current repository is not advertising a separate proprietary code license.

If a proprietary/commercial code license is offered later, maintainers must first ensure they have the legal right to relicense all relevant contributions. Do not assume contributor code can automatically be relicensed.

A Contributor License Agreement may become relevant only if the project deliberately adopts that business model.

## Dependencies

The AGPL project license does not replace third-party licenses.

Before a release:

- generate and commit clean lockfiles;
- review production dependency licenses;
- retain attribution/notices required by dependencies;
- avoid dependencies with incompatible terms.

### Dependency license review (2026-11-02)

Reviewed from the committed `server/package-lock.json` (630 packages) and
`web/package-lock.json` (174 packages). `local-agent/` has no npm
dependencies.

| License | server | web | AGPL-3.0 compatible |
| --- | ---: | ---: | --- |
| MIT | 533 | 145 | yes |
| ISC | 38 | 7 | yes |
| BSD-3-Clause / BSD-2-Clause | 26 | 3 | yes |
| Apache-2.0 | 15 | 3 | yes (GPLv3-compatible) |
| BlueOak-1.0.0 | 9 | 0 | yes |
| MPL-2.0 | 0 | 12 | yes (file-level copyleft; keep MPL notices) |
| Unlicense, 0BSD, CC0-1.0 / MIT dual | 5 | 2 | yes |
| CC-BY-4.0 (caniuse-lite data) | 1 | 1 | yes (attribution kept in package) |
| Python-2.0 (argparse) | 1 | 1 | yes |
| no SPDX field: `busboy`, `streamsearch` | 2 | 0 | yes (both ship an MIT license file) |

No GPL-incompatible, proprietary, non-commercial or SSPL-style licenses were
found. Repeat this review whenever lockfiles change materially, for example
with `npx license-checker --summary` inside `server/` and `web/`.

## Copyright and notices

Copyright is held by the project author and contributors; see [../NOTICE](../NOTICE).
Contributors keep copyright in their contributions and license them under
AGPL-3.0-or-later (see [../OPEN_SOURCE_POLICY.md](../OPEN_SOURCE_POLICY.md)).
Keep `LICENSE` and `NOTICE` in every redistribution.

## Branding

The software license does not imply endorsement of forks or grant rights to third-party marks.

Forks should clearly distinguish their deployment from any official hosted MCP Gateway/Open ID service.

## Hosted legal documents

A public hosted service may separately need:

- Terms of Service;
- Privacy Policy;
- billing/refund terms;
- acceptable-use rules;
- service-specific data retention policy.

Those documents are operational/commercial terms and should not be placed inside the AGPL license text.

This document explains the repository policy and is not legal advice.
