# JobFit RAG Verification

## Default Local Gate

Run this before claiming local readiness:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\verify-local.ps1
```

This checks:

- frontend production build
- accessibility source checks
- backend Python syntax

It does not require Docker or pytest.

## Frontend Runtime Tests

Run this after changes to Report tabs or frontend component behavior:

```powershell
cd D:\VsCodeProjects\jobfit-rag
npm --prefix frontend run test
```

This checks Report tab ARIA links, selected/hidden panel state, and keyboard focus movement.

## Job Source Export

Run this after changes to Markdown exporters or job source fields:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\check-job-source-export.ps1
```

This checks:

- `toMarkdown`
- `toInterviewPackMarkdown`
- `toPortfolioCaseStudyMarkdown`
- populated Job Source metadata in each export
- empty Job Source metadata omitted from the export
- analyzer payload remains `analyzeFit(resumeText, jdText)`

Then run the normal frontend and local gates:

```powershell
npm --prefix frontend run build
.\scripts\verify-local.ps1
```

## Markdown Downloads

Run this after changes to Markdown download buttons or filename logic:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\check-markdown-downloads.ps1
```

This checks:

- `frontend/src/markdownDownloads.ts` owns browser download primitives
- `main.tsx` no longer repeats `Blob` and object URL logic
- report, interview pack, and portfolio case study filename formats stay stable

## Report Normalization

Run this after changes to report history loading, report compatibility defaults, or report tabs that depend on optional fields:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\check-report-normalization.ps1
```

This checks:

- `frontend/src/reportNormalization.ts` owns report compatibility defaults
- `main.tsx` imports `normalizeReport` instead of defining it locally
- legacy reports receive empty arrays/objects for newer report sections
- existing evidence quality and readiness fields are preserved

## Report History Selection

Run this after changes to report history, compare selection, or delete-current-report behavior:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\check-report-history.ps1
```

This checks:

- `frontend/src/reportHistory.ts` owns compare selection rules
- `main.tsx` no longer repeats compare `some/filter/slice` state logic
- compare selection keeps at most the latest two reports
- deleting the currently open report clears the current report

## Application Tracker

Run this after changes to application tracker add-target or mark-applied behavior:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\check-application-tracker.ps1
```

This checks:

- `frontend/src/applicationTracker.ts` owns application payload rules
- `main.tsx` no longer trims tracker fields inline
- create payload trims company, role, and next action
- mark-applied payload preserves existing next action or uses the default follow-up

## Sample Browser Smoke

Run this before demos or UI-heavy changes:

```powershell
cd D:\VsCodeProjects\jobfit-rag
npm --prefix frontend run smoke
```

This starts a local backend and frontend with sample-only data and verifies the Analyze flow renders report tabs.

## Backend Tests

Use this after backend changes or before delivery:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\test-backend-local.ps1
```

The script prefers `.venv\Scripts\python.exe`, sets `PYTHONPATH=backend`, and uses `data\test-jobfit.sqlite3`.

If `.venv` is missing, recreate it:

```powershell
uv venv .venv --python 3.13
uv pip install --python .\.venv\Scripts\python.exe -r backend\requirements.txt
```

## Full Docker Smoke

Use this when Docker daemon is available:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\smoke.ps1
```

This is the full demo/share gate and should cover Docker build/runtime, API smoke checks, fixture checks, contract checks, markdown quality, negative paths, data integrity, and secret scanning as implemented by the smoke script.

## Manual Browser Smoke

Use this before demos or UI-heavy changes:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\run-frontend-local.ps1
```

Then follow `docs/browser-smoke.md`.

## Privacy Rules During Verification

- Do not share raw failed HTTP response bodies.
- Do not share raw secret scan matches.
- Do not paste real resume text, JD text, API keys, or Authorization headers into logs, docs, screenshots, or tests.
- If a redacted script fails, run the underlying command locally for diagnostics and redact private values before sharing output.
