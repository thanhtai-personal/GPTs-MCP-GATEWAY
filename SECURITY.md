# Security Policy

MCP Gateway handles API keys and bearer credentials. Please treat security reports as sensitive.

## Supported versions

The project is currently an experimental MVP and does not yet publish a stable supported-version matrix.

Security fixes should target the current default development branch until formal releases exist.

## Reporting a vulnerability

Preferred workflow on GitHub:

1. Open the repository **Security** tab.
2. Use **Report a vulnerability** / private vulnerability reporting if enabled.
3. Include affected component, impact, reproduction details, and suggested mitigation if known.

If private vulnerability reporting is not available, open a minimal public issue asking maintainers for a private contact channel **without** posting exploit details, credentials, personal data, or a working secret.

Do not include real:

- Gateway tokens;
- Supabase access/service-role tokens;
- provider API keys;
- encryption keys;
- user data.

## What to expect

Maintainers should:

1. acknowledge the report;
2. reproduce/triage;
3. agree on disclosure timing where appropriate;
4. prepare a fix and regression validation;
5. publish a security advisory/release note for material issues.

Response-time guarantees are not defined yet for this early project.

## High-impact areas

Reports are especially valuable for:

- cross-account provider credential access;
- bypassing Open ID/trial/member entitlement;
- Gateway token authentication bypass;
- secret exposure in API responses/logs;
- SSRF/credential exfiltration;
- encryption/decryption flaws;
- Supabase RLS/privilege bypass;
- generated GPT kit leaking credentials;
- provider tool call authorization isolation.

## Dependency vulnerability policy

Do not treat `npm audit fix --force` as an approved remediation path. It can install incompatible semver-major framework packages while npm continues with peer override warnings.

Dependency security fixes should preserve a coherent supported framework tree and be validated by clean install, audit, typecheck, build and tests.

See [docs/DEPENDENCY_SECURITY.md](./docs/DEPENDENCY_SECURITY.md).

## Deployment operators

If you suspect a production secret leak, follow the incident guidance in [docs/SECURITY_MODEL.md](./docs/SECURITY_MODEL.md).

The project cannot rotate provider keys or hosted-environment secrets on behalf of self-hosters.
