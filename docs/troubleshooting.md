# Troubleshooting Guide

Use this guide when local development or demo checks fail.

## `verify-local.ps1` fails

Run from the project root:

```powershell
.\scripts\verify-local.ps1
```

The script prints `RUN`, `PASS`, or `FAIL` for each gate. Child-command output is hidden by default, and failed child-command output is always redacted. Use `.\scripts\verify-local.ps1 -ShowCommandOutput` only to see successful child-command output. If you need full diagnostics for a failed gate, run the failing underlying command directly on your machine. Do not paste full diagnostics into chat, issues, or logs until resume text, JD text, API keys, and Authorization headers are removed.

Common causes after rerunning the failing command locally:

- Frontend build fails: inspect TypeScript or Vite output.
- Accessibility check fails: inspect the missing string reported by `scripts/check-accessibility.ps1`.
- Backend syntax fails: fix the Python file reported by `py_compile`.

Do not install dependencies unless you intentionally choose to configure the local environment.

## Frontend starts on the wrong port

Use the local runner:

```powershell
.\scripts\run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 3000
```

The runner uses `--strictPort`, so port conflicts fail clearly instead of silently moving to another port.

If port `3000` is busy, stop the old frontend server. If Windows reserves port `3000`, use an unreserved local fallback port and restart the backend with a matching local-only CORS origin:

```powershell
$env:JOBFIT_EXTRA_CORS_ORIGINS="http://127.0.0.1:4173"
cd D:\VsCodeProjects\jobfit-rag\backend
$env:PYTHONPATH=(Get-Location).Path
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Then start the frontend on the same fallback port:

```powershell
.\scripts\run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 4173
```

## Frontend API calls fail

Check that the frontend API base URL matches the backend:

```powershell
.\scripts\run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 3000
```

Then check backend health:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/health
```

Expected:

```json
{"status":"ok","service":"jobfit-rag"}
```

## `pytest` is missing

`verify-local.ps1` does not require pytest.

Optional backend tests use:

```powershell
.\scripts\test-backend-local.ps1
```

If pytest is missing, the script fails clearly. Do not install pytest unless you choose to work on backend tests.

## Docker smoke fails

`scripts/smoke.ps1` requires Docker daemon. If Docker Desktop is not running, smoke should fail truthfully.

Do not retry Docker build/run/up while Docker daemon is unavailable. Use `verify-local.ps1` instead.

## AI API fails

The app should still return deterministic fallback output without `OPENAI_API_KEY` or when the API fails.

Allowed log message style:

```text
Embedding API request failed; using local fallback.
Chat refinement API request failed; using deterministic fallback.
```

Do not log:

- resume text
- JD text
- API keys
- Authorization headers

## Resume upload fails

Expected constraints:

- Supported file types: PDF, TXT, Markdown.
- Maximum resume upload size: 2 MB.
- Very short extracted text is rejected.

Use demo files for troubleshooting. Do not attach real resumes while debugging logs.
