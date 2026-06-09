# ADR 0002: Do Not Add A Vector Database In V1

## Status

Accepted

## Context

The current product compares one resume with one target JD. It does not search across a large document corpus. Adding Chroma, Qdrant, Pinecone, Weaviate, or another vector store would add runtime weight, setup friction, and data-management complexity.

## Decision

Do not add a vector database in v1.

Use deterministic skill extraction, local text similarity, structure checks, evidence trace generation, and optional embedding similarity through OpenAI-compatible APIs.

## Consequences

- The project should be described as RAG-style or evidence-grounded, not as a traditional vector-database RAG platform.
- Runtime stays small and laptop-friendly.
- The analyzer stays explainable and easy to test.
- If the scope expands to many resumes, many JDs, saved company documents, or reusable knowledge corpora, reopen this decision.

## Verification

- README and demo talk track should avoid claiming vector DB retrieval.
- Architecture docs should state why no vector database is used.
- Tests should focus on report correctness, evidence quality, fallback behavior, and exported artifacts.
