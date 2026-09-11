# Documentation

This directory documents the behavior that exists in the current MCP Gateway source. Product ideas that are not implemented should stay in `REQUIREMENTS.md` or `PROJECT_STATUS.md`, not be described as shipped behavior.

## Read by goal

### I want to understand the system

1. [Architecture](./ARCHITECTURE.md)
2. [GPT Gateway Protocol](./GPT_PROTOCOL.md)
3. [Security Model](./SECURITY_MODEL.md)
4. [Data Handling](./DATA_HANDLING.md)

### I want to run it

1. [Self-hosting](./SELF_HOSTING.md)
2. [API Reference](./API_REFERENCE.md)
3. [Troubleshooting](./TROUBLESHOOTING.md)

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

## Source of truth order

When documentation and code disagree, use this priority:

1. current source and migration;
2. automated validation/check scripts;
3. architecture/API/security docs;
4. requirements/roadmap documents.

Open an issue or PR to bring stale documentation back in sync.
