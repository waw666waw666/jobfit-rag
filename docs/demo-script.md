# JobFit RAG Demo Script

## 1. Start

Open the README first and show the top sections:

- What It Shows
- Why It Exists
- Quick Demo
- Demo Evidence
- Portfolio Proof
- Architecture Proof
- Privacy And Trust
- Verification Commands
- CI Lite
- Chinese Interview Pack
- Evaluation Fixtures
- Markdown Quality Gate
- API Contract
- Hardware Fit
- Release Checklist

Docker-first path:

```powershell
cd D:\VsCodeProjects\jobfit-rag
docker compose up --build
```

Open `http://localhost:3000`.

Docker-free local debug path:

```powershell
cd D:\VsCodeProjects\jobfit-rag
.\scripts\verify-local.ps1
```

Then follow `docs/local-demo-runbook.md` to start the backend and frontend manually. Use demo/sample content only; do not paste real resume, JD, or API key values into screenshots or terminal output.

## 2. Health Check

Open `http://localhost:8000/health`.

Expected:

```json
{
  "status": "ok",
  "service": "jobfit-rag"
}
```

Optional full smoke check:

```powershell
.\scripts\smoke.ps1
```

Expected: final line prints `PASS smoke`.

Optional Docker reset before a clean interview demo:

```powershell
.\scripts\reset-demo.ps1
```

Expected: final line prints `PASS reset-demo`, with two reports and one application tracker item seeded. For Docker-free database cleanup during local debugging, use `.\scripts\reset-demo.ps1 -NoDocker -NoSeed` instead.

## 3. Screenshot Evidence

Open the README `Demo Evidence` section.

Show:

- `docs/jobfit-rag-demo-input.png`
- `docs/jobfit-rag-demo-report.png`

Explain that both screenshots come from the local Docker Compose runtime after seeding demo data and running analysis.

Interview line:

```text
I keep screenshots in the repo as product evidence, but they are generated from the real local Docker app rather than a mockup.
```

## 4. Architecture Walkthrough

Open the README `Architecture Proof` section.

Explain:

- React handles the single-page workflow and exports.
- FastAPI validates requests and owns persistence.
- The deterministic analyzer produces a complete report without API keys.
- OpenAI-compatible calls are optional refinements, not a required runtime path.
- SQLite keeps private job-search data local and resettable.
- Heavy infrastructure is intentionally excluded because the product is a single-user local tool.

Interview line:

```text
I kept the architecture small because the job-to-be-done is one resume, one JD, and a defensible report. Docker, FastAPI, React, SQLite, and deterministic fallback cover that scope without requiring a server, GPU, or vector database.
```

## 5. Privacy Walkthrough

Open `docs/privacy.md`.

Explain:

- Local SQLite is the default data store.
- `.env` and `data/` are ignored by git.
- API calls are optional and controlled by `OPENAI_API_KEY`.
- Missing keys or API failures still return a deterministic report.
- Exported JSON or Markdown can contain private resume data, so users should treat them as private files.
- `smoke.ps1` runs a local secret scan before sharing the project and redacts raw matches from failure output.
- Frontend API failures show status-only errors instead of raw backend response bodies.
- Local verification scripts redact HTTP response bodies and private assertion values where they may be derived from resume or JD content.

Interview line:

```text
I treated resume data as private by default. The app works locally without tokens, stores reports in a git-ignored SQLite file, shows status-only frontend API errors, and uses redacted secret scanning plus redacted local verification failures before sharing.
```

## 6. Analyze Sample

Use the sample resume and JD from the README.

Click `Analyze Fit`.

Show:

- score
- keyword / semantic / structure scores
- matched skills
- missing skills
- evidence
- evidence trace
- evidence quality and quality score
- suggestions
- optimized bullets
- tailored resume draft
- case study
- interview pack
- proof plan
- portfolio readiness
- action board
- learning plan
- bullet rubric
- interview questions
- structure analysis
- API mode
- disclaimer

## 7. History And Compare

Refresh `Report History`.

Open a saved report.

Select two saved reports.

Show `Report Compare`: score delta, gained skills, and remaining gaps.

Add a target role in `Application Tracker`.

Mark it as applied.

Click `Export JSON`.

Import the exported JSON file to restore reports.

Delete a saved report.

## 8. Demo Mode

Click `Demo mode`.

