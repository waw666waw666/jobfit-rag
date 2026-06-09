from __future__ import annotations

BROAD_CHINESE_ALIASES = {"向量", "数据库", "接口", "测试"}

SKILL_CATALOG: dict[str, tuple[str, list[str]]] = {
    "React": ("frontend", ["react", "jsx", "tsx"]),
    "TypeScript": ("frontend", ["typescript", "ts"]),
    "JavaScript": ("frontend", ["javascript", "js"]),
    "Vue": ("frontend", ["vue", "vue.js"]),
    "Next.js": ("frontend", ["next.js", "nextjs", "next"]),
    "Node.js": ("backend", ["node.js", "nodejs", "node"]),
    "Python": ("backend", ["python"]),
    "FastAPI": ("backend", ["fastapi"]),
    "Java": ("backend", ["java"]),
    "Spring Boot": ("backend", ["spring boot", "springboot"]),
    "SQL": ("data", ["sql"]),
    "SQLite": ("data", ["sqlite"]),
    "PostgreSQL": ("data", ["postgresql", "postgres"]),
    "Docker": ("devops", ["docker", "dockerized", "docker compose", "docker-compose", "容器化", "容器化部署"]),
    "Git": ("devops", ["git", "github"]),
    "CI/CD": ("devops", ["ci/cd", "github actions", "pipeline"]),
    "REST API": ("backend", ["rest api", "restful", "api", "接口设计", "接口开发", "接口集成", "接口联调"]),
    "RAG": ("ai", ["rag", "retrieval augmented generation", "检索增强", "检索增强生成"]),
    "LLM": ("ai", ["llm", "large language model", "大模型"]),
    "Embedding": ("ai", ["embedding", "embeddings", "向量化", "向量表示", "文本向量", "语义向量", "embedding 模型"]),
    "Vector Search": ("ai", ["vector search", "vector database", "向量检索", "向量召回", "语义检索"]),
    "Prompt Engineering": ("ai", ["prompt engineering", "prompt", "提示词"]),
    "Testing": ("engineering", ["test", "testing", "pytest", "playwright", "unit test", "自动化测试", "单元测试", "测试覆盖", "测试用例"]),
    "Auth": ("backend", ["auth", "authentication", "jwt", "oauth"]),
}
