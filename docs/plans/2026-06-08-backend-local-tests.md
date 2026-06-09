# Backend Local Test Environment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Make backend local test setup explicit without forcing dependency installation.

**Architecture:** Do not install packages automatically. Add a small documentation section and an optional test runner script that checks for pytest first, fails clearly when missing, and runs focused backend tests when available.

**Tech Stack:** FastAPI, pytest, Python, PowerShell.

---

### Task 1: Add Optional Backend Test Runner

**Files:**
- Create: `scripts/test-backend-local.ps1`
- Modify: `docs/development.md`

**Step 1: Create the script**

Create `scripts/test-backend-local.ps1`:

```powershell
param(
  [string]$Pattern = "backend/tests"
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$target = Join-Path $repo $Pattern

Set-Location $repo
python -m pytest --version | Out-Host
if ($LASTEXITCODE -ne 0) {
  throw "pytest is not installed in the active Python environment. Install backend dev dependencies only if you choose to work on backend tests."
}

if (-not (Test-Path $target)) {
  throw "Backend test target does not exist: $Pattern"
}

python -m pytest $Pattern -q | Out-Host
if ($LASTEXITCODE -ne 0) {
  throw "Backend tests failed with exit code $LASTEXITCODE"
}
```

**Step 2: Verify missing pytest behavior**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File D:\VsCodeProjects\jobfit-rag\scripts\test-backend-local.ps1
```

Expected:
- If pytest is missing: FAIL with a clear pytest missing message.
- If pytest is installed but `backend/tests` is absent: FAIL with `Backend test target does not exist`.
- If pytest and the target tests are available: run tests and report real pass/fail.

Do not install pytest unless the user explicitly asks.

**Step 3: Add docs**

In `docs/development.md`, add:

```markdown
### Optional local backend tests

`verify-local.ps1` does not run pytest. If you choose to configure Python test dependencies, run:

```powershell
.\scripts\test-backend-local.ps1
```

If pytest is missing, the script fails clearly instead of installing anything.
```

**Step 4: Verify local green gate still passes**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File D:\VsCodeProjects\jobfit-rag\scripts\verify-local.ps1
```

Expected: `PASS verify-local`

**Step 5: Review**

Use `code-reviewer`.

Expected: no CRITICAL/HIGH findings.

**Do not commit unless the user explicitly asks.**
