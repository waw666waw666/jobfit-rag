# JobFit RAG PRD

## Product Summary

JobFit RAG is a local-first resume and job-description analysis tool for solo job seekers. It compares one resume against one target JD, turns the match into evidence-backed sections, and helps the user decide what to rewrite, prove, or prepare before applying.

The project uses a RAG-style product pattern: outputs are grounded in resume evidence and JD evidence. It is not a traditional vector-database RAG platform in v1.

## Target User

- A developer or AI application builder preparing for interviews.
- A portfolio reviewer who wants to see a complete local AI product workflow.
- A solo job seeker who wants a private, repeatable resume/JD review loop.

## Problem

Resume tools often stop at a score. The useful next questions are:

- Which JD requirements are actually supported by resume evidence?
- Which skills are missing or only weakly mentioned?
- What proof artifact would make the gap defendable?
- What can be exported into interview prep or a portfolio story?

## Goals

- Analyze resume text and JD text locally by default.
- Produce a complete job-fit report without requiring API keys.
- Explain score drivers with keyword, semantic, and structure scores.
- Tie matched and missing skills to evidence trace rows.
- Generate practical next steps: learning plan, proof plan, action board, and interview pack.
- Store reports and application targets in local SQLite.
- Export useful artifacts as Markdown and JSON.

## Non-Goals

- Predict hiring outcomes or real ATS behavior.
- Replace a recruiter, career coach, or legal/employment advisor.
- Support multi-user accounts, auth, cloud sync, or team collaboration.
- Scrape login-only or prohibited job-board pages.
- Require a vector database, local LLM, GPU, Redis, Postgres, or background workers.
- Claim that planned proof artifacts are already real experience.

## Core Workflow

1. User pastes or uploads resume text.
2. User pastes public JD text and optionally records company/source metadata.
3. Backend validates inputs and runs deterministic local analysis.
4. Optional OpenAI-compatible API improves semantic score and wording when configured.
5. Backend returns a structured report.
6. Frontend renders score, evidence, gaps, readiness, proof plan, action board, and exports.
7. User stores report locally and can link it to an application target.

## Acceptance Criteria

- App works without `OPENAI_API_KEY`.
- Failed optional API calls fall back to local output without logging resume text, JD text, API keys, or Authorization headers.
- Reports include score breakdown, structure analysis, matched/missing skills, evidence trace, proof plan, portfolio readiness, action board, interview pack, and export data.
- Local report persistence uses a git-ignored SQLite file.
- Frontend can build with `npm run build`.
- `scripts/verify-local.ps1` passes on a local machine without Docker.
- Docker smoke remains the full verification path when Docker is available.

## Positioning

Use this wording when explaining the project:

> JobFit RAG is a local-first, evidence-grounded resume/JD analyzer with optional AI refinement. It uses RAG-style grounding against resume and JD evidence, but intentionally avoids vector-database RAG in v1 because the product compares one resume with one JD.
