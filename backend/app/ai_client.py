from __future__ import annotations

import json
import logging
import os

import httpx


API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4.1-mini")
EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
logger = logging.getLogger(__name__)


def ai_enabled() -> bool:
    return bool(API_KEY)


def embed_texts(texts: list[str]) -> list[list[float]] | None:
    if not ai_enabled():
        return None
    try:
        with httpx.Client(timeout=30) as client:
            response = client.post(
                f"{BASE_URL}/embeddings",
                headers=_headers(),
                json={"model": EMBEDDING_MODEL, "input": texts},
            )
            response.raise_for_status()
            data = response.json()["data"]
            return [item["embedding"] for item in data]
    except Exception:
        logger.warning("Embedding API request failed; using local fallback.")
        return None


def embedding_mode_for(texts: list[str]) -> tuple[list[list[float]] | None, str]:
    if not ai_enabled():
        return None, "local_fallback"
    embeddings = embed_texts(texts)
    if embeddings:
        return embeddings, "api_refinement_enabled"
    return None, "api_failed_fallback"


def refine_report(
    resume_text: str,
    jd_text: str,
    matched_skills: list[str],
    missing_skills: list[str],
) -> dict[str, list[str]] | None:
    if not ai_enabled():
        return None
    prompt = {
        "resume_excerpt": resume_text[:3000],
        "jd_excerpt": jd_text[:3000],
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
    }
    try:
        with httpx.Client(timeout=45) as client:
            response = client.post(
                f"{BASE_URL}/chat/completions",
                headers=_headers(),
                json={
                    "model": CHAT_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "Return strict JSON with keys resume_suggestions, "
                                "optimized_bullets, interview_questions. Each value is an array "
                                "of concise strings for a job seeker."
                            ),
                        },
                        {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
                    ],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"},
                },
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return {
                "resume_suggestions": _list_of_strings(parsed.get("resume_suggestions")),
                "optimized_bullets": _list_of_strings(parsed.get("optimized_bullets")),
                "interview_questions": _list_of_strings(parsed.get("interview_questions")),
            }
    except Exception:
        logger.warning("Chat refinement API request failed; using deterministic fallback.")
        return None


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }


def _list_of_strings(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, str) and item.strip()]
