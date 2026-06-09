# Browser Smoke Verification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Add a lightweight manual/browser smoke checklist for local demo confidence after code changes.

**Architecture:** Keep automated build checks separate from browser smoke. Add a concise checklist document and optionally use Playwright/Chrome MCP manually to verify the local frontend can render and call the backend. This plan assumes `2026-06-08-runtime-config.md` has already added `scripts/run-frontend-local.ps1`; if not, use the fallback frontend command in this document.

**Tech Stack:** React, Vite, FastAPI, browser manual verification, PowerShell launch scripts.

---

### Task 1: Add Browser Smoke Checklist

**Files:**
- Create: `docs/browser-smoke.md`
- Modify: `docs/development.md`

**Step 1: Create checklist doc**

Create `docs/browser-smoke.md`:

```markdown
# Browser Smoke Checklist

Use this after local build checks pass and before demoing the app.

## Start services

Backend example:

```powershell
cd backend
$env:PYTHONPATH=(Get-Location).Path
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Frontend example from repo root:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 3000
```

Fallback if `run-frontend-local.ps1` does not exist yet:

```powershell
cd D:\VsCodeProjects\jobfit-rag\frontend
$env:VITE_API_BASE_URL="http://127.0.0.1:8001"
npm run dev -- --host 0.0.0.0 --port 3000
```

## Checks

1. Open `http://localhost:3000`.
2. Confirm the hero and resume/JD inputs render.
3. Click the demo/sample load button.
4. Click Analyze.
5. Confirm a report appears with score, matched skills, missing skills, and action board.
6. Open Resume Matrix and run matrix comparison.
7. Confirm no resume/JD/API key content appears in terminal logs.
8. Confirm browser console has no app errors.

## Known local caveats

- Docker smoke requires Docker daemon.
- Local pytest requires configured Python test dependencies.
- If Vite cannot bind `127.0.0.1`, use `--host 0.0.0.0` via `run-frontend-local.ps1`.
```

**Step 2: Link from development guide**

In `docs/development.md`, add one sentence near verification gates:

```markdown
For manual demo confidence, use [Browser Smoke Checklist](browser-smoke.md) after `verify-local.ps1` passes.
```

**Step 3: Verify docs path and local gate**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File D:\VsCodeProjects\jobfit-rag\scripts\verify-local.ps1
```

Expected: `PASS verify-local`

**Step 4: Optional manual browser verification**

If local servers are already running:

- Backend: `http://127.0.0.1:8001`
- Frontend: `http://localhost:3000`

Use a browser automation tool or manual browser to confirm the checklist.

Do not start Docker.
Do not install dependencies.
Do not paste real resume/JD secrets.

**Step 5: Review**

Use `code-reviewer` for docs quality and scope.

Expected: no CRITICAL/HIGH findings.

**Do not commit unless the user explicitly asks.**
