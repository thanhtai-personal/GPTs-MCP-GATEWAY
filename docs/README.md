# Documentation

This directory documents the behavior that exists in the current MCP Gateway source and the product direction around it. Product ideas that are not implemented must remain explicitly marked as direction/requirements rather than shipped behavior.

## Product focus

GPTs-MCP-Gateway is currently **gateway-first and user-first**. Its main purpose is to let AI clients safely use connected external services through one controlled execution boundary.

The product is intended for ordinary users as well as developers. Users should think in terms of connecting services and asking for outcomes; MCP transports, tool schemas, provider credentials, and runtime discovery should remain implementation details wherever possible.

Developer-oriented local runtime ideas are a possible future expansion, not the current product target. `PROJECT_STATUS.md`, `ARCHITECTURE.md`, and `SKILL_ORCHESTRATION_DIRECTION.md` describe that boundary in detail.

## Read by goal

### I want to understand the system

1. [Architecture](./ARCHITECTURE.md)
2. [GPT Gateway Protocol](./GPT_PROTOCOL.md)
3. [Security Model](./SECURITY_MODEL.md)
4. [Data Handling](./DATA_HANDLING.md)

### I want to understand the product/source direction

1. [Project Status](./PROJECT_STATUS.md) — current implementation, priorities, and explicit non-goals
2. [Skill-Orchestrated MCP Source Direction](./SKILL_ORCHESTRATION_DIRECTION.md) — user-first orchestration direction
3. [Skill-Orchestrated MCP Requirements](./SKILL_ORCHESTRATION_REQUIREMENTS.md)
4. [../REQUIREMENTS.md](../REQUIREMENTS.md) — current requirements snapshot

Direction/requirements documents describe target behavior. They are not evidence that a capability is already implemented.

### I want to run or connect services

1. [Self-hosting](./SELF_HOSTING.md)
2. [API Reference](./API_REFERENCE.md)
3. [GitHub MCP setup](./GITHUB_MCP_SETUP.md)
4. [Google Docs + Sheets MCP setup](./GOOGLE_WORKSPACE_MCP_SETUP.md)
5. [Notion MCP setup](./NOTION_MCP_SETUP.md)
6. [Figma MCP setup](./FIGMA_MCP_SETUP.md)
7. [Troubleshooting](./TROUBLESHOOTING.md)

### I want to contribute

1. [../CONTRIBUTING.md](../CONTRIBUTING.md)
2. [Adding an MCP Provider](./ADDING_MCP_PROVIDER.md)
3. [Project Status](./PROJECT_STATUS.md)

### I want to publish this repository

1. [Open-source Release Checklist](./OPEN_SOURCE_RELEASE.md)
2. [Licensing](./LICENSING.md)
3. [Dependency Security](./DEPENDENCY_SECURITY.md)
4. [../SECURITY.md](../SECURITY.md)
5. [../CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)

## Future expansion reference

The documentation uses [`codelocal-cloud/codelocal`](https://github.com/codelocal-cloud/codelocal) only as a reference for a possible later developer/runtime layer. Useful ideas may include native MCP client support, OAuth authorization, compact capability surfaces, idempotency, cancellation, observability, and — only if future demand requires it — optional local/device execution.

That comparison must not be interpreted as a commitment to turn this project into a coding-only platform. The hosted Gateway must remain independently useful for non-developer SaaS, document, design, productivity, and collaboration workflows.

## Source of truth order

When documentation and code disagree, use this priority:

1. current source and migrations;
2. automated validation/check scripts and actual runtime evidence;
3. architecture/API/security docs;
4. requirements/roadmap/direction documents.

Open an issue or PR to bring stale documentation back in sync.
