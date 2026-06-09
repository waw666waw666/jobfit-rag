# Runtime Config Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Make local non-Docker runs easier by documenting and scripting frontend/backend URL alignment without changing product scope.

**Architecture:** Keep backend and frontend launch behavior local-first. Add a tiny Windows PowerShell helper that starts the frontend with `VITE_API_BASE_URL` pointing to a chosen backend URL, and document how to use it when backend runs on a non-default port.

**Tech Stack:** PowerShell, Vite, React, FastAPI.

---

### Task 1: Add Frontend Local Runner

**Files:**
- Create: `scripts/run-frontend-local.ps1`
- Modify: `docs/development.md`

**Step 1: Create the runner script**

Create `scripts/run-frontend-local.ps1`:

```powershell
param(
  [string]$BackendUrl = "http://localhost:8000",
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $repo "frontend"

Set-Location $frontend
$env:VITE_API_BASE_URL = $BackendUrl
npm run dev -- --host 0.0.0.0 --port $Port
```

**Step 2: Run syntax check**

Run:

```powershell
powershell -NoProfile -Command "& { [scriptblock]::Create((Get-Content -Raw 'D:\VsCodeProjects\jobfit-rag\scripts\run-frontend-local.ps1')) | Out-Null; 'syntax ok' }"
```

Expected: `syntax ok`

**Step 3: Verify frontend can start against alternate backend**

If backend is already running at `http://127.0.0.1:8001`, run:

```powershell
powershell -ExecutionPolicy Bypass -File D:\VsCodeProjects\jobfit-rag\scripts\run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 3000
```

Expected: Vite prints `Local: http://localhost:3000/`.

If a server is already running, stop the old dev server first or use another port.

**Step 4: Update development docs**

In `docs/development.md`, add a short note near the frontend local run section:

```markdown
If the backend is running on a non-default port, start the frontend with:

```powershell
.\scripts\run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 3000
```

This sets `VITE_API_BASE_URL` for the Vite process only.
```

**Step 5: Verify**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File D:\VsCodeProjects\jobfit-rag\scripts\verify-local.ps1
```

Expected: `PASS verify-local`

**Step 6: Review**

Use `code-reviewer`.

Expected: no CRITICAL/HIGH findings.

**Do not commit unless the user explicitly asks.**
