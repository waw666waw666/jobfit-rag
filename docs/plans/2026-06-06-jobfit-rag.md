# JobFit RAG Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Dockerized local-first AI resume and job description analyzer that produces an actionable job-fit report.

**Architecture:** The app runs with Docker Compose using a Vite React frontend and a FastAPI backend. SQLite stores analysis records in a mounted local data volume, while lightweight text embeddings and cosine similarity provide evidence matching before optional API-based LLM refinement.

**Tech Stack:** React, TypeScript, Vite, FastAPI, Pydantic, SQLite, Docker Compose, OpenAI-compatible environment variables.

---

### Task 1: Project Scaffold

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `frontend/Dockerfile`
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/styles.css`
- Create: `backend/Dockerfile`
- Create: `backend/requirements.txt`
- Create: `backend/app/main.py`
- Create: `backend/app/models.py`
- Create: `backend/app/analyzer.py`
- Create: `backend/app/storage.py`
- Create: `backend/tests/test_analyzer.py`
- Create: `README.md`

**Steps:**
1. Create Docker-first folder structure.
2. Add frontend and backend Dockerfiles.
3. Add Docker Compose services for frontend and backend only.
4. Add `.env.example` with API variables but no secrets.
5. Add basic health endpoint and frontend shell.

### Task 2: Backend Analysis Core

**Files:**
- Modify: `backend/app/models.py`
- Modify: `backend/app/analyzer.py`
- Test: `backend/tests/test_analyzer.py`

**Steps:**
1. Write tests for extracting skills from resume/JD text.
2. Verify tests fail before implementation.
3. Implement deterministic skill extraction and similarity.
4. Generate report fields: score, matched skills, missing skills, evidence, suggestions, bullets, interview questions.
5. Run tests until green.

### Task 3: Backend API and Persistence

**Files:**
- Modify: `backend/app/main.py`
- Modify: `backend/app/storage.py`
- Create: `backend/tests/test_api.py`

**Steps:**
1. Add `/health`.
2. Add `POST /api/analyze`.
3. Add `GET /api/reports`.
4. Add `GET /api/reports/{id}`.
5. Persist reports in SQLite under `/app/data/jobfit.sqlite3`.
6. Run backend tests.

### Task 4: Frontend Workflow

**Files:**
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/styles.css`

**Steps:**
1. Build single-page app with resume and JD text areas.
2. Call backend analyze endpoint.
3. Render score, skills, gaps, evidence, suggestions, bullets, and interview questions.
4. Add Markdown export from the generated report.
5. Add loading and error states.

### Task 5: Docs and Verification

**Files:**
- Modify: `README.md`
- Create: `docs/demo-script.md`
- Create: `docs/architecture.md`

**Steps:**
1. Document Docker Compose setup.
2. Document API env vars.
3. Add demo script and sample resume/JD.
4. Add portfolio resume bullets.
5. Verify no secrets are present.
6. Run `docker compose up --build`.
7. Verify frontend, backend health, and sample analysis.
