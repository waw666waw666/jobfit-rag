# JobFit RAG Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn JobFit RAG from a strong portfolio prototype into a maintainable, verifiable local-first AI job-search product.

**Architecture:** Keep the current Docker-first React + FastAPI + SQLite shape. First stabilize docs, reproducibility, and safety gates; then split the oversized frontend and backend analyzer along existing boundaries without changing product behavior.

**Tech Stack:** React 19, TypeScript, Vite, FastAPI, Pydantic v2, SQLite, pytest, Docker Compose, PowerShell verification scripts.

---

## Current Findings

- `frontend/src/main.tsx` is the main maintenance risk because types, API calls, state, UI, copy, and Markdown export all live in one large file.
- Backend upload parsing reads the full file into memory and should get a small local-file guard before wider use.
- `backend/app/ai_client.py` falls back correctly, but it swallows API failures without enough local observability.
- Frontend and backend schemas are manually duplicated; OpenAPI-generated TypeScript types are the future direction, but not the first step.
- The project already has useful verification scripts, docs, Docker Compose, screenshots, fixtures, and CI smoke coverage.

## Target Mode Rules

- One small objective at a time.
- Every task ends with a command that proves it worked.
- Keep deterministic fallback behavior unchanged.
- Keep Docker-first demo flow working after every milestone.
- Do not add auth, cloud sync, vector DB, Redis, Postgres, or a local LLM in this optimization pass.

## Milestone 1: Developer Documentation And Quality Baseline

### Task 1: Add Developer Guide

**Files:**
- Create: `docs/development.md`
- Modify: `README.md`

**Steps:**
1. Document local setup, Docker setup, backend test loop, frontend build loop, script gates, env vars, data reset, and troubleshooting.
2. Link the guide from `README.md` near the verification section.
3. Run `powershell -ExecutionPolicy Bypass -File scripts/check-accessibility.ps1` to confirm static UI gate still passes.
4. Run `docker compose run --rm backend pytest -q` to confirm backend tests still pass.

### Task 2: Make Environment Examples Complete

**Files:**
- Modify: `.env.example`
- Modify: `docs/development.md`

**Steps:**
1. Add `JOBFIT_DB_PATH=/app/data/jobfit.sqlite3` to `.env.example`.
2. Explain that Docker uses `/app/data/jobfit.sqlite3`, while local Python runs can override it.
3. Run `docker compose config` and confirm the compose file resolves.

### Task 3: Add Frontend Dependency Lock

**Files:**
- Create: `frontend/package-lock.json`
- Modify: `frontend/Dockerfile`

**Steps:**
1. Run `npm install --package-lock-only` in `frontend/`.
2. Change Docker install from `npm install` to `npm ci`.
3. Run `docker compose build frontend`.
4. Run `docker compose run --rm frontend npm run build`.

## Milestone 2: Backend Safety And Observability

### Task 4: Add Resume Upload Size Guard

**Files:**
- Modify: `backend/app/main.py`
- Modify: `backend/tests/test_api.py`

**Steps:**
1. Add a failing test that uploads a TXT file larger than the allowed limit and expects HTTP 400.
2. Add a module constant like `MAX_RESUME_UPLOAD_BYTES = 2 * 1024 * 1024`.
3. After `await file.read()`, reject payloads above the limit before PDF parsing.
4. Run `docker compose run --rm backend pytest -q`.
5. Run `powershell -ExecutionPolicy Bypass -File scripts/check-negative-paths.ps1` against a running backend.

### Task 5: Make AI Fallback Failures Observable

**Files:**
- Modify: `backend/app/ai_client.py`
- Modify: `backend/tests/test_analyzer.py`

**Steps:**
1. Add logging with `logging.getLogger(__name__)`.
2. Log warning-level messages for embedding and chat failures without logging resume/JD text or API keys.
3. Keep return values unchanged: failed API calls still return `None` and analyzer still falls back locally.
4. Run `docker compose run --rm backend pytest -q`.

## Milestone 3: Frontend Refactor Without Behavior Change

### Task 6: Extract Shared Types

**Files:**
- Create: `frontend/src/types.ts`
- Modify: `frontend/src/main.tsx`

**Steps:**
1. Move TypeScript interfaces and union types from `main.tsx` into `types.ts`.
2. Import them with `import type`.
3. Run `docker compose run --rm frontend npm run build`.

### Task 7: Extract API Client

**Files:**
- Create: `frontend/src/api.ts`
- Modify: `frontend/src/main.tsx`

**Steps:**
1. Move `API_BASE_URL` and fetch helpers into `api.ts`.
2. Add one `requestJson` helper that throws a clear `Error` for non-2xx responses.
3. Preserve current endpoints and payload shapes.
4. Run `docker compose run --rm frontend npm run build`.

### Task 8: Extract Markdown Exporters

**Files:**
- Create: `frontend/src/exportMarkdown.ts`
- Modify: `frontend/src/main.tsx`

**Steps:**
1. Move Markdown construction helpers into `exportMarkdown.ts`.
2. Keep exported Markdown content unchanged.
3. Run `powershell -ExecutionPolicy Bypass -File scripts/check-markdown-quality.ps1` against a running backend.
4. Run `docker compose run --rm frontend npm run build`.

## Milestone 4: UX Safety Polish

### Task 9: Confirm Report Delete

**Files:**
- Modify: `frontend/src/main.tsx`
- Modify: `scripts/check-accessibility.ps1`

**Steps:**
1. Add a confirmation before deleting a report from history.
2. Ensure the delete button has a clear accessible label.
3. Update the static accessibility check if needed.
4. Run `powershell -ExecutionPolicy Bypass -File scripts/check-accessibility.ps1`.
5. Run `docker compose run --rm frontend npm run build`.

### Task 10: Add Import Success Feedback

**Files:**
- Modify: `frontend/src/main.tsx`

**Steps:**
1. Add a visible status message after JSON import reports imported/skipped counts.
2. Keep errors in the existing error path.
3. Run `docker compose run --rm frontend npm run build`.

## Milestone 5: Full Verification

### Task 11: Run Full Local Gate

**Files:**
- No code changes expected.

**Steps:**
1. Run `powershell -ExecutionPolicy Bypass -File scripts/reset-demo.ps1`.
2. Run `powershell -ExecutionPolicy Bypass -File scripts/smoke.ps1`.
3. Open `http://localhost:3000`.
4. Analyze `docs/sample-resume.txt` with a target JD.
5. Verify report tabs, export buttons, history, tracker, matrix, and comparison still work.

## Recommended Commit Order

1. `docs: add jobfit development guide`
2. `chore: lock frontend dependencies`
3. `fix: guard resume upload size`
4. `chore: log ai fallback failures`
5. `refactor: split frontend types and api client`
6. `refactor: extract markdown exporters`
7. `fix: add safer report actions`
