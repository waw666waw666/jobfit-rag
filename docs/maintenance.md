# Maintenance Guide

Use this when making small changes after the main prototype hardening work.

## Project boundaries

Keep the default product local and single-user.

Do not add unless explicitly requested:

- auth
- cloud sync
- Redis
- Postgres
- vector DB
- worker queues
- local LLMs

Do not change deterministic fallback behavior unless the analyzer design changes deliberately.

## Safe change order

1. Change the smallest possible file set.
2. Run the focused check for that change.
3. Run `verify-local.ps1`.
4. Use code review for changed code.
5. Fix CRITICAL/HIGH findings before calling the work complete.

## Frontend changes

Run:

```powershell
npm --prefix D:\VsCodeProjects\jobfit-rag\frontend run build
.\scripts\check-accessibility.ps1
```

If touching forms, buttons, labels, file upload, or live regions, check keyboard and screen reader semantics.

If touching Report tabs, keep `scripts/check-accessibility.ps1` green and follow `docs/plans/2026-06-08-runtime-dom-tabs-tests.md` when a runtime DOM test runner is available.

Avoid broad `main.tsx` rewrites. Prefer extracting small pure UI components only when it reduces complexity.

## Backend changes

Run the local syntax gate:

```powershell
.\scripts\verify-local.ps1
```

If pytest is configured intentionally:

```powershell
.\scripts\test-backend-local.ps1
```

For upload, API, URL fetching, or logging changes, verify sensitive data is not logged. Do not add scraping for login-only or prohibited sites.

## Documentation changes

Docs should stay short and operational.

Good docs answer:

- what to run
- when to run it
- expected pass/fail signal
- what not to do

Avoid duplicating long setup steps across docs. Link to the runbook or troubleshooting guide instead.

## Review checklist

Before saying done:

- `verify-local.ps1` passes.
- No Docker-only command was required for local completion.
- No dependency install was required unless explicitly requested.
- No real resume/JD/API key appeared in logs or docs.
- Error and verification output remains privacy-safe: no raw HTTP response bodies, raw secret matches, or private expected/actual assertion values.
- Code review has no CRITICAL/HIGH findings.

## Suggested next improvements

Keep these small and separate:

- Execute the job post intake plan before adding URL fetching or scraping.
- Execute the runtime DOM tabs test plan when frontend test dependencies are intentionally configured.
- Keep the demo readiness checklist current as local run commands change.
- Make backend CORS origins configurable for local demo ports.
- Add sample-only browser smoke automation.
- Split additional pure UI panels only if `main.tsx` remains hard to navigate.
