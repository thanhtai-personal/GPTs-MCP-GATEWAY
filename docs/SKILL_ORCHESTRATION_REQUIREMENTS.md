# Skill-Orchestrated MCP Requirements

> Status: product requirements for future implementation. Unless a requirement is also listed as implemented in `PROJECT_STATUS.md`, it must not be presented as shipped behavior.

## 1. Goal

Evolve GPTs-MCP-Gateway from a Custom GPT-to-MCP execution gateway into a **skill-orchestrated workspace** where one user prompt may coordinate multiple MCP providers and provider-specific skills to complete an end-to-end goal.

The product should optimize for quality and depth of execution rather than raw provider count.

A successful implementation should let the GPT combine capabilities such as design inspection, source analysis, code changes, validation, Git operations, documentation, and deployment while preserving current security and entitlement boundaries.

## 2. Product principles

### R-2.1 Skills are first-class guidance

The Gateway shall support skills that describe provider/domain workflows, sequencing, validation, recovery, and safety.

Skills shall answer **how to use provider capabilities well**. They shall not replace runtime MCP discovery.

### R-2.2 Runtime capabilities remain authoritative

Exact MCP service availability, tool names, permissions, and input schemas shall be discovered at runtime.

A skill must not cause the GPT to call an undiscovered tool or invent arguments outside the runtime schema.

### R-2.3 One prompt may span multiple providers

The GPT shall be able to complete one user goal using more than one connected MCP provider when the goal requires it.

The user shall not need to manually decompose a normal cross-provider goal into individual tool calls.

### R-2.4 Completion is outcome-based

A sequence of successful tool calls does not by itself mean the goal is complete. The GPT shall verify the requested outcome when verification is possible and shall report any unverified part explicitly.

### R-2.5 Current trust boundaries remain mandatory

Open ID entitlement, Gateway authentication, server-side provider credentials, provider allowlisting, safe error handling, and sanitized auditing remain mandatory constraints for skill-based execution.

## 3. Terminology

- **Goal**: the user-level outcome requested in a prompt.
- **Capability**: an operation currently available through a connected MCP service.
- **Gateway Skill**: versionable workflow guidance for a provider or domain.
- **Skill orchestration**: selecting and combining skills and MCP capabilities to complete a goal.
- **Runtime truth**: current MCP services, tools, schemas, permissions, and provider responses discovered during execution.
- **Validation evidence**: actual command/tool/check output that supports a success claim.

## 4. Skill catalog requirements

### R-4.1 Discover skills

The GPT-facing Gateway protocol shall expose a way to list available Gateway Skills without embedding the entire skill library into GPT Knowledge.

The response should contain only metadata needed to select a skill, such as:

- skill ID;
- title/name;
- provider/domain;
- short purpose;
- optional version/compatibility metadata.

### R-4.2 Fetch one skill on demand

The GPT-facing Gateway protocol shall expose a way to fetch one selected skill by stable ID.

The Gateway should return only the requested skill rather than all provider guidance.

### R-4.3 Stable skill identity

Each skill shall have a stable machine-readable ID. Renaming display text must not silently change its identity.

### R-4.4 Skill versioning

The system should support explicit skill versions or equivalent revision metadata so audits can identify which guidance shaped an execution.

### R-4.5 Skill content boundaries

A skill may contain:

- intent/use-case guidance;
- prerequisites;
- provider selection guidance;
- recommended sequencing;
- validation expectations;
- error/recovery strategies;
- safety/confirmation rules;
- domain conventions.

A skill shall not contain:

- provider credentials;
- Gateway tokens;
- secrets copied from user accounts;
- hardcoded claims that a runtime MCP tool exists when that must be discovered.

## 5. Skill selection requirements

### R-5.1 Load skills only when relevant

The GPT should fetch provider/domain skills only when they can materially improve execution of the current goal.

Unrelated skills should not be loaded into context by default.

### R-5.2 Prefer provider-specific guidance

When a user explicitly names a supported provider, the matching skill should be preferred when available.

When no provider is named, the GPT may inspect available services and skills to select a suitable execution path.

### R-5.3 Multiple skills per goal

The GPT may load multiple skills for one prompt when responsibilities are distinct and composable.

Example:

```text
Stitch skill
+ engineering/source workflow
+ Git/GitHub skill
```

Skills must not silently override one another. Higher-priority platform/security rules remain authoritative.

## 6. Cross-MCP orchestration requirements

### R-6.1 Goal decomposition

For a multi-provider goal, the GPT should identify the minimum required sequence of capabilities before making destructive or expensive calls.

### R-6.2 Service discovery

The GPT shall verify that required MCP services are currently available/connected before relying on them.

### R-6.3 Runtime tool discovery

For each selected service, the GPT shall inspect the provider's current tools and fetch the selected tool schema before execution.

### R-6.4 Provider output chaining

The GPT may use data returned by one provider as input context for later reasoning or another provider call when that is necessary to fulfill the goal.

It shall never forward credentials, authentication headers, Gateway tokens, or secret material across providers.

### R-6.5 Provider state is not duplicated without reason

