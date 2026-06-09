# Demo Readiness Checklist

Use this before a local demo when Docker is unavailable or you want the fastest confidence check.

## 1. Local gate

From the project root:

```powershell
.\scripts\verify-local.ps1
```

Expected:

- frontend build passes
- accessibility source check passes
- backend Python syntax check passes
- final line prints `PASS verify-local`

## 2. Start local services

Backend:

```powershell
cd D:\VsCodeProjects\jobfit-rag\backend
$env:PYTHONPATH=(Get-Location).Path
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Frontend from the project root:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 3000
```

Expected:

- backend health is available at `http://127.0.0.1:8001/health`
- frontend is available at `http://localhost:3000`
- frontend stays on port `3000`; port conflicts fail instead of silently moving

If Windows reserves port `3000`, use an unreserved local port such as `4173`. Stop the backend first, then start it again with a matching local-only CORS origin:

```powershell
$env:JOBFIT_EXTRA_CORS_ORIGINS="http://127.0.0.1:4173"
cd D:\VsCodeProjects\jobfit-rag\backend
$env:PYTHONPATH=(Get-Location).Path
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Then start the frontend with:

```powershell
.\scripts\run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 4173
```

## 3. Browser smoke

Follow [Browser Smoke Checklist](browser-smoke.md).

Minimum demo path:

1. Open `http://localhost:3000`.
2. Load a sample.
3. Click `Analyze Fit`.
4. Check `Overview`, `Readiness`, `Action Board`, `Proof Plan`, and `Interview`.
5. Run the resume matrix flow.
6. Export one safe demo artifact.

## 4. Safety check

Before sharing the screen or screenshots, confirm:

- no real resume text is visible
- no real JD text is visible
- no API key is visible
- no Authorization header is visible
- terminal logs contain only fixed fallback warning strings, not private input

## 5. If blocked

Use these substitutions:

- Docker unavailable: use `verify-local.ps1` and this local checklist.
- pytest missing: skip `test-backend-local.ps1` unless you intentionally configure backend test dependencies.
- frontend port busy: stop the old frontend process; if Windows reserves port `3000`, set `JOBFIT_EXTRA_CORS_ORIGINS` for an unreserved local fallback port.
- optional AI API fails: keep deterministic fallback behavior and demo with sample data.

For portfolio or public release sharing, also use [Release Checklist](release-checklist.md) when Docker is available.