Show read-only inputs and the portfolio demo note.

Click `Edit mode` to return to editing.

## 9. Language

Switch `EN / 中文`.

Refresh the page.

Expected: language preference stays selected.

## 10. Export

Click `Export Markdown`.

Expected: a `jobfit-report-*.md` file downloads.

The report should include component scores, structure analysis, readiness, action board, evidence trace, tailored draft, case study, learning plan, proof plan, bullet rubric, comparison summary, and disclaimer.

Open `Readiness`.

Expected: readiness score, level, strengths, blockers, and next best action are visible.

Open `Action Board`.

Expected: proof gaps, readiness blockers, and weak bullets appear as prioritized tasks with source, reason, acceptance check, and estimated days.

Open `Proof`.

Expected: weak or missing evidence turns into small proof tasks with artifact, acceptance check, and estimated days.

Click `Export Interview Pack`.

Expected: a `jobfit-interview-pack-*.md` file downloads.

The interview pack should include positioning statement, STAR answers, risk notes, close pitch, linked application context, and disclaimer.

Click `Export Portfolio Case Study`.

Expected: a `jobfit-portfolio-case-study-*.md` file downloads.

The portfolio case study should include headline, problem, solution, architecture, trade-offs, proof artifacts, readiness, next actions, resume bullet, and disclaimer.

## 11. Interview Talking Points

- Docker-first local runtime
- README top section explains value in 60 seconds
- real screenshots show the running product, not a mockup
- architecture diagram explains the system before code reading
- fallback flow shows optional AI without hard dependency
- infrastructure trade-offs are explicit and hardware-aware
- privacy note documents local data and secret boundaries
- smoke secret scan before sharing
- one-command local smoke verification
- repeatable demo data reset
- lightweight AI app for weak laptops
- deterministic fallback before LLM integration
- structured report schema
- SQLite persistence
- report history, delete, and compare flows
- JSON import/export
- portfolio demo mode
- bilingual UI and export
- ATS-style structure analysis
- evidence trace
- evidence quality scoring
- tailored resume draft
- case study storytelling
- README-ready portfolio case study export
- interview pack export
- proof artifact planner
- portfolio readiness score
- action board from proof gaps and weak bullets
- application tracker
- 7-day learning plan
- bullet-level resume scoring
- PDF/TXT/MD resume parsing
- portfolio-ready user workflow

## 12. Final Handoff

Open `docs/release-checklist.md`.

Show:

- reset command
- smoke command
- runtime check
- private-file warning
- interview demo order
- CI-lite workflow
- strong resume bullets
- known boundaries

Interview line:

```text
I added a release checklist so the project is not just implemented, but also safe to share, easy to demo, and clear about its boundaries.
```

## 13. CI Lite

Open `.github/workflows/smoke.yml`.

Explain:

- It uses GitHub Actions `ubuntu-latest`.
- It does not require API keys or secrets.
- It runs `reset-demo.ps1 -NoBackup`.
- It runs `smoke.ps1`.
- It prints `docker compose ps` for runtime evidence.
- It stops services at the end.

Interview line:

```text
The CI workflow mirrors the local verification path, so the project has one story for both laptop demos and GitHub review: Docker reset, Docker smoke, no secrets required.
```

## 14. Chinese Interview Pack

Open `docs/interview-zh.md`.

Show:

- 30 秒介绍
- 2 分钟讲稿
- 架构讲法
- 隐私讲法
- CI 讲法
- 简历 Bullet
- 常见追问
- 不要夸大的边界

Interview line:

```text
我准备了中文面试包，因为这个项目不只是代码作品，还需要能清楚讲出产品价值、架构取舍、隐私边界和验证方式。
```

## 15. Evaluation Fixtures

Open `docs/evaluation-fixtures.json` and `scripts/evaluate-fixtures.ps1`.

Explain:

- Fixtures cover strong match, proof gap, and frontend-to-AI transfer cases.
- The script calls `/api/analyze` against the running backend.
- It checks score ranges, matched skills, missing skills, API mode, readiness score, action items, and required report sections.
- `smoke.ps1` runs the fixture check before secret scan.

Interview line:

```text
I added lightweight evaluation fixtures so the analyzer has stable expectations. I avoid asserting fragile generated wording and focus on product-level behavior: score range, skills, gaps, readiness, actions, and report sections.
```