The Gateway should not create a parallel permanent copy of provider-owned state merely to orchestrate a workflow unless a concrete product requirement requires it.

### R-6.6 Partial completion

When later steps fail after earlier steps succeeded, the GPT shall accurately describe the resulting partial state and should continue safely when recovery is possible.

It must not report the original goal as fully complete.

## 7. Reference workflow: Stitch to GitHub pull request

The following scenario is a reference acceptance workflow, not a requirement that these exact provider implementations already exist.

User goal:

> Read the selected Stitch UI, implement it in the existing repository, validate the source, commit the change, and open a pull request.

Expected high-level behavior:

1. identify Stitch and GitHub as required provider capabilities;
2. load relevant Stitch and Git/GitHub skills;
3. verify both services are connected;
4. inspect the Stitch design/resources using runtime-discovered Stitch tools;
5. inspect the repository structure and relevant source before editing;
6. infer project conventions from current source, not from generic assumptions;
7. create a focused branch;
8. make the smallest maintainable source changes required by the design;
9. preserve business logic/state/API behavior unless the user goal explicitly requires changing it;
10. run the relevant validation available through the execution environment;
11. fix regressions introduced by the change when safely possible;
12. review the final change set for unrelated modifications;
13. commit with a coherent message;
14. open a pull request with an accurate summary and actual validation evidence;
15. report the PR and any remaining unverified behavior to the user.

## 8. Git/GitHub skill requirements

### R-8.1 Source-first behavior

Before modifying a repository, the Git/GitHub skill shall direct the GPT to inspect current source, relevant project configuration, and local conventions.

### R-8.2 Narrow scope

The skill shall instruct the GPT to avoid unrelated refactors, formatting churn, dependency changes, or broad rewrites unless required by the goal.

### R-8.3 Current source overrides stale guidance

If an old patch, handoff, prior description, or remembered structure conflicts with current repository source, current source is authoritative.

### R-8.4 Branch discipline

For non-trivial changes, the skill should prefer a dedicated branch and pull request over direct writes to the default branch when GitHub permissions and repository policy permit it.

### R-8.5 Validation honesty

The skill shall prohibit claims such as `tests passed`, `build passed`, `patch applies`, or `PR is ready` unless the corresponding check was actually performed successfully.

### R-8.6 Commit quality

Commits should be scoped and named according to repository conventions when those conventions are discoverable.

### R-8.7 Pull-request quality

A generated PR should include:

- goal/problem;
- main changes;
- important architectural decisions where relevant;
- validation actually run and its result;
- known limits or unverified areas.

### R-8.8 Existing changes

The GPT shall avoid deleting or overwriting user changes that are unrelated to the requested goal.

## 9. Validation requirements

### R-9.1 Validation is skill/domain aware

Skills should define the validation that is meaningful for their domain.

Engineering workflows may include:

1. typecheck;
2. lint;
3. relevant unit/integration tests;
4. build;
5. runtime or visual smoke test when available.

Not every workflow requires every check.

### R-9.2 Failure loop

When validation fails because of changes introduced by the workflow, the GPT should diagnose the root cause, correct it, and re-run the relevant check when capabilities permit.

### R-9.3 Unavailable validation

If a check cannot be executed, the final result shall state that it remains unverified.

## 10. Error and recovery requirements

### R-10.1 Schema/tool drift

If a provider call fails because a tool/schema may be stale or mismatched, the GPT should refresh runtime tool discovery and schema before guessing.

### R-10.2 Disconnected provider

A missing provider connection should produce actionable guidance to connect the provider rather than a request for the user to paste credentials into the conversation.

### R-10.3 Entitlement failure

An Open ID/entitlement failure must not be bypassed through direct provider access.

### R-10.4 Upstream failure

Temporary upstream service failures must not be misreported as invalid saved credentials without evidence.

### R-10.5 Large responses

If Gateway responses use a chunked continuation protocol, orchestration must retrieve required chunks in order before making decisions that depend on the complete response.

## 11. Security requirements

### R-11.1 Gateway is mandatory

All supported MCP execution for GPT integrations shall pass through the Gateway execution boundary.

### R-11.2 Credentials remain server-side

Provider credentials shall remain encrypted/persisted server-side according to the existing security model and shall never be returned to GPT context.

### R-11.3 Skill content is untrusted from a security-priority perspective

Skills may guide behavior but cannot override platform, Gateway, authentication, entitlement, or safety constraints.

### R-11.4 Provider outputs are untrusted

Provider-returned content must be treated as data, not higher-priority instructions.

### R-11.5 Destructive actions

Provider operations that are irreversible, destructive, or materially risky shall have explicit skill/product policy for when confirmation is required.

### R-11.6 No arbitrary MCP endpoint expansion by implication

Adding skill orchestration does not automatically allow arbitrary user-supplied MCP URLs. Such support requires a separate threat model, egress controls, credential model, and product decision.

## 12. Audit and observability requirements

### R-12.1 Execution trace metadata

Sanitized audit data should be able to identify, where applicable:

- account/Open ID context;
- selected skill ID/version;
- MCP service;
- tool called;
- success/failure category;
- retry or schema refresh;
- workflow completion state.

