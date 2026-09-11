# Requirements snapshot

## Core
- Gateway exists so Custom GPTs can use MCP capabilities through GPT Actions.
- Open ID is the commercial entitlement; Action Schema/Instructions/Knowledge are integration assets.
- Every MCP execution must resolve to an active Open ID entitlement.
- First supported MCP provider: Google Stitch.
- Users may only connect explicitly supported providers; no arbitrary MCP URLs in MVP.

## Guest
- New authenticated account is `guest`.
- Guest may configure supported MCP credentials and download the GPT integration kit.
- Guest can claim exactly one 7-day trial in account lifetime.
- Trial begins only when the user explicitly creates the trial token.
- Revoking/losing/expiring the token never restores trial eligibility.
- Trial uses an internal, non-exportable Open ID entitlement.

## Member
- `member` or higher gets one exportable paid Open ID for the account and may generate Gateway tokens for it.
- MVP has no business quota on member token count; technical rate limiting still applies.

## GPT kit
ZIP contains:
- `instructions.md`
- `knowledge.md`
- `openapi.yaml`
- `setup-guide.md`

The kit teaches:
`Intent -> Capability -> MCP service -> list tools -> choose tool -> call tool -> interpret result`.

## UI
- Vietnamese and English.
- Public SEO landing page.
- Authenticated pages for MCP connections, Open ID/trial, and GPT integration.
