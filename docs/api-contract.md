# JobFit RAG API Contract

The backend exposes a small FastAPI contract for local analysis, report history, import/export, resume parsing, and application tracking.

Generated OpenAPI snapshot:

- `docs/openapi.json`

Contract check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-api-contract.ps1
```

The check pulls `/openapi.json` from the running backend and verifies required paths, methods, schemas, and fields without writing tracked files by default. Use `-UpdateSnapshot` to refresh `docs/openapi.json` intentionally.

Negative path check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-negative-paths.ps1
```

The check calls the running backend and verifies invalid requests fail with stable status codes and messages.

Data integrity check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-data-integrity.ps1
```

The check verifies report export/import roundtrip behavior and duplicate import safety.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Runtime health check. |
| `POST` | `/api/analyze` | Analyze resume and JD into a full `AnalysisReport`. |
| `POST` | `/api/resume-matrix` | Compare resume versions against the same JD. |
| `POST` | `/api/parse-resume` | Parse PDF, TXT, or Markdown resume uploads. |
| `GET` | `/api/reports` | List saved report summaries. |
| `GET` | `/api/reports/{report_id}` | Load one full saved report. |
| `DELETE` | `/api/reports/{report_id}` | Delete one saved report. |
| `GET` | `/api/reports-export` | Export saved reports as a versioned JSON bundle. |
| `POST` | `/api/reports-import` | Import a compatible reports JSON bundle. |
| `GET` | `/api/applications` | List tracked job applications. |
| `POST` | `/api/applications` | Add a tracked job application. |
| `PATCH` | `/api/applications/{application_id}` | Update status, next action, or linked report. |

## Key Schemas

| Schema | Why it matters |
| --- | --- |
| `AnalyzeRequest` | Input contract for resume/JD analysis. |
| `ResumeMatrixRequest` | Input contract for comparing 2-4 resume versions against one JD. |
| `ResumeMatrixReport` | Output contract for best version, score delta, gained skills, gaps, and recommendations. |
| `AnalysisReport-Output` | Main product payload used by UI, exports, fixtures, and quality gates. |
| `ScoreBreakdown` | Keyword, semantic, and structure score contract. |
| `EvidenceTraceItem` | Explainability contract for resume/JD evidence and gaps. |
| `PortfolioReadiness` | Portfolio readiness score, blockers, strengths, and next action. |
| `ActionBoardItem` | Prioritized local job-search task output. |
| `PortfolioExport` | README-ready case study export payload. |
| `InterviewPack` | Interview positioning, STAR answers, risks, and close pitch. |
| `ReportsExport-Input` / `ReportsExport-Output` | Versioned local backup/restore payload. |
| `ApplicationItem` | Local application tracker row. |

## Import Integrity

`POST /api/reports-import` uses report IDs as the local identity boundary:

- missing report IDs are imported
- report IDs that already exist are skipped
- skipped duplicates do not overwrite existing local report payloads
- the response reports both `imported` and `skipped`

This makes JSON backup restore safe to run more than once.

## Error Contract

| Scenario | Expected result |
| --- | --- |
| Missing `resume_text` or `jd_text` on `POST /api/analyze` | `422` validation error from FastAPI/Pydantic. |
| Unsupported file extension on `POST /api/parse-resume` | `400` with `Unsupported file type. Use PDF, TXT, or Markdown.` |
| Missing report on `GET /api/reports/{report_id}` | `404` with `Report not found`. |
| Missing report on `DELETE /api/reports/{report_id}` | `404` with `Report not found`. |
| Unsupported report import version | `400` with `Unsupported export version`, without deleting existing reports. |
| Missing application on `PATCH /api/applications/{application_id}` | `404` with `Application not found`. |

## Contract Boundaries

- No authentication is included because this is a local single-user tool.
- No remote database is required.
- `OPENAI_API_KEY` is optional and does not change the response contract.
- Exported report JSON can contain private resume data and should be treated as private.
- Error responses are intentionally small because the app is local and single-user; callers should use status code plus `detail`.
