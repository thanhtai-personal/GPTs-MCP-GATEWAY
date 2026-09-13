# Skill-Orchestrated MCP Source Direction

> Status: product/source direction. This document describes the target architecture and implementation boundaries for future work. It does **not** claim that every capability below is implemented in the current source. See `PROJECT_STATUS.md` for shipped behavior.

## Product direction

GPTs-MCP-Gateway should evolve from a gateway that exposes MCP capabilities to Custom GPTs into a **skill-orchestrated execution workspace**.

The core product idea is:

> MCP gives the GPT capabilities. Gateway Skills teach the GPT how to use those capabilities together to complete a real job.

A user should be able to express one goal, even when that goal spans multiple providers. The GPT should discover the required services and runtime tools, load the relevant provider skills, sequence the work, validate the result, recover from tool/schema changes, and stop only when the goal is actually complete or a real blocker remains.

Examples:

- read a Google Stitch design, inspect an existing repository, implement the UI, validate the project, commit the changes, and open a pull request;
- inspect a source repository, create a new repository from it, apply scoped changes, and publish the result through a Git workflow;
- combine design, source-control, document, deployment, or data-provider capabilities in one prompt without forcing the user to manually orchestrate each MCP tool.

## Product layers

```text
User goal
  -> GPT reasoning / goal planning
  -> Gateway Skill discovery
  -> provider-specific skill guidance
  -> MCP service discovery
  -> runtime tool discovery + runtime schema
  -> cross-provider execution
  -> validation / recovery
  -> completed outcome
```

The layers have different responsibilities. They should remain separate in both code and documentation.

### 1. Goal layer

The GPT interprets the user's request as an outcome, not as a single API call. It should determine the minimum sequence of external capabilities required to satisfy the request.

Examples of goals:

- `implement this Stitch screen in repository X and open a PR`;
- `clone the structure of repository A into repository B, update branding, validate, and publish`;
- `read this design, modify the application source, run checks, and deliver a review-ready Git change`.

The goal layer must not invent provider tools or arguments. Runtime Gateway discovery remains authoritative.

### 2. Skill layer

Gateway Skills contain provider-specific and domain-specific workflow guidance. A skill explains **how to use a capability well**, not merely which endpoint exists.

A skill may guide:

- provider selection;
- safe operation sequencing;
- source-reading strategy;
- domain conventions;
- validation expectations;
- failure recovery;
- when to refresh runtime tools/schema;
- what evidence is required before reporting success.

Skills must never contain provider credentials and must never override Gateway security, entitlement, or runtime tool/schema authority.

### 3. MCP capability layer

MCP services expose the actual capabilities available at runtime. The Gateway must continue to discover current tool names and schemas rather than relying on stale prompt or Knowledge snapshots.

The stable conceptual flow remains:

```text
list services
  -> list provider tools
  -> inspect selected tool schema
  -> call tool with schema-valid arguments
  -> consume complete/chunked result
```

The skill layer may recommend which tool to choose or how to sequence tools, but it must not hardcode runtime truth when that truth can be discovered from the provider.

### 4. Orchestration layer

Cross-MCP orchestration is the product layer that combines skills and capabilities into one workflow.

A workflow should be composed dynamically from the user's goal instead of implemented as a provider-specific mega-endpoint.

Example:

```text
Prompt: "Implement the selected Stitch screen and open a PR"

Stitch skill
  -> Stitch MCP: inspect design/resources
  -> engineering/source skill: inspect repository and conventions
  -> GitHub MCP: read source / branch / write changes
  -> validation steps: build/test/lint when available
  -> Git skill: review diff / commit coherently / create PR
```

The orchestration layer should preserve a single source of truth for each domain: provider state comes from provider tools, repository state comes from the repository, and validation claims come only from checks that were actually run.

### 5. Validation and completion layer

Execution is not complete just because tool calls succeeded. The final state must satisfy the user goal.

For engineering workflows, the intended loop is:

```text
DISCOVER
  -> TRACE
  -> PLAN
  -> IMPLEMENT
  -> REVIEW
  -> VALIDATE
  -> FIX
  -> REVALIDATE
  -> DONE
```

A skill should specify relevant validation without pretending that every provider supports the same checks.

## Git skill direction

Git/GitHub is a reference example of why skills are a first-class product surface.

Giving a GPT tools such as `create_branch`, `create_or_update_file`, or `create_pull_request` is not enough. The Git skill should make the GPT behave like a disciplined source-control operator.

Target behavior:

