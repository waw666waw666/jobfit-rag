# JobFit RAG v0.2 Research Notes

## Sources Reviewed

- [Resume Matcher](https://github.com/srbhr/Resume-Matcher): open-source resume-to-JD matcher focused on ATS-style scoring, keyword extraction, and practical resume tailoring workflows.
- [CVZ](https://cvz-cli.vercel.app/): resume/JD matcher that describes keyword, semantic, and structure scoring as separate dimensions.
- [JobSifter](https://jobsifter.eu/): job search assistant with privacy-first messaging, cover letter support, job matching, and usage/cost visibility.
- [GitHub resume-matching topic](https://github.com/topics/resume-matching): common implementations include match scoring, gap analysis, resume tailoring, and job application tracking.
- [JobMatchAI paper](https://arxiv.org/abs/2603.14558): emphasizes factor-wise explanations so users can see why a match score was assigned.

## Patterns To Adopt

- Split one opaque score into component scores: keyword, semantic, and structure.
- Make recommendations explainable with evidence from resume and JD text.
- Add ATS-style structure checks, but label them as guidance instead of promising real ATS accuracy.
- Keep privacy and local-first messaging visible in the product.
- Provide report history so users can compare different JDs.
- Keep export useful for job-search workflow: score, gaps, structure, rewrite advice, and interview prep.

## Patterns To Avoid

- Do not claim to predict hiring outcome or real ATS behavior.
- Do not add heavy services such as PostgreSQL, Redis, or vector DB containers for v0.2.
- Do not copy code from open-source projects.
- Do not require local model downloads or GPU.
- Do not overbuild full job-board scraping or multi-user accounts.

## v0.2 Product Direction

JobFit RAG should remain a Docker-first local app, but feel more like a job-search product:

- report history
- persistent language preference
- sample controls
- component scoring
- structure analysis
- optional API refinement indicator
- clearer disclaimer
- better Markdown export

## v0.3 Research Refresh

Fresh patterns from open-source resume matchers, ATS analyzers, and job-search tools:

- [GitHub resume-matching topic](https://github.com/topics/resume-matching): current projects show a shift toward job-search dashboards, local/private workflows, report history, and gap analysis.
- [CVZ](https://cvz-cli.vercel.app/): supports compare-style exports and separates keyword, semantic, and structure scoring.
- [JobMatchAI paper](https://arxiv.org/abs/2603.14558): reinforces factor-wise explanations instead of opaque one-number scoring.
- [Local ATS](https://localats.com/): uses a simple paste/upload flow and privacy-first positioning.
- [ATS Screener](https://ats-screener.vercel.app/): emphasizes browser-side parsing and clear privacy messaging.
- Treat the app as a job-search cockpit, not a one-shot score page.
- Let users compare reports across target roles so progress is visible.
- Convert missing skills into a short learning plan with proof artifacts.
- Score resume bullets with a simple rubric: action, technology, result, metric.
- Keep demo mode separate from editing mode so the project is easy to present in interviews.

## v0.3 Adopt / Avoid

Adopt:

- A read-only demo view for interviews and portfolio walkthroughs.
- Lightweight report comparison computed in the browser from existing reports.
- Backend-generated learning plan and bullet rubric data stored inside each report.
- Scrollable history and stronger empty/loading/error states.

Avoid:

- Multi-user accounts, cloud sync, job-board scraping, or background workers.
- Heavy semantic infrastructure such as vector databases for this version.
- Claims that a bullet score or match score predicts real ATS behavior.

## v0.4 Product Direction

The next quality jump is not heavier AI. It is trust, portability, and interview storytelling:

- Evidence trace: every skill should show resume evidence, JD evidence, why it matched or missed, and the recommended action.
- Tailored resume draft: generate a truthful JD-specific draft that reorganizes existing evidence without inventing experience.
- Case study: turn the report into a portfolio story that explains problem, solution, architecture, trade-offs, and demo talk track.
- JSON import/export: let users back up local reports and move them between Docker runs.

Avoid:

- Auto-applying resume edits without user review.
- Pretending the tailored draft is a final resume.
- Storing credentials or API outputs outside the local SQLite report payload.

## v0.5 Product Direction

The next useful step is a job-search cockpit that remains local and lightweight:

- Evidence quality: distinguish direct project evidence from weak keyword mentions.
- Application tracker: connect each report to a target company, role, status, and next action.
- Interview pack: keep reports exportable as a narrative, not just a score.

Avoid:

- Job-board scraping.
- Multi-user accounts.
- Cloud sync.
- Heavy queues or separate databases.

## v0.6 Product Direction

The strongest low-cost improvement is interview preparation export:

- Convert the strongest evidence trace rows into STAR answers.
- Keep weak and missing evidence visible as risk notes.
- Tie exported interview prep to linked application tracker rows.
- Keep export as plain Markdown so it works without extra dependencies or paid services.

Avoid:

- Generating fake stories.
- Adding calendar/email/job-board integrations before the core local workflow is stable.
- Requiring templates, PDF rendering, or office document libraries for this version.

## v0.7 Product Direction

The next useful improvement is proof artifact planning:

- Treat weak and missing evidence as a task backlog, not just a warning.
- Make each gap produce a small artifact: README note, screenshot, command output, demo clip, or honest resume bullet.
- Keep acceptance checks explicit so the user knows when the gap is actually defendable.
- Estimate work in days, not story points, because the target user is a solo job seeker.

Avoid:

- Building a full project management system.
- Adding kanban boards, notifications, accounts, or cloud sync.
- Pretending a planned proof artifact is already experience.

## v0.8 Product Direction

The next product layer is portfolio readiness:

- Collapse many report sections into one readiness score and next action.
- Keep the score explainable by deriving it from evidence quality, proof risks, bullet quality, case study, and interview pack.
- Use readiness levels that are useful for a solo job seeker: draft, almost ready, ready.
- Treat blockers as priority guidance, not as rejection predictions.

Avoid:

- Claiming hiring probability.
- Adding opaque ML scoring.
- Hiding weak evidence behind a high overall score.

## v0.9 Product Direction

The next useful layer is action, not more scoring:

- Convert proof gaps, readiness blockers, and weak bullets into a prioritized action board.
- Keep every action tied to a source section so the user can explain why it exists.
- Use acceptance checks instead of vague advice, because portfolio gaps need defendable proof.
- Keep the board report-local and deterministic; no accounts, task database, reminders, or cloud sync.

Avoid:

- Turning the app into a full project management tool.
- Adding job-board scraping or background automations before the local workflow is complete.
- Treating planned tasks as completed evidence.

## v1.0 Product Direction

The next portfolio jump is reusable storytelling:

- Export a README-ready case study from existing report data.
- Include headline, problem, solution, architecture, trade-offs, proof artifacts, readiness, next actions, and one honest resume bullet.
- Make the export plain Markdown so it works with GitHub, portfolio sites, notes apps, and interview prep.
- Keep the case study generated from existing evidence instead of inventing claims.

Avoid:

- PDF rendering or office document generation for this version.
- Fake proof links or fabricated project outcomes.
- Adding a publishing workflow before the local Markdown export is solid.

## v1.1 Product Direction

The next credibility layer is repeatable local verification:

- Provide one Docker-first smoke command for build, tests, runtime, API, and secret scan.
- Keep the script readable enough to discuss in interviews.
- Avoid host Node/Python assumptions so weak laptops stay clean.
- Treat passing smoke output as portfolio evidence, not just developer convenience.

Avoid:

- Adding CI vendor lock-in before the local path is stable.
- Requiring GitHub Actions secrets or hosted runners.
- Making smoke checks depend on optional API keys.

## v1.2 Product Direction

The next demo-quality layer is resettable local state:

- Provide one command to reset noisy local SQLite history before interviews.
- Back up existing local data by default, then seed stable reports and one application tracker row.
- Seed through the API so reports always match the current schema.
- Keep the reset scoped to project `data/`; never touch `.env` or source files.

Avoid:

- Shipping a large fixture database.
- Requiring external seed files or paid API calls.
- Deleting user files outside the project data directory.

## v1.3 Product Direction

The next portfolio layer is first-impression clarity:

- Rewrite the README top section so a reviewer understands the project in under 60 seconds.
- Lead with what the project proves: full-stack AI product workflow, local-first design, explainable evidence, Docker-first verification.
- Move exhaustive feature detail below the portfolio story.
- Add quick demo, portfolio proof, verification commands, and hardware fit near the top.

Avoid:

- Marketing fluff without technical evidence.
- Hiding verification commands at the bottom.
- Letting the feature list be the first thing a recruiter or interviewer sees.

## v1.4 Product Direction

The next credibility layer is architecture proof:

- Add diagrams that show the full request path from browser to report export.
- Make the optional AI path explicit so reviewers see that API calls improve the report but do not gate the product.
- Explain why the project avoids vector databases, PostgreSQL, Redis, local LLMs, and workers.
- Keep architecture documentation close to demo commands so the project can be explained in under two minutes.

Avoid:

- Adding infrastructure just to look more advanced.
- Replacing a clear local workflow with a distributed system.
- Making the README diagram prettier than the actual implementation.

## v1.5 Product Direction

The next trust layer is privacy proof:

- Document what data stays local, what can be exported, and what may be sent to an optional API.
- Make `.env`, `data/`, SQLite, and reset backups understandable to non-maintainers.
- Tie the privacy claim to existing verification: `.gitignore`, `.env.example`, Docker environment variables, and `smoke.ps1` secret scan.
- Add interview language that frames privacy as an engineering decision, not a slogan.

Avoid:

- Claiming the app is end-to-end encrypted or enterprise-secure.
- Hiding the optional remote API path.
- Treating exported real resume data as safe to publish.

## v1.6 Product Direction

The next portfolio layer is visual proof:

- Put real runtime screenshots near the top of the README.
- Capture both the input workflow and the analyzed report so reviewers see before-and-after product flow.
- Keep screenshots generated from Docker Compose runtime, not design mockups.
- Treat screenshots as evidence, while smoke tests remain the correctness gate.

Avoid:

- Over-polishing screenshots instead of improving the product.
- Publishing real private resume data in visual artifacts.
- Leaving temporary Playwright output folders in the repo.

## v1.7 Product Direction

The next delivery layer is release readiness:

- Add a sharing checklist that ties together reset, smoke, runtime, screenshots, privacy, and demo order.
- Make private-file boundaries explicit before the project is published or shown.
- Provide concise resume bullets that honestly describe implemented work.
- State product boundaries so the project is not oversold as ATS prediction, enterprise security, SaaS, local LLM, or vector database infrastructure.

Avoid:

- Treating a passing test suite as the whole release process.
- Shipping private local data with the portfolio.
- Inflating the project beyond its intentionally local single-user scope.

## v1.8 Product Direction

The next credibility layer is CI-lite:

- Add a no-secret GitHub Actions workflow that mirrors the local Docker verification path.
- Reuse `reset-demo.ps1` and `smoke.ps1` instead of inventing a separate CI-only path.
- Keep the workflow understandable enough to discuss in interviews.
- Make CI evidence complementary to local smoke output, not a replacement for local verification.

Avoid:

- Requiring API keys, paid services, or hosted databases in CI.
- Adding matrix builds before the project needs them.
- Making CI more complex than the product architecture.

## v1.9 Product Direction

The next employability layer is interview delivery:

- Add a Chinese interview pack so the project can be explained clearly without improvising.
- Cover product value, architecture trade-offs, privacy boundary, CI, resume bullets, common follow-up questions, and honest scope.
- Keep the talk track tied to implemented features and verification evidence.
- Make it useful for real interviews, not just documentation completeness.

Avoid:

- Translating the README line by line.
- Overselling the project as ATS prediction, SaaS, enterprise security, or local LLM infrastructure.
- Writing vague talking points that cannot be backed by files, scripts, screenshots, or tests.

## v2.0 Product Direction

The next quality layer is evaluation fixtures:

- Add fixed resume/JD cases that exercise strong match, proof gap, and transfer-profile scenarios.
- Verify stable behavior through the API: score range, matched skills, missing skills, API mode, readiness, action items, and report sections.
- Avoid brittle assertions on generated prose.
- Include the fixture check in smoke so local and CI verification cover analyzer stability.

Avoid:

- Treating one manual demo as evidence of stable AI behavior.
- Overfitting fixtures to exact wording.
- Adding heavy evaluation infrastructure before the deterministic analyzer needs it.

## v2.1 Product Direction

The next quality layer is export completeness:

- Add a Markdown quality gate for the full report, interview pack, and portfolio case study.
- Verify section presence and core content instead of pixel/UI behavior.
- Run the check from smoke so local and CI paths catch missing export sections.
- Keep the script lightweight and API-driven.

Avoid:

- Treating a download button as proof that the exported artifact is complete.
- Adding browser automation for export validation before it is needed.
- Asserting fragile timestamps or generated prose.

## v2.2 Product Direction

The next backend quality layer is API contract proof:

- Export the FastAPI OpenAPI schema as a shareable artifact.
- Add an endpoint table so reviewers can understand the backend without reading route code first.
- Check required paths, methods, schemas, and fields from the running backend.
- Include the contract check in smoke so local and CI verification catch accidental API surface regressions.

Avoid:

- Treating OpenAPI generation alone as contract verification.
- Adding heavyweight contract tooling before the API surface needs it.
- Letting frontend/export scripts depend on fields that are not contract-checked.

## v2.3 Product Direction

The next reliability layer is negative path proof:

- Verify that invalid inputs fail predictably, not just that the demo path works.
- Cover missing analyze fields, unsupported resume upload types, missing reports, missing applications, and incompatible import versions.
- Confirm a rejected import cannot destroy existing local reports.
- Include the negative path gate in smoke so local and CI verification cover errors as part of the release story.

Avoid:

- Adding custom error frameworks before FastAPI/Pydantic defaults stop being enough.
- Over-designing user-facing error schemas for a local single-user tool.
- Treating 200-only smoke checks as sufficient backend reliability evidence.

## v2.4 Product Direction

The next local-first trust layer is data integrity proof:

- Verify report export/import as a backup/restore workflow, not only as UI convenience.
- Make imports idempotent by skipping duplicate report IDs instead of overwriting local data.
- Expose imported and skipped counts so users know what happened.
- Include a live API gate that exports, deletes, restores, repeats import, and checks preservation.

Avoid:

- Treating JSON import as a blind overwrite.
- Adding cloud sync or account systems before local backup/restore is safe.
- Claiming full backup coverage for files outside report history.

## v2.5 Product Direction

The next frontend quality layer is accessibility proof:

- Add stable labels and descriptions to the main resume/JD inputs.
- Make toggles and report tabs expose their state to assistive technology.
- Keep JSON import keyboard-friendly instead of hiding the only interactive control in a label.
- Add visible focus styles that work across buttons, inputs, textareas, and import controls.
- Include a lightweight static gate in smoke so accessibility wiring does not regress.

Avoid:

- Claiming full WCAG certification from a lightweight static check.
- Adding heavy browser automation before core semantics are stable.
- Treating visual polish as enough for a portfolio-grade workflow tool.

## v2.6 Product Direction

The next job-search workflow layer is resume version comparison:

- Let users compare a baseline resume with a tailored version against the same JD.
- Show score delta, gained skills, remaining gaps, and best version instead of forcing users to infer progress from separate reports.
- Keep matrix runs lightweight and non-persistent so experimentation does not clutter report history.
- Verify the live matrix API in smoke.

Avoid:

- Turning resume tailoring into fabricated experience.
- Saving every experiment as a report by default.
- Adding document diff libraries before score/gap comparison is useful.
