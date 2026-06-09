# JobFit RAG Constraints

## Product Boundary

JobFit RAG is a local, single-user job-search tool. Keep the default path private, deterministic, and easy to run on a weak laptop.

## Hard Constraints

- Local-first by default.
- No auth, accounts, cloud sync, or multi-user state.
- No Redis, Postgres, vector database, worker queue, or local LLM unless product scope changes.
- No scraping login-only, paywalled, or prohibited job-board pages.
- No required API key for analysis, demos, exports, or verification.
- No real resume, JD, API key, Authorization header, or private assertion value in logs, docs, screenshots, tests, or shared terminal output.
- No dependency installation during routine verification unless explicitly chosen as setup work.

## Data Constraints

- Resume and JD text are private career documents.
- SQLite data under `data/` is local and git-ignored.
- `.env` is git-ignored; `.env.example` must contain placeholders only.
- JSON exports may contain private resume/JD-derived data and should be treated as private.

## AI Constraints

- Optional API calls may refine semantic scoring and wording.
- Missing or failed API calls must still return a complete report.
- API failure logs must use fixed warning strings and must not include request bodies or secrets.
- Do not claim API refinement performs features that the code does not implement.

## UX Constraints

- First screen is the usable analysis workflow, not a marketing page.
- Errors shown to users should be status-oriented and avoid echoing private payloads.
- Source metadata for company/JD is local reference data; users paste public JD text manually.
- Exported artifacts should preserve integrity notes and avoid overstating skill ownership.

## Architecture Constraints

- Prefer small, explainable modules over heavy infrastructure.
- Keep score generation deterministic and testable.
- Keep report schema explicit through Pydantic and frontend TypeScript types.
- Add new report fields only when they improve the job-search workflow or verification story.

## Verification Constraints

- Use `scripts/verify-local.ps1` as the Docker-free gate.
- Use `scripts/smoke.ps1` as the Docker-first full smoke path when Docker is available.
- If pytest or frontend test dependencies are missing, report the environment gap instead of installing by default.
- Preserve redaction behavior in verification scripts.
