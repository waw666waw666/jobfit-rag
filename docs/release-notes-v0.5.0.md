# JobFit RAG v0.5.0 Release Notes

## Status

Local release candidate for portfolio/demo sharing.

Verified on 2026-06-09 with Docker Desktop daemon available:

```powershell
npm --prefix frontend run build
npm --prefix frontend run test
.\scripts\check-accessibility.ps1
.\scripts\verify-local.ps1
.\scripts\test-backend-local.ps1
npm --prefix frontend run smoke
.\scripts\smoke.ps1
```

Result:

- frontend production build passed
- frontend Vitest passed: 1 file, 2 tests
- accessibility gate passed
- Docker-free local gate passed
- backend pytest passed: 40 tests
- Playwright sample smoke passed: 1 test
- full Docker smoke passed, including image builds, runtime health, analyze API, resume matrix, evaluation fixtures, Markdown quality, API contract, data integrity, negative paths, and redacted secret scan

## Notable Fix

- Fixed Windows PowerShell UTF-8 handling for evaluation fixtures so Chinese resume/JD fixture checks pass in Docker smoke.
- Fixed smoke output replay so Docker progress from native stderr is printed as plain text instead of PowerShell error records.

## Shareable Scope

- Local-first, single-user AI job-fit workflow.
- React/Vite frontend, FastAPI backend, SQLite local persistence, Docker Compose runtime.
- Deterministic fallback works without API keys.
- Optional OpenAI-compatible API refinement remains non-required.

## Boundaries

This release does not claim:

- hiring prediction accuracy
- ATS guarantee
- enterprise security
- multi-user SaaS behavior
- cloud sync
- auth
- local LLM or vector database RAG platform

## Git Notes

- Branch: `codex/jobfit-rag-finish`
- Last known base commit before this release-readiness update: `d5dcb90 chore: complete local delivery gates`
- No git remote is configured locally.
- Release tag: `v0.5.0`.
