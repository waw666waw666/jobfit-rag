# Browser Smoke Checklist

Use this after local build checks pass and before demoing the app.

## Start services

Backend example:

```powershell
cd D:\VsCodeProjects\jobfit-rag\backend
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
npm run dev -- --host 0.0.0.0 --port 3000 --strictPort
```

## Checks

1. Open `http://localhost:3000`.
2. Confirm the hero and resume/JD inputs render.
3. Click a demo/sample load button.
4. Click Analyze.
5. Confirm a report appears with score, matched skills, missing skills, and action board.
6. Export Report, Interview Pack, and Portfolio Case Study Markdown.
7. Confirm each Markdown export includes the Job Source section when source fields are populated:
   - `## Job Source`
   - `- Company: Example AI Lab`
   - `- Role: AI Application Developer`
   - `- Source URL: https://example.com/jobs/ai-application-developer`
   - `- Captured date: 2026-06-08`
8. Clear the four Job Source fields, export Report Markdown again, and confirm `## Job Source` is omitted.
9. Open Resume Matrix and run matrix comparison.
10. Confirm no resume/JD/API key content appears in terminal logs.
11. Confirm browser console has no app errors.

## Job Source export fallback

Codex in-app Browser cannot download files. If browser download verification is unavailable, run the source-level export check instead:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\check-job-source-export.ps1
```

This validates the three Markdown exporter functions directly and confirms empty source metadata does not render an empty section.

## Known local caveats

- Docker smoke requires Docker daemon.
- Local pytest requires configured Python test dependencies.
- Codex in-app Browser can verify Analyze and page state, but downloads are unsupported.
- `run-frontend-local.ps1` defaults to `127.0.0.1`; use `-ListenHost 0.0.0.0` only when LAN access is intentional and backend CORS matches.
- Keep frontend on port `3000` unless backend CORS is updated.
