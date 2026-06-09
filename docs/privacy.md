# JobFit RAG Privacy And Trust

JobFit RAG handles resume text, job descriptions, and application notes. Those are private career documents, so the project keeps the default path local and inspectable.

## Default Data Path

By default, the app runs without external AI calls:

1. The browser sends resume and JD text to the local FastAPI backend.
2. The deterministic analyzer creates the report locally.
3. Reports and applications are saved in `./data/jobfit.sqlite3`.
4. Markdown and JSON exports are created from local report data.

The `data/` directory is ignored by git so local reports are not committed by default.

## Optional API Path

OpenAI-compatible API calls are optional.

They are used only when `OPENAI_API_KEY` is configured. If the key is empty or an API request fails, the backend returns a complete deterministic report instead.

The API path can refine semantic scoring and wording, but it is not required for normal use, demo reset, smoke verification, or portfolio exports.

## Secrets

Secrets are kept out of source control:

- `.env` is ignored by git.
- `.env.example` contains only empty placeholders and default model names.
- `docker-compose.yml` reads API settings from environment variables.
- `scripts/smoke.ps1` includes a local secret scan for common API key and bearer token patterns, redacts raw matches from failure output, and redacts failed child-script output before reporting smoke failures.
- Frontend API failures show status-only messages instead of raw backend response bodies, so validation details do not echo resume or JD text in the browser.
- Local verification scripts redact HTTP response bodies and assertion values in failure messages where those values may be derived from resume or JD content.

Do not paste real API keys into README, docs, tests, screenshots, issue text, or exported demo artifacts.

## Local Files

| Path | Purpose | Git behavior |
| --- | --- | --- |
| `.env` | Optional local API configuration | ignored |
| `.env.example` | Safe configuration template | tracked |
| `data/jobfit.sqlite3` | Local SQLite reports and applications | ignored |
| `data/jobfit.sqlite3.bak-*` | Reset backups created by `reset-demo.ps1` | ignored through `data/` |
| exported Markdown / JSON | User-created report artifacts | not automatically tracked |

## Reset And Export

`scripts/reset-demo.ps1` backs up the current SQLite file, deletes only the project database file, starts Docker Compose, and seeds stable demo data through the public API. For Docker-free local debugging, `scripts/reset-demo.ps1 -NoDocker -NoSeed` only backs up/removes `./data/jobfit.sqlite3` and does not start services or seed through the API.

`GET /api/reports-export` creates a JSON bundle from local reports. Treat this file as private if it contains real resume or job-search data.

## Interview Talking Point

```text
I designed the app so the safe default is local and deterministic. Tokens are an optional enhancement, not a dependency. Resume data stays in a git-ignored SQLite file, .env is ignored, API errors avoid raw private payload echoes, and the smoke/local verification scripts redact secret matches and private failure details before I share the project.
```
