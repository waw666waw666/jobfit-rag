# JobFit RAG Development Guide

This guide is the working loop for improving JobFit RAG without breaking the local-first demo path.

## Project Shape

JobFit RAG is a Docker-first full-stack app:

- `frontend/`: React 19, TypeScript, Vite single-page UI.
- `backend/`: FastAPI, Pydantic v2, deterministic analyzer, optional OpenAI-compatible refinement.
- `data/`: local SQLite data mounted into Docker and ignored by git.
- `docs/`: architecture, API contract, demo material, fixtures, and implementation plans.
- `scripts/`: PowerShell verification gates used locally and by CI.

The default product boundary is local and single-user. Do not add auth, cloud sync, Redis, Postgres, vector DB, worker queues, or local LLMs unless the product scope changes.

## Related Guides

- [PRD](PRD.md): product scope, goals, non-goals, workflow, and acceptance criteria.
- [Constraints](CONSTRAINTS.md): local-first, privacy, AI, UX, architecture, and verification constraints.
- [Verification Guide](VERIFICATION.md): which gate to run for local, backend, Docker, and browser checks.
- [Architecture Decisions](ADR/): accepted decisions for local-first scope, no vector database in v1, and deterministic fallback.
- [Local Demo Runbook](local-demo-runbook.md): start backend/frontend and run the demo flow without Docker.
- [Browser Smoke Checklist](browser-smoke.md): manually verify the app before demoing.
- [Demo Readiness Checklist](demo-readiness-checklist.md): fast local pre-demo checklist when Docker is unavailable.
- [Troubleshooting Guide](troubleshooting.md): diagnose local build, API, pytest, Docker, and fallback issues.
- [Maintenance Guide](maintenance.md): keep future changes small, verified, and local-first.
- [Project Handoff](project-handoff.md): current status, blockers, verification commands, and next work.

## Quick Start

From the project root:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\reset-demo.ps1  # starts Docker Compose and seeds demo data
```

If Docker is unavailable, use the Docker-free local path instead:

```powershell
.\scripts\verify-local.ps1
.\scripts\reset-demo.ps1 -NoDocker -NoSeed  # database cleanup only
```

Then follow [Local Demo Runbook](local-demo-runbook.md).

Open:

```text
http://localhost:3000
```

The backend health endpoint is:

```text
http://localhost:8000/health
```

## Environment

Copy `.env.example` to `.env` only when local overrides are needed.

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_CHAT_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
BACKEND_PORT=8000
FRONTEND_PORT=3000
JOBFIT_EXTRA_CORS_ORIGINS=
JOBFIT_DB_PATH=/app/data/jobfit.sqlite3
```

`JOBFIT_DB_PATH=/app/data/jobfit.sqlite3` is the Docker path. For direct local Python runs, set a host path such as `..\data\jobfit.sqlite3` from `backend/`, or use an absolute path under `D:\VsCodeProjects\jobfit-rag\data`.

## Backend Loop

Use Docker for the normal test loop:

```powershell
docker compose run --rm backend pytest -q
```

For direct local development, use the existing environment if dependencies are already configured:

```powershell
.\scripts\test-backend-local.ps1
cd backend
$env:PYTHONPATH = (Get-Location).Path
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

If `.venv` is missing, recreate it from the project root:

```powershell
uv venv .venv --python 3.13
uv pip install --python .\.venv\Scripts\python.exe -r backend\requirements.txt
```

The analyzer must keep working without `OPENAI_API_KEY`. API failures should fall back to deterministic local output.

## Frontend Loop

Use Docker for the normal build loop:

```powershell
docker compose run --rm frontend npm run build
```

For direct local development, use the existing frontend dependencies if they are already installed:

```powershell
cd frontend
npm run dev
```

If `node_modules` is missing, dependency installation is an explicit setup step, not part of the routine local verification gate.

Run component/runtime tests after touching Report tabs:

```powershell
npm --prefix frontend run test
```

Run sample-only browser smoke before demos or UI-heavy changes:

```powershell
npm --prefix frontend run smoke
```

Set `VITE_API_BASE_URL` only when the backend is not on `http://localhost:8000`.

