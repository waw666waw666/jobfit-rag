# ADR 0003: Make Deterministic Fallback The Product Default

## Status

Accepted

## Context

The app must work during local demos, CI, and offline or no-token environments. Optional AI calls can improve wording and semantic scoring, but a failed API call should not block a user from getting a useful report.

## Decision

Deterministic local analysis is the default product path. API calls are optional refinements.

If `OPENAI_API_KEY` is empty, the app uses local analysis. If API calls fail, the app logs fixed warning messages and returns a complete fallback report.

## Consequences

- Users can run the app without paid services.
- CI and demo flows do not require secrets.
- The scoring and report structure remain inspectable.
- API refinement must not be documented as a hard dependency.

## Verification

- `api_mode` reports `local_fallback`, `api_refinement_enabled`, or `api_failed_fallback`.
- API failure logs do not contain resume text, JD text, API keys, or Authorization headers.
- Local verification passes without API keys.
