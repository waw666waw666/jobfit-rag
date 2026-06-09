# ADR 0001: Keep JobFit RAG Local-First And Single-User

## Status

Accepted

## Context

JobFit RAG handles resume text, JD text, application notes, and report exports. These are private career documents. The project is also a portfolio/demo app intended to run reliably on a local laptop.

## Decision

Keep the product local-first and single-user.

The default runtime stores data in a local SQLite file and works without API keys. Optional OpenAI-compatible calls may improve analysis, but they are not required for normal use, demo reset, smoke verification, or exports.

## Consequences

- No auth, user accounts, cloud sync, team sharing, or hosted database in v1.
- Simpler demo setup and clearer privacy story.
- SQLite is sufficient because there is no concurrent multi-user workload.
- Future hosted or team use would require a new decision.

## Verification

- `.env` and `data/` remain git-ignored.
- `scripts/verify-local.ps1` works without remote services.
- API failure paths return local fallback output and do not log private payloads.
