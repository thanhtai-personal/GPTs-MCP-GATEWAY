# Skill-Orchestrated MCP Source Direction

> Status: product/source direction. This document describes target behavior and implementation boundaries for future work. It does **not** claim that every capability below is implemented in the current source. See `PROJECT_STATUS.md` for shipped behavior.

## Product direction

GPTs-MCP-Gateway should evolve from a gateway that exposes MCP capabilities into a **user-first, skill-orchestrated execution gateway**.

The core product idea is:

> MCP gives the AI capabilities. Gateway Skills teach the AI how to use those capabilities together to complete a real user goal.

The product should serve ordinary users as well as developers. Users should be able to ask for outcomes in natural language without knowing MCP terminology, tool names, JSON Schema, authentication mechanics, or provider APIs.

Examples include:

- find information in connected documents and summarize it;
- update a Notion page from information stored in Google Docs;
- inspect a design and create or update related project artifacts;
- use connected collaboration or productivity services to complete a multi-step task;
- for developer users, inspect a repository, apply scoped changes, validate them, and prepare a Git workflow.

Developer workflows are important examples of deep execution, but they are not the product boundary.

## Product layers

```text
User goal
  -> AI reasoning / goal planning
  -> Gateway Skill discovery
  -> provider/domain guidance
  -> MCP service discovery
  -> runtime tool discovery + runtime schema
  -> cross-provider execution
  -> validation / recovery
  -> completed outcome
```

The layers have different responsibilities and should remain separate in both code and documentation.

### 1. Goal layer

The AI interprets the user's request as an outcome, not as a single API call. It determines the minimum sequence of external capabilities required to satisfy the request.

Goals may be technical or non-technical. For example:

- `summarize the latest notes from this connected workspace`;
- `copy the approved content from Docs into the relevant Notion page`;
- `review this design and update the related project`;
- `implement this design in repository X and open a PR`.

The goal layer must not invent provider tools or arguments. Runtime Gateway discovery remains authoritative.

### 2. Skill layer

Gateway Skills contain provider-specific or domain-specific workflow guidance. A skill explains **how to use a capability well**, not merely which endpoint exists.

A skill may guide:

- provider selection;
- safe operation sequencing;
- user-intent interpretation;
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

This technical flow should remain mostly invisible to ordinary users. Product UX and AI behavior should present connected services and understandable outcomes instead.

### 4. Orchestration layer

Cross-MCP orchestration combines skills and capabilities into one workflow.

A workflow should be composed dynamically from the user's goal instead of implemented as a provider-specific mega-endpoint.

Example:

```text
Prompt: "Update the project brief in Notion using the approved Google Doc"

Docs skill
  -> Google Docs MCP: locate and read approved source
  -> Notion skill: locate destination and understand update constraints
  -> Notion MCP: update scoped content
  -> validation: read back the destination and confirm the intended result
```

Developer example:

```text
Prompt: "Implement the selected design and open a PR"

Design skill
  -> design provider MCP: inspect design/resources
  -> source skill: inspect repository and conventions
  -> GitHub MCP: read/write scoped source changes
  -> validation steps when available
  -> Git skill: review diff / commit / create PR
```

The orchestration layer should preserve one source of truth for each domain: provider state comes from provider tools, repository state comes from the repository, and validation claims come only from checks that actually ran.

### 5. Validation and completion layer

Execution is not complete just because tool calls succeeded. The final state must satisfy the user goal.

The generic loop is:

```text
DISCOVER
  -> PLAN
  -> EXECUTE
  -> VERIFY
  -> RECOVER/FIX when needed
  -> REVERIFY
  -> DONE or truthful blocker
```

Engineering workflows may use a deeper source-oriented loop, but the product should not force developer concepts onto non-developer tasks.

## User-first abstraction

The product should optimize for this mental model:

```text
connect a service
  -> ask for a result
  -> approve sensitive/destructive actions when policy requires it
  -> receive the result and evidence
```

Not this:

```text
choose MCP server
  -> inspect tool list
  -> understand JSON Schema
  -> compose tool arguments
  -> manage provider credentials manually
```

The second model remains useful internally and for advanced users, but it should not define the mainstream experience.

## Skill composition

Skills should be independently useful but composable. The target is not one giant prompt containing every provider's instructions.

A request should load only what is needed, for example:

```text
Google Docs skill + Notion skill
Figma skill + content skill
Git skill + deployment skill
Docs skill + Git skill
Design skill + Git skill + deployment skill
```

