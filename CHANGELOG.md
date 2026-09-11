# Changelog

This project uses this file to record user-visible changes once public releases begin.

The format is inspired by Keep a Changelog, with semantic-version-style release headings.

## [Unreleased]

### Added

- Open-source documentation set:
  - architecture and API reference;
  - self-hosting guide;
  - security model and vulnerability policy;
  - contributor/community guidelines;
  - provider extension guide;
  - project status and troubleshooting;
  - licensing decision guide;
  - release checklist.

## [0.1.0] - 2026-09-11

### Added

- Initial MCP Gateway MVP source.
- Supabase-backed accounts with Guest/Member membership.
- One-time seven-day Guest trial.
- Internal trial Open ID and paid Member Open ID.
- Hashed/revocable Gateway credentials.
- Encrypted MCP provider credential storage.
- Google Stitch MCP adapter.
- Runtime MCP service/tool discovery and tool execution.
- English/Vietnamese GPT Integration Kit.
- English/Vietnamese web UI and SEO landing baseline.

### Known limitations

- Payment/admin automation not implemented.
- Only Stitch provider implemented.
- Full dependency-backed build and live Supabase/Stitch smoke validation not completed in the artifact environment; see `VALIDATION.md`.