If the backend is running on a non-default port, run this from the project root:

```powershell
.\scripts\run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 3000
```

This sets `VITE_API_BASE_URL` for the Vite process, trims a trailing slash from the backend URL, and listens on `127.0.0.1` by default. The runner uses `--strictPort` so port conflicts fail clearly instead of silently moving to another port. Keep the frontend on port `3000` unless backend CORS is updated. Use `-ListenHost 0.0.0.0` only when you intentionally want LAN access and have matching backend CORS origins.

If Windows reserves port `3000`, choose an unreserved local port and start the backend with a matching local-only CORS origin:

```powershell
$env:JOBFIT_EXTRA_CORS_ORIGINS="http://127.0.0.1:4173"
cd backend
$env:PYTHONPATH=(Get-Location).Path
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Then start the frontend:

```powershell
.\scripts\run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 4173
```

`JOBFIT_EXTRA_CORS_ORIGINS` only accepts `localhost` or `127.0.0.1` origins.

## Verification Gates

Use the local gate when Docker is unavailable:

```powershell
.\scripts\verify-local.ps1
```

`verify-local.ps1` runs the frontend build, accessibility check, and backend Python syntax checks without requiring Docker daemon. Child-command output is hidden by default, and failed child-command output is always redacted while preserving the exit code. Use `-ShowCommandOutput` only to inspect successful child-command output locally. For failed gates, run the failing underlying command directly on your machine, and do not share full output until resume text, JD text, API keys, and Authorization headers are removed.

For demo confidence, run `npm --prefix frontend run smoke` after `verify-local.ps1` passes.

### Optional local backend tests

`verify-local.ps1` does not run pytest. Run backend tests separately:

```powershell
.\scripts\test-backend-local.ps1
```

The script uses the project `.venv` when it exists and keeps test data in `data\test-jobfit.sqlite3`.

Use Docker for backend tests and container builds when Docker daemon is running:

```powershell
docker compose run --rm backend pytest -q
docker compose run --rm frontend npm run build
.\scripts\check-accessibility.ps1
```

Contract and behavior checks against a running backend:

```powershell
.\scripts\evaluate-fixtures.ps1
.\scripts\check-markdown-quality.ps1
.\scripts\check-api-contract.ps1
.\scripts\check-data-integrity.ps1
.\scripts\check-negative-paths.ps1
.\scripts\check-resume-matrix.ps1
```

Full Docker smoke gate:

```powershell
.\scripts\reset-demo.ps1  # starts Docker Compose and seeds demo data
.\scripts\smoke.ps1
```

`smoke.ps1` requires Docker daemon because it builds images, runs backend pytest in Docker, starts Compose services, and checks the running app. If Docker daemon is not running, smoke fails truthfully instead of printing a fake PASS.

## Safe Refactor Order

1. Stabilize docs, env examples, lockfiles, and Docker install behavior.
2. Add backend safety guards and observable fallback logging.
3. Split frontend types, API client, and Markdown exporters from `frontend/src/main.tsx`.
4. Only then split visual components and workflow hooks.
5. Run `scripts/smoke.ps1` before calling a milestone complete.

## Troubleshooting

If Docker ports are busy, set different ports in `.env`:

```env
BACKEND_PORT=8010
FRONTEND_PORT=3010
```

If report history looks wrong, reset and seed local demo data through Docker Compose:

```powershell
.\scripts\reset-demo.ps1
```

For Docker-free database cleanup only:

```powershell
.\scripts\reset-demo.ps1 -NoDocker -NoSeed
```

If frontend calls fail, check that `VITE_API_BASE_URL` matches the backend URL exposed by Docker Compose.

If optional AI calls fail, the app should still return a complete report with local fallback mode. Do not log resume text, JD text, API keys, or Authorization headers while debugging.