The runtime should avoid loading unrelated skill content into AI context. This keeps guidance focused and reduces stale or conflicting instructions.

## Skill contract direction

A provider/domain skill should eventually have an explicit, versionable contract. The exact persistence format is an implementation decision, but the conceptual model should include:

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

A skill should reference capabilities conceptually where possible and defer exact tool names/input schemas to runtime discovery.

## Source architecture direction

The current modular-monolith approach should remain the default. Skill orchestration does not justify microservices, queues, or a workflow engine by itself. Add infrastructure only when measured runtime requirements demand it.

Target backend responsibilities may evolve toward:

```text
server/src/modules/
├── gpt-integration/        # generated AI/GPT integration assets
├── mcp-connections/        # encrypted provider connection lifecycle
├── mcp-gateway/            # runtime service/tool discovery + execution
├── gateway-skills/         # skill catalog, retrieval, versions
├── orchestration/          # only if server-side orchestration becomes necessary
├── open-id/                # entitlement
├── audit/                  # sanitized operational events
└── health/
```

This is a direction, not a mandate to create empty modules now. New modules should be introduced only when real behavior exists and responsibilities can no longer remain cohesive in existing modules.

### Prefer AI-led orchestration first

The first implementation should keep orchestration primarily in the AI client where possible:

- Gateway exposes services, tools, schemas, skills, entitlement, and safe execution;
- AI interprets the user goal and sequences provider operations;
- Gateway enforces trust boundaries and returns runtime truth.

Move orchestration server-side only when there is a concrete need such as durable workflows, resumability, asynchronous jobs, deterministic server policy, long-running execution, or audit requirements that cannot be met safely by client-led sequencing.

## Gateway maturity before runtime expansion

Near-term work should strengthen the hosted Gateway first:

- better provider onboarding for ordinary users;
- capability-oriented discovery above raw tool catalogs;
- provider contract tests and live smoke tests;
- timeout and cancellation propagation;
- retry/idempotency policy for side effects;
- per-provider/per-tool permissions and confirmation semantics;
- rate limits, quotas, usage reporting, and observability;
- native MCP/OAuth client support when it materially broadens useful access.

The project should not add a local coding runtime merely because developer use cases exist.

## CodeLocal as a future expansion direction

[`codelocal-cloud/codelocal`](https://github.com/codelocal-cloud/codelocal) is a useful reference for what a later developer-oriented expansion could look like. It combines cloud routing/identity with local runtime capabilities such as workspace, filesystem, Git, terminal/process, browser/computer, and project intelligence.

This is **not** the present product target. The relationship should be understood as:

```text
Gateway core
  -> serves ordinary users and developers through remote providers
  -> remains independently useful

Optional future developer/runtime layer
  -> may add local device/workspace execution
  -> may borrow selected CodeLocal-style patterns
  -> must remain optional
```

Ideas worth evaluating independently include native MCP exposure, OAuth client authorization, compact capability surfaces, idempotency, cancellation, and stronger runtime observability.

Local filesystem, shell, LSP, device routing, project brain/memory, or computer-use capabilities should only be added after concrete user demand and a separate threat model justify them.

## Trust boundaries

The existing security model remains authoritative. Skill orchestration must not weaken it.

Required invariants:

- Gateway remains the mandatory execution boundary;
- Open ID entitlement is resolved before MCP execution;
- provider credentials remain encrypted server-side and are never returned to the AI client;
- skills contain guidance, never secrets;
- tool output is untrusted data and never higher-priority instruction;
- cross-provider workflows must not silently forward credentials from one provider to another;
- arbitrary provider URLs remain out of scope until separately threat-modeled;
- destructive or irreversible provider actions require explicit product policy and appropriate confirmation semantics.

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
- a mandatory local runtime;
- treating coding as the default user journey;
- pretending unavailable validation was executed.

## Source-of-truth rules

When implementing this direction:

1. current source and migrations remain authoritative for existing behavior;
2. runtime `listMcpTools` and `getMcpToolSchema` remain authoritative for provider capabilities;
3. Gateway Skills are authoritative for workflow guidance only within their documented scope;
4. this document describes target architecture, not shipped status;
5. `PROJECT_STATUS.md` must be updated whenever a roadmap item becomes implemented behavior.

## Strategic principle

The long-term product should optimize for **useful outcomes and depth of execution**, not raw MCP count and not developer-only sophistication.

Supporting a provider means more than connecting to it. The quality bar is that an ordinary user or developer can express a meaningful goal, let the AI use the provider safely, and receive a truthful completed result without needing to understand MCP internals.