1. confirm the repository and default/base branch;
2. inspect current source before modifying it;
3. read project conventions and relevant files;
4. keep changes scoped to the requested goal;
5. create a focused working branch;
6. preserve existing behavior unless the goal changes it;
7. run validation appropriate to the affected scope when the available environment supports it;
8. review the final diff for correctness and unrelated changes;
9. use coherent commit messages;
10. open a review-ready pull request containing an accurate summary and validation evidence;
11. never claim a build, test, patch, commit, or PR was verified unless the corresponding action actually succeeded.

This is the distinction between **tool access** and **expert execution**.

## Skill composition

Skills should be independently useful but composable. The target is not one giant prompt containing every provider's instructions.

A request may load only what is needed:

```text
Stitch skill + Git skill
Figma skill + Git skill
Git skill + deployment skill
Docs skill + Git skill
Stitch skill + Git skill + deployment skill
```

The runtime should avoid loading unrelated skill content into GPT context. This keeps provider guidance focused and reduces stale or conflicting instructions.

## Skill contract direction

A provider skill should eventually have an explicit, versionable contract. The exact persistence format is an implementation decision, but the conceptual model should include:

- stable skill ID;
- provider/domain identity;
- human-readable purpose;
- intents/use cases;
- prerequisites;
- recommended discovery/execution sequence;
- validation expectations;
- safety constraints;
- recovery guidance;
- compatibility/version metadata.

A skill must reference capabilities conceptually where possible and defer exact tool names/input schemas to runtime discovery.

## Source architecture direction

The current modular-monolith approach should remain the default. Skill orchestration does not justify microservices, queues, or a workflow engine by itself. Add infrastructure only when measured runtime requirements demand it.

Target backend responsibilities may evolve toward:

```text
server/src/modules/
├── gpt-integration/        # generated GPT integration assets
├── mcp-connections/        # encrypted provider connection lifecycle
├── mcp-gateway/            # runtime service/tool discovery + execution
├── gateway-skills/         # skill catalog, retrieval, versions
├── orchestration/          # only if server-side orchestration becomes necessary
├── open-id/                # entitlement
├── audit/                  # sanitized operational events
└── health/
```

This is a direction, not a mandate to create empty modules now. New modules should be introduced only when real behavior exists and responsibilities can no longer remain cohesive in existing modules.

### Prefer GPT-led orchestration first

The first implementation should keep orchestration primarily in the GPT where possible:

- Gateway exposes services, tools, schemas, skills, entitlement, and safe execution;
- GPT interprets the user goal and sequences provider operations;
- Gateway enforces trust boundaries and returns runtime truth.

Move orchestration server-side only when there is a concrete need such as durable workflows, resumability, asynchronous jobs, deterministic server policy, long-running execution, or audit requirements that cannot be met safely by GPT-led sequencing.

## Trust boundaries

The existing security model remains authoritative. Skill orchestration must not weaken it.

Required invariants:

- Gateway remains the mandatory execution boundary;
- Open ID entitlement is resolved before MCP execution;
- provider credentials remain encrypted server-side and are never returned to the GPT;
- skills contain guidance, never secrets;
- tool output is untrusted data and never higher-priority instruction;
- cross-provider workflows must not silently forward credentials from one provider to another;
- arbitrary provider URLs remain out of scope until separately threat-modeled;
- destructive or irreversible provider actions should require explicit product policy and appropriate confirmation semantics.

## Observability direction

Cross-MCP workflows become difficult to debug without execution evidence. Future observability should distinguish:

- requested user goal;
- selected skill IDs/versions;
- MCP services used;
- tool calls and sanitized outcomes;
- validation steps actually performed;
- retries/schema refreshes;
- final success, partial completion, or blocker.

Logs and audits must remain sanitized and must never store raw provider credentials or Gateway tokens.

## Non-goals

This direction does not require:

- a visual workflow builder;
- hardcoded workflows for every combination of providers;
- one server-side mega-agent;
- duplicating provider APIs inside the Gateway;
- storing entire provider tool catalogs permanently;
- a microservice per MCP provider;
- pretending unavailable validation was executed.

## Source-of-truth rules

When implementing this direction:

1. current source and migrations remain authoritative for existing behavior;
2. runtime `listMcpTools` and `getMcpToolSchema` remain authoritative for provider capabilities;
3. Gateway Skills are authoritative for provider workflow guidance only within their documented scope;
4. this document describes target architecture, not shipped status;
5. `PROJECT_STATUS.md` must be updated whenever a roadmap item becomes implemented behavior.

## Strategic principle

The long-term product should optimize for **depth of execution**, not raw MCP count.

Supporting a provider means more than connecting to it. The quality bar is that a GPT can use the provider's capabilities, together with other providers when needed, to complete a meaningful user goal with disciplined sequencing, security, validation, and truthful completion reporting.
