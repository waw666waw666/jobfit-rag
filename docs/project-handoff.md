# Project Handoff

This is the current working-state handoff for JobFit RAG.

## Current status

JobFit RAG is a local-first AI job-fit demo app with a React/Vite frontend and FastAPI backend. It is hardened enough for local demo work when `verify-local.ps1` passes.

Default product boundary remains:

- local
- single-user
- deterministic fallback works without API access
- no auth
- no cloud sync
- no Redis/Postgres/vector DB/local LLM

## Completed hardening

Backend:

- Resume upload has a 2 MB guard.
- AI API failure logs use fixed warning strings.
- Logs avoid resume text, JD text, API keys, and Authorization headers.
- Python syntax is covered by `verify-local.ps1`.
- Local backend tests run through project `.venv` with `scripts/test-backend-local.ps1`.

Frontend:

- Shared types moved to `frontend/src/types.ts`.
- API helpers moved to `frontend/src/api.ts`.
- Markdown exporters moved to `frontend/src/exportMarkdown.ts`.
- Markdown download primitives moved to `frontend/src/markdownDownloads.ts`; `main.tsx` keeps only thin click handlers.
- Report compatibility defaults moved to `frontend/src/reportNormalization.ts`; `main.tsx` calls `normalizeReport` after analyze/history fetches.
- Report history compare/delete state rules moved to `frontend/src/reportHistory.ts`; `main.tsx` keeps API calls and thin state updates.
- Application tracker payload and mark-applied rules moved to `frontend/src/applicationTracker.ts`; `main.tsx` no longer trims tracker fields inline.
- Job Source metadata is exported in Report, Interview Pack, and Portfolio Case Study Markdown when local source fields are populated.
- Job Source metadata remains frontend-local and is not sent to the analyzer payload.
- Pure UI helpers, tracker, resume matrix, fast action panels, and shared panel/list helpers moved to `frontend/src/components.tsx`.
- Report tabs and report tab panels moved to `frontend/src/reportView.tsx`; `main.tsx` renders the exported `ReportView`.
- Runtime DOM coverage for Report tabs is in `frontend/src/reportView.test.tsx`.
- Report deletion has confirmation and accessible labels.
- Import JSON has success feedback and file input reset.
- Sample matrix data uses matching sample-specific matrix resumes.
- Report tabs have ARIA wiring and keyboard navigation.

Scripts and docs:

- `scripts/verify-local.ps1` is the Docker-free local green gate. Child-command output is hidden by default, and failed child-command output is redacted while preserving exit codes.
- `scripts/smoke.ps1` no longer prints fake PASS for failed native commands, redacts failed child-script output, and redacts secret scan matches.
- API-facing verification scripts redact HTTP response bodies and private assertion values in failure output where those values may be derived from resume/JD content.
- `scripts/run-frontend-local.ps1` starts Vite with a selected backend URL.
- `scripts/test-backend-local.ps1` fails clearly if pytest is unavailable.
- Frontend runtime DOM tests run with Vitest and Testing Library.
- Sample-only browser smoke runs with Playwright through `npm --prefix frontend run smoke`.
- `scripts/check-job-source-export.ps1` validates Job Source Markdown output without relying on browser downloads.
- `scripts/check-accessibility.ps1` checks accessibility source strings across `frontend/src/main.tsx`, `frontend/src/components.tsx`, and `frontend/src/reportView.tsx`.
- `scripts/check-markdown-downloads.ps1` validates Markdown filename stability and keeps browser download primitives out of `main.tsx`.
- `scripts/check-report-normalization.ps1` validates legacy report defaults and keeps report compatibility rules out of `main.tsx`.
- `scripts/check-report-history.ps1` validates compare selection and delete-current-report state rules.
- `scripts/check-application-tracker.ps1` validates application add-target payloads and mark-applied payload fallback.
- Development, browser smoke, demo readiness, troubleshooting, maintenance, and demo runbook docs are linked from `docs/development.md`.

## Current verification commands

Local gate:

```powershell
.\scripts\verify-local.ps1
```

Frontend only:

```powershell
npm --prefix D:\VsCodeProjects\jobfit-rag\frontend run build
npm --prefix D:\VsCodeProjects\jobfit-rag\frontend run test
npm --prefix D:\VsCodeProjects\jobfit-rag\frontend run smoke
.\scripts\check-accessibility.ps1
```

Job Source export:

```powershell
.\scripts\check-job-source-export.ps1
```

Markdown downloads:

```powershell
.\scripts\check-markdown-downloads.ps1
```

Report normalization:

```powershell
.\scripts\check-report-normalization.ps1
```

Report history:

```powershell
.\scripts\check-report-history.ps1
```

Application tracker:

```powershell
.\scripts\check-application-tracker.ps1
```

Backend tests:

```powershell
.\scripts\test-backend-local.ps1
```

Full Docker smoke when Docker daemon is available:

```powershell
.\scripts\smoke.ps1
```

## Known blockers

- Docker daemon is currently unavailable, so Docker build/run/up/smoke is blocked.
- `jobfit-rag` is an independent local git repository on branch `codex/jobfit-rag-finish`; the root repository excludes it locally through `.git/info/exclude`.

## Safe next work

Prefer small, independent tasks:

1. Run `.\scripts\check-job-source-export.ps1` after touching Job Source fields or Markdown exporters.
2. Run `npm --prefix frontend run test` after touching Report tabs.
3. Run `npm --prefix frontend run smoke` before demos or UI-heavy changes.
4. Plan public URL preview separately before implementing any URL fetch behavior.
5. Continue slimming `main.tsx` only by extracting pure display components or small workflow modules with clear checks.
6. Keep local demo readiness docs current as run commands change.

## Do not do by default

- Do not commit without explicit user request.
- Do not install dependencies without explicit user request.
- Do not start Docker while Docker daemon is unavailable.
- Do not add new infrastructure or product scope.
- Do not paste real resume/JD/API key material into logs, docs, screenshots, or tests.
