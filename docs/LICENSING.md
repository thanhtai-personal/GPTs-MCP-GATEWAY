# Licensing Decision

The current package manifests declare `UNLICENSED` and this repository intentionally does not add a `LICENSE` file without an owner decision.

Selecting a license is a product/business decision, not a formatting task.

## Why the decision matters here

MCP Gateway has a hosted-service business concept around paid Open ID entitlements while also being suitable for self-hosting.

A public source license determines what others may do with the code, including whether they may modify it, redistribute it, or operate a competing hosted service.

## Common options to evaluate

### MIT

Characteristics:

- very permissive;
- low adoption friction;
- allows proprietary forks;
- allows third parties to run modified hosted versions without publishing those modifications.

Good fit when maximizing reuse/ecosystem adoption is more important than reciprocal source sharing.

### Apache License 2.0

Characteristics:

- permissive;
- includes an explicit patent license/grant structure;
- allows proprietary forks/hosted versions;
- somewhat more detailed compliance requirements than MIT.

Often selected when a permissive license with clearer patent terms is preferred.

### GNU AGPL v3

Characteristics:

- strong copyleft;
- includes a network-use source-offer obligation for modified covered software;
- third parties can still run commercial hosted services, but covered modifications generally must remain available under AGPL terms to network users.

Often considered for open-source server/SaaS software when reciprocal source availability is important.

## What these licenses do not solve

An open-source license does not by itself:

- prevent competitors;
- reserve your hosted Open ID service to you;
- create trademark protection;
- define cloud service terms;
- replace a privacy policy or Terms of Service;
- guarantee third-party dependency compatibility.

If the hosted service needs separate commercial terms, write those separately for the hosted service.

## Before publishing

The repository owner should:

1. choose a license with legal/business advice appropriate to the project;
2. add the canonical license text as `LICENSE`;
3. update package `license` metadata to the SPDX identifier;
4. add copyright notices only if desired/required;
5. review dependency license compatibility;
6. decide whether the project name/logo needs a trademark policy.

Until then, describe the repository as **source code prepared for open-source publication**, not as already licensed open source.

This document is an engineering release checklist, not legal advice.