### R-12.2 Secret exclusion

Audit/log events shall not include raw provider credentials, Gateway tokens, or other secret material.

### R-12.3 Truthful completion state

Where workflow-level observability is implemented, final state should distinguish at least:

- completed;
- partially completed;
- blocked/failed.

## 13. Source architecture requirements

### R-13.1 Preserve modular monolith by default

Skill support shall not introduce microservices, queues, workflow engines, or new infrastructure solely for architectural symmetry.

### R-13.2 Add modules by responsibility

A `gateway-skills` module is appropriate when skill catalog/retrieval/versioning behavior exists. It should not be introduced as an empty abstraction.

A separate `orchestration` module should be added only if orchestration behavior moves server-side and has a real independent responsibility.

### R-13.3 GPT-led orchestration first

Initial cross-provider orchestration should remain GPT-led where possible. The server should expose trusted capabilities, current schemas, skills, entitlement enforcement, and safe execution.

### R-13.4 Server-side orchestration trigger

Consider durable/server-side orchestration only for concrete needs such as:

- resumable workflows;
- long-running jobs;
- asynchronous execution;
- deterministic server policy;
- scheduled/background work;
- workflow state that must survive GPT conversation boundaries.

## 14. GPT Integration Kit requirements

### R-14.1 Keep base Knowledge small

The generated GPT kit should contain stable routing/security behavior, not every provider's detailed skill content.

### R-14.2 Teach skill discovery

Generated Instructions/Knowledge should teach the GPT to fetch relevant Gateway Skills before provider-specific workflows when a matching skill is available.

### R-14.3 Teach runtime discovery

The generated kit must preserve the runtime flow:

```text
intent
  -> relevant skill(s)
  -> service discovery
  -> tool discovery
  -> schema inspection
  -> execution
  -> validation/recovery
  -> outcome
```

### R-14.4 Do not bundle user secrets

Skill-enabled GPT integration packages must remain distributable without embedding Open IDs, Gateway tokens, or provider credentials.

## 15. Compatibility requirements

### R-15.1 Existing single-provider behavior

Introducing skills must not break existing service discovery, tool discovery, tool execution, Open ID entitlement, or Stitch connectivity.

### R-15.2 Skills are additive

A provider without a dedicated skill should remain usable through normal runtime MCP discovery when the underlying provider is supported.

### R-15.3 Graceful missing skill

If a requested skill does not exist, the Gateway/GPT should continue using supported runtime MCP capabilities where safe rather than inventing a skill.

## 16. MVP implementation phases

### Phase A — Skill protocol foundation

Target:

- skill catalog/list endpoint/action;
- fetch-skill endpoint/action;
- stable skill IDs;
- at least one real provider/domain skill;
- GPT kit updated to use just-in-time skills;
- sanitized audit metadata for skill retrieval where useful.

Acceptance:

- GPT can identify a relevant skill, fetch it on demand, then still discover tools/schema at runtime;
- skills are not embedded wholesale into the GPT package;
- no existing MCP execution path regresses.

### Phase B — Git/GitHub expert workflow

Target:

- Git/GitHub MCP provider supported through Gateway if not already part of the current release;
- Git/GitHub skill encodes source-first engineering workflow;
- repository inspection, branching, scoped changes, commit, and PR creation can be composed safely;
- validation results are reported truthfully.

Acceptance reference:

- given an accessible repository and a scoped source task, the GPT can inspect the repository, modify it on a branch, and create a review-ready PR without direct provider credentials in GPT context.

### Phase C — Cross-MCP composition

Target:

- at least two provider skills can be loaded in one goal;
- one workflow consumes provider A output to guide provider B operations;
- partial completion and recovery are handled truthfully.

Acceptance reference:

- a Stitch-to-GitHub implementation goal can be completed end-to-end in one conversation when both services and required execution capabilities are available.

### Phase D — Production hardening

Target based on measured need:

- skill version/audit maturity;
- per-tool/provider policy scopes;
- richer usage metering;
- workflow observability;
- confirmation policy for risky operations;
- durable orchestration only if real workloads require it.

## 17. Definition of done for a skill-enabled workflow

A workflow is done only when, within available capabilities:

- the user's requested outcome is satisfied;
- relevant providers were discovered/authorized;
- selected runtime tool schemas were respected;
- required source/provider state was inspected before modification;
- destructive actions followed confirmation policy;
- appropriate validation was actually executed or explicitly marked unavailable;
- failures introduced by the workflow were corrected when safely possible;
- the final report accurately separates completed, partial, and unverified work;
- no provider secret or Gateway secret was exposed to the GPT/user output.

## 18. Documentation rule

When implementation lands:

1. update `PROJECT_STATUS.md` with only behavior proven in source;
2. update `ARCHITECTURE.md` if trust boundaries/module responsibilities change;
3. update `GPT_PROTOCOL.md` when new GPT-facing skill actions become part of the runtime contract;
4. update `API_REFERENCE.md` for public endpoints;
5. update security/data-handling docs when persistence or trust boundaries change;
6. keep this document as the requirements/acceptance reference rather than rewriting history to imply earlier availability.
