# FAQ

## Is “Open ID” OpenID Connect?

No.

In this project, **Open ID** is the name of a Gateway entitlement identifier. It is unrelated to the OpenID Connect authentication standard.

## What is actually sold in the hosted product model?

The commercial concept is the paid/exportable Open ID entitlement.

The GPT Integration Kit, Action Schema, Instructions, and Knowledge are integration assets. A token authenticates a request; the linked Open ID authorizes MCP execution.

## Can a Guest configure MCP before paying?

Yes.

An authenticated Guest can connect a supported provider and download the GPT Integration Kit.

## When does the seven-day trial start?

Only when the Guest explicitly creates the trial token.

Registration, login, provider connection, or GPT-kit download do not start the clock.

## Can a Guest claim a second trial after revoking the first token?

No.

Trial eligibility is a lifetime account invariant stored independently of whether the current token still exists/works.

## Why does the trial create an Open ID if Open ID is paid?

The trial creates an **internal non-exportable** Open ID so the same Gateway entitlement path is used for trial and paid execution.

The Guest does not receive that trial Open ID as the paid product.

## Can a Member create unlimited Open IDs?

Not in the current MVP.

The current source enforces one paid Open ID per account. A Member can create multiple Gateway tokens linked to it.

## Does the GPT store the Stitch API key?

No.

The user saves the key in the web app. The server encrypts it and sends it to Stitch only when executing a Stitch MCP request.

## Why not let a user paste any MCP server URL?

Security and support scope.

Arbitrary endpoints introduce SSRF, credential-exfiltration, redirect, DNS rebinding, authentication, and transport risks. The MVP supports an explicit provider registry.

## Why does the GPT discover tools every time?

It does not necessarily need to repeat discovery within an immediate interaction, but runtime `tools/list` is the authority because provider tool catalogs can change independently of this repository.

## Is the project affiliated with OpenAI or Google?

No affiliation is implied.

The project interoperates with Custom GPT Actions and Google Stitch, but third-party names are used only to identify integration targets.

## Can I self-host it?

Yes, structurally. Read `SELF_HOSTING.md` and the current validation limitations before production use.

## Is the repository open-source licensed?

Yes.

The repository uses AGPL-3.0-or-later. Commercial use of the code is permitted under that license. The official hosted Gateway/Open ID service may still be paid because hosted-service entitlement is separate from source-code licensing.

Read `../OPEN_SOURCE_POLICY.md`, `../COMMERCIAL.md`, and `LICENSING.md`.