## 16. Markdown Quality Gate

Open `scripts/check-markdown-quality.ps1`.

Explain:

- It calls `/api/analyze`.
- It checks the full report Markdown structure.
- It checks the interview pack Markdown structure.
- It checks the portfolio case study Markdown structure.
- It verifies required sections such as score breakdown, readiness, evidence trace, proof plan, interview pack, STAR answers, architecture, trade-offs, next actions, and disclaimer.
- `smoke.ps1` runs it after evaluation fixtures.

Interview line:

```text
I added a Markdown quality gate because export is a user-facing deliverable. The script checks that the report, interview pack, and portfolio case study contain the sections a reviewer or interviewer expects.
```

## 17. API Contract

Open `docs/api-contract.md`, `docs/openapi.json`, and `scripts/check-api-contract.ps1`.

Explain:

- FastAPI exposes `/openapi.json`.
- The script compares the running OpenAPI contract with `docs/openapi.json` without writing tracked files by default.
- It checks required paths and methods.
- It checks key schemas such as `AnalysisReport-Output`, `PortfolioReadiness`, `ActionBoardItem`, `PortfolioExport`, and `ApplicationItem`.
- It checks important fields such as `overall_score`, `matched_skills`, `missing_skills`, `evidence_trace`, `portfolio_readiness`, `action_board`, and `interview_pack`.
- `smoke.ps1` runs the contract check before secret scan.

Interview line:

```text
I added an API contract gate so the backend interface is reviewable. The project now verifies not only behavior, but also the OpenAPI routes, schemas, and fields the frontend and export checks depend on.
```

## 18. Negative Path Gate

Open `scripts/check-negative-paths.ps1`.

Explain:

- It calls the running backend directly.
- It checks missing `jd_text` on `/api/analyze`.
- It checks unsupported resume upload types.
- It checks missing report detail and delete requests.
- It checks unsupported report import versions.
- It confirms a rejected import does not delete an existing report.
- It checks missing application updates.
- `smoke.ps1` runs the gate before secret scan.

Interview line:

```text
I added a negative path gate so the project is not only demo-happy. Invalid payloads, unsupported uploads, missing resources, and bad import versions fail predictably, and the rejected import path is checked for data safety.
```

## 19. Data Integrity Gate

Open `scripts/check-data-integrity.ps1`.

Explain:

- It creates a report through `/api/analyze`.
- It exports the report bundle.
- It deletes the created report.
- It imports the bundle and verifies the report comes back.
- It checks ID, score, and summary preservation.
- It imports the same report again.
- The duplicate import must return `imported=0` and `skipped=1`.
- The duplicate import must not overwrite the existing local report.
- `smoke.ps1` runs it before negative path checks.

Interview line:

```text
I added a data integrity gate because local-first tools need trustworthy backup and restore. The project now verifies export/import roundtrip, duplicate skipping, and non-overwrite behavior through the live API.
```

## 20. Accessibility Gate

Open `scripts/check-accessibility.ps1`, `frontend/src/main.tsx`, and `frontend/src/styles.css`.

Explain:

- Main resume and JD inputs have IDs and helper text relationships.
- Upload and tracker inputs have accessible labels.
- Language and demo toggles expose pressed state.
- Report tabs expose `tablist`, `tab`, `aria-selected`, and `tabpanel`.
- Action/error updates use polite live regions.
- JSON import uses a keyboard-focusable button.
- Focus-visible styling is explicit in CSS.
- `smoke.ps1` runs the gate after frontend build.

Interview line:

```text
I added an accessibility gate so frontend quality is not only visual. The app now checks core labels, tab semantics, live regions, keyboard-friendly import, and focus-visible behavior as part of the Docker smoke path.
```

## 21. Resume Version Matrix

Open `scripts/check-resume-matrix.ps1`, `backend/app/main.py`, and the frontend matrix panel.

Explain:

- It compares one JD against two to four resume versions.
- It returns best version, score delta, gained skills, remaining gaps, readiness score, and recommendations.
- Matrix runs do not write report history by default.
- The frontend compares the current resume with a tailored version.
- `smoke.ps1` runs the live matrix API check.

Interview line:

```text
I added a resume version matrix because real job search is iterative. Instead of only asking “does this resume match,” the app can now show whether a tailored version improved against the same JD and which gaps remain.
```
