# Commercial Model

MCP Gateway uses an open-source software + paid hosted service model.

## What is free/open source

The source code in this repository is available under AGPL-3.0-or-later.

A user may self-host the software under the license terms. Commercial use of the open-source code is **not prohibited** by AGPL.

If the product ever needs to prohibit third parties from providing a competing hosted service, that would require a different, source-available licensing strategy and should not be described as OSI open source.

## What may be paid

An operator of an official hosted deployment may charge for services around the software, including:

- hosted Open ID/member entitlement;
- managed infrastructure;
- updates and operational maintenance;
- provider integrations;
- support;
- reliability/monitoring;
- higher hosted quotas or service plans.

The current product concept sells access to an **Open ID on the official hosted Gateway**, not permission to inspect or self-host the source code.

## Open ID boundary

Repository license:

```text
grants rights to software source
```

Hosted Open ID:

```text
grants entitlement on a particular hosted Gateway deployment
```

Those are separate concepts.

Publishing the source does not create a valid Open ID on the official hosted deployment.

Likewise, a self-hosted fork can issue identifiers for its own deployment, but those identifiers are not official hosted Open IDs.

## Optional commercial licensing later

AGPL alone is sufficient for an open-source + hosted-service model.

If the project later wants to offer a separate proprietary license to organizations that cannot comply with AGPL obligations, contributor/relicensing rights must be reviewed before such a dual-license program is announced. Do not assume contributions can automatically be relicensed.

This file documents product boundaries, not legal advice or hosted-service Terms of Service.
