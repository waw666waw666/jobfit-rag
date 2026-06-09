# JobFit RAG Release Checklist

Use this before sharing the project in a portfolio, GitHub link, interview, or code review.

## 1. Reset Demo State

Use this Docker path when Docker daemon is available:

```powershell
cd D:\VsCodeProjects\jobfit-rag
powershell -ExecutionPolicy Bypass -File .\scripts\reset-demo.ps1
```

Expected:

- `PASS reset-demo`
- two seeded reports
- one seeded application tracker item
- Docker services running on `3000` and `8000`

If Docker is unavailable, do not use this release checklist as the local gate. Run `scripts/verify-local.ps1`, use `scripts/reset-demo.ps1 -NoDocker -NoSeed` only for database cleanup, then follow [Demo Readiness Checklist](demo-readiness-checklist.md).

## 2. Run Local Verification

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\evaluate-fixtures.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-markdown-quality.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-api-contract.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-data-integrity.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-negative-paths.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-accessibility.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-resume-matrix.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\smoke.ps1
```

Expected:

- evaluation fixtures pass
- Markdown quality gate passes
- API contract check passes
- data integrity gate passes
- negative path gate passes
- accessibility gate passes
- resume matrix gate passes
- backend image build passes
- frontend image build passes
- backend tests pass
- frontend production build passes
- accessibility gate inside smoke passes
- backend health passes
- frontend HTTP passes
- analyze API smoke passes
- resume matrix inside smoke passes
- evaluation fixtures inside smoke pass
- Markdown quality gate inside smoke passes
- API contract inside smoke passes
- data integrity gate inside smoke passes
- negative path gate inside smoke passes
- secret scan passes without printing raw matches
- failed smoke child-script output is redacted before the failure summary
- final line prints `PASS smoke`

## 3. Check Runtime

```powershell
docker compose ps
```

Expected:

- `jobfit-rag-backend-1` is up at `http://localhost:8000`
- `jobfit-rag-frontend-1` is up at `http://localhost:3000`

Open:

- `http://localhost:3000`
- `http://localhost:8000/health`

## 4. Optional GitHub Actions Check

When the project is on GitHub, `.github/workflows/smoke.yml` runs the same Docker-first path without secrets:

- `scripts/reset-demo.ps1 -NoBackup`
- `scripts/evaluate-fixtures.ps1` through smoke
- `scripts/check-markdown-quality.ps1` through smoke
- `scripts/check-api-contract.ps1` through smoke
- `scripts/check-data-integrity.ps1` through smoke
- `scripts/check-negative-paths.ps1` through smoke
- `scripts/check-accessibility.ps1` through smoke
- `scripts/check-resume-matrix.ps1` through smoke
- `scripts/smoke.ps1`
- `docker compose ps`
- `docker compose down`

This CI check is optional for local development, but useful as public proof that the project builds, tests, runs, and passes the redacted secret scan.

## 5. Inspect Shareable Evidence

Open these files:

- `README.md`
- `.github/workflows/smoke.yml`
- `docs/evaluation-fixtures.json`
- `scripts/evaluate-fixtures.ps1`
- `scripts/check-markdown-quality.ps1`
- `docs/api-contract.md`
- `docs/openapi.json`
- `scripts/check-api-contract.ps1`
- `scripts/check-data-integrity.ps1`
- `scripts/check-negative-paths.ps1`
- `scripts/check-accessibility.ps1`
- `scripts/check-resume-matrix.ps1`
- `docs/jobfit-rag-demo-input.png`
- `docs/jobfit-rag-demo-report.png`
- `docs/architecture.md`
- `docs/privacy.md`
- `docs/interview-zh.md`
- `docs/demo-script.md`

Confirm the README top sections show:

- what the project proves
- quick demo commands
- real screenshots
- portfolio artifacts
- architecture proof
- privacy and trust
- verification commands
- CI-lite workflow
- evaluation fixtures
- Markdown quality gate
- API contract
- data integrity gate
- negative path gate
- accessibility gate
- resume matrix gate
- hardware fit

## 6. Do Not Share Private Local Data

Do not commit or publish:

- `.env`
- `data/`
- exported real resume Markdown
- exported real report JSON
- screenshots containing real private resume content
- API keys or bearer tokens
- `.playwright-cli`

Safe tracked examples:

- `.env.example`
- `.github/workflows/smoke.yml`
- demo screenshots generated from sample data
- docs
- source code
- Docker files
- scripts

## 7. Interview Demo Order

Use this short path:

1. Open README top section.
2. Show Demo Evidence screenshots.
3. Run or mention `reset-demo.ps1`.
4. Open `http://localhost:3000`.
5. Click `AI app sample`.
6. Click `Analyze Fit`.
7. Show `Readiness`, `Action Board`, `Proof Plan`, and `Interview`.
8. Export the portfolio case study.
9. Explain architecture and privacy boundaries.
10. Mention `smoke.ps1` as the verification gate.
11. Mention CI-lite as the GitHub sharing gate.
12. Use `docs/interview-zh.md` for the Chinese talk track.
13. Mention evaluation fixtures as analyzer stability evidence.
14. Mention Markdown quality gate as export completeness evidence.
15. Mention API contract as backend interface evidence.
16. Mention data integrity gate as backup/restore safety evidence.
17. Mention negative path gate as error-handling evidence.
18. Mention accessibility gate as frontend quality evidence.
19. Mention resume matrix as real job-search workflow evidence.

## 8. Strong Resume Bullets

Use one or two of these:

- Built a Dockerized local-first AI job-fit analyzer with React, TypeScript, FastAPI, SQLite, deterministic fallback scoring, and optional OpenAI-compatible refinement.
- Designed an explainable resume/JD analysis workflow that turns match scores into evidence traces, proof plans, interview packs, action boards, and README-ready portfolio case studies.
- Implemented Docker-first verification with backend tests, frontend production build, runtime health checks, API smoke checks, and local secret scanning for safe project sharing.
- Added a no-secret GitHub Actions workflow that runs Docker Compose reset and smoke checks for public portfolio verification.
- Documented architecture, privacy boundaries, release checklist, and demo flow so reviewers can understand the project without reading the full codebase first.
- Prepared a Chinese interview pack covering product value, architecture, privacy, CI, boundaries, and common Q&A.
- Added evaluation fixtures for fixed resume/JD cases so analyzer behavior has stable expectations beyond ad hoc demos.
- Added Markdown quality gate for report, interview pack, and portfolio case study export completeness.
- Added API contract pack with OpenAPI snapshot, endpoint table, and contract check.
- Added data integrity gate for export/import roundtrip, duplicate skip behavior, and non-overwrite safety.
- Added negative path gate for invalid payloads, unsupported uploads, missing resources, and unsupported import versions.
- Added accessibility gate for labeled inputs, live regions, tab semantics, keyboard-friendly import, and focus-visible styling.
- Added resume version matrix gate for comparing baseline and tailored resumes against the same JD.

## 9. Known Boundaries

Be clear about what this version does not claim:

- not a hiring prediction
- not a real ATS guarantee
- not enterprise security software
- not multi-user SaaS
- not a local LLM system
- not a vector database RAG platform

The product is intentionally scoped as a local, explainable, single-user AI career workflow.
