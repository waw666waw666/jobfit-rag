# Local Demo Runbook

Use this when preparing a local JobFit RAG demo without Docker.

## Preconditions

- Frontend dependencies are already installed.
- Backend runtime dependencies are already installed.
- Do not use real resume/JD content for demo prep.
- Do not paste API keys into terminal output or screenshots.

## 1. Run the local gate

From the project root:

```powershell
.\scripts\verify-local.ps1
```

Expected result:

```text
PASS verify-local
```

If this fails, fix the local gate first before demoing.

## 2. Start the backend

Open a terminal:

```powershell
cd D:\VsCodeProjects\jobfit-rag\backend
$env:PYTHONPATH=(Get-Location).Path
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/health
```

Expected response includes:

```json
{"status":"ok","service":"jobfit-rag"}
```

## 3. Start the frontend

Open another terminal from the project root:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 3000
```

Open:

```text
http://127.0.0.1:3000
```

If port `3000` is unavailable because Windows reserved it, stop the backend first, then restart it with a local-only fallback origin:

```powershell
$env:JOBFIT_EXTRA_CORS_ORIGINS="http://127.0.0.1:4173"
cd D:\VsCodeProjects\jobfit-rag\backend
$env:PYTHONPATH=(Get-Location).Path
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Then run the frontend on the same fallback port:

```powershell
.\scripts\run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 4173
```

Open `http://127.0.0.1:4173`.

## 4. Demo flow

1. Load a sample.
2. Click Analyze.
3. Show overall score, matched skills, missing skills, and action board.
4. Open Resume Matrix.
5. Run the comparison.
6. Export Markdown or JSON only with demo data.
7. Mention local fallback still works without `OPENAI_API_KEY`.

## 5. Stop services

- Stop frontend terminal with `Ctrl+C`.
- Stop backend terminal with `Ctrl+C`.

## Safety checklist

- No real resume text in screenshots.
- No real JD text in screenshots.
- No API key in terminal history or logs.
- No Authorization header in logs.
- No Docker required for this local runbook.
