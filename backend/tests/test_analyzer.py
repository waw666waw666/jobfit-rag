from app.analyzer import analyze_job_fit, analyze_resume_structure, cosine_similarity, extract_skills
from app import ai_client
from app.skills import BROAD_CHINESE_ALIASES, SKILL_CATALOG


def test_extract_skills_detects_common_terms():
    text = "Built React and TypeScript apps with Docker, FastAPI, RAG, and embeddings."

    skills = extract_skills(text)

    assert "React" in skills
    assert "TypeScript" in skills
    assert "Docker" in skills
    assert "FastAPI" in skills
    assert "RAG" in skills
    assert "Embedding" in skills


def test_extract_skills_detects_conservative_chinese_aliases():
    text = "负责检索增强生成、向量化表示、向量检索、容器化部署、自动化测试和接口设计。"

    skills = extract_skills(text)

    assert {"RAG", "Embedding", "Vector Search", "Docker", "Testing", "REST API"}.issubset(set(skills))


def test_vector_search_chinese_alias_does_not_imply_embedding():
    skills = extract_skills("负责向量检索和语义检索召回。")

    assert "Vector Search" in skills
    assert "Embedding" not in skills


def test_skill_catalog_entries_are_valid():
    names = list(SKILL_CATALOG)

    assert len(names) == len(set(names))
    for name, (category, aliases) in SKILL_CATALOG.items():
        assert name.strip()
        assert category.strip()
        assert isinstance(aliases, list)
        assert aliases
        assert all(isinstance(alias, str) and alias.strip() for alias in aliases)


def test_skill_catalog_rejects_overbroad_chinese_aliases():
    aliases = {alias for _, aliases in SKILL_CATALOG.values() for alias in aliases}

    assert aliases.isdisjoint(BROAD_CHINESE_ALIASES)


def test_analyze_job_fit_returns_missing_and_matched_skills():
    resume = "I built React TypeScript dashboards and Dockerized FastAPI services."
    jd = "We need React, TypeScript, Docker, RAG, Embedding, and PostgreSQL experience."

    report = analyze_job_fit(resume, jd)

    assert report.overall_score > 0
    assert {"React", "TypeScript", "Docker"}.issubset(set(report.matched_skills))
    assert {"RAG", "Embedding", "PostgreSQL"}.issubset(set(report.missing_skills))
    assert report.resume_suggestions
    assert report.optimized_bullets
    assert report.interview_questions


def test_chinese_resume_jd_tracks_matched_missing_and_proof_plan():
    resume = """
    张三 zhangsan@example.com
    简介
    AI 应用开发者。
    技能
    检索增强生成、向量化表示、容器化部署、接口集成。
    项目
    负责一个本地优先求职分析工具，提升简历复盘效率 35%。
    """
    jd = """
    岗位要求
    熟悉检索增强生成、向量化表示、向量检索、容器化部署、自动化测试、接口设计和 SQL。
    """

    report = analyze_job_fit(resume, jd)

    assert {"RAG", "Embedding", "Docker", "REST API"}.issubset(set(report.matched_skills))
    assert {"Vector Search", "Testing", "SQL"}.issubset(set(report.missing_skills))
    assert report.evidence_trace

    proof_by_skill = {item.skill: item for item in report.proof_plan}
    assert {"Vector Search", "Testing", "SQL"}.issubset(set(proof_by_skill))
    assert proof_by_skill["Vector Search"].risk_level == "missing"
    assert proof_by_skill["Testing"].acceptance_check


def test_cosine_similarity_is_higher_for_related_text():
    related = cosine_similarity("React TypeScript Docker", "React TypeScript frontend Docker")
    unrelated = cosine_similarity("React TypeScript Docker", "cooking travel music")

    assert related > unrelated


def test_analyzer_works_without_api_key(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "")

    report = analyze_job_fit(
        "React TypeScript Docker FastAPI project with SQLite.",
        "Need React TypeScript Docker FastAPI RAG Embedding SQL.",
    )

    assert report.summary
    assert report.resume_suggestions
    assert report.optimized_bullets
    assert report.interview_questions


def test_embedding_failure_logs_warning_without_sensitive_content(monkeypatch, caplog):
    monkeypatch.setattr(ai_client, "API_KEY", "test-secret-key")
    monkeypatch.setattr(ai_client, "BASE_URL", "http://example.invalid")

    class FailingClient:
        def __init__(self, timeout):
            self.timeout = timeout

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

        def post(self, *args, **kwargs):
            raise RuntimeError(f"network down {kwargs}")

    monkeypatch.setattr(ai_client.httpx, "Client", FailingClient)

    with caplog.at_level("WARNING", logger="app.ai_client"):
        assert ai_client.embed_texts(["resume secret content", "jd secret content"]) is None

    log_text = caplog.text
    assert "Embedding API request failed; using local fallback." in log_text
    assert "resume secret content" not in log_text
    assert "jd secret content" not in log_text
    assert "test-secret-key" not in log_text
    assert "Authorization" not in log_text


def test_refine_failure_logs_warning_without_sensitive_content(monkeypatch, caplog):
    monkeypatch.setattr(ai_client, "API_KEY", "test-secret-key")
    monkeypatch.setattr(ai_client, "BASE_URL", "http://example.invalid")

    class FailingClient:
        def __init__(self, timeout):
            self.timeout = timeout

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

        def post(self, *args, **kwargs):
            raise RuntimeError(f"network down {kwargs}")

    monkeypatch.setattr(ai_client.httpx, "Client", FailingClient)

    with caplog.at_level("WARNING", logger="app.ai_client"):
        assert ai_client.refine_report(
            "resume secret content",
            "jd secret content",
            ["React"],
            ["SQL"],
        ) is None

    log_text = caplog.text
    assert "Chat refinement API request failed; using deterministic fallback." in log_text
    assert "resume secret content" not in log_text
    assert "jd secret content" not in log_text
    assert "test-secret-key" not in log_text
    assert "Authorization" not in log_text


def test_structure_analysis_detects_resume_sections():
    resume = """
    Jane Doe jane@example.com

    Summary
    AI application developer focused on local-first tools.

    Skills
    React, TypeScript, FastAPI, Docker, RAG

    Experience
    Built a job-fit analyzer that improved review speed by 35%.
    """

    structure = analyze_resume_structure(resume)

    assert structure.contact_info.detected is True
    assert structure.summary_section.detected is True
    assert structure.skills_section.detected is True
    assert structure.experience_evidence.detected is True
    assert structure.measurable_impact.detected is True


def test_report_includes_component_scores_and_api_mode():
    report = analyze_job_fit(
        "Jane jane@example.com Summary React TypeScript Docker FastAPI built tools.",
        "Need React TypeScript Docker FastAPI RAG Embedding SQL.",
    )

    assert 0 <= report.score_breakdown.keyword_score <= 100
    assert 0 <= report.score_breakdown.semantic_score <= 100
    assert 0 <= report.score_breakdown.structure_score <= 100
    assert report.api_mode in {"local_fallback", "api_refinement_enabled", "api_failed_fallback"}
    assert report.structure.contact_info.label


def test_report_includes_learning_plan_for_missing_skills():
    report = analyze_job_fit(
        "Jane jane@example.com Summary React TypeScript Docker FastAPI project.",
        "Need React TypeScript Docker FastAPI RAG Embedding SQL Testing.",
    )

    assert len(report.learning_plan) == 7
    assert report.learning_plan[0].day == 1
    assert report.learning_plan[0].focus
    assert report.learning_plan[0].deliverable
    assert any("RAG" in item.focus or "Embedding" in item.focus or "SQL" in item.focus for item in report.learning_plan)


def test_report_scores_resume_bullets_with_rubric():
    resume = """
    Summary
    AI developer.

    Experience
    Built React FastAPI tool using Docker that reduced review time by 35%.
    Worked on dashboards.
    """

    report = analyze_job_fit(resume, "Need React FastAPI Docker testing.")

    assert report.bullet_scores
    assert report.bullet_scores[0].score > report.bullet_scores[-1].score
    assert report.bullet_scores[0].has_action is True
    assert report.bullet_scores[0].has_metric is True
    assert report.bullet_scores[-1].suggestion


def test_report_includes_evidence_trace_tailored_draft_and_case_study():
    report = analyze_job_fit(
        """
        Jane jane@example.com
        Summary
        AI app developer.
        Skills
        React TypeScript Docker FastAPI RAG
        Projects
        Built a Dockerized resume analyzer using React and FastAPI that reduced review time by 35%.
        """,
        "Need React TypeScript Docker FastAPI RAG SQL Testing and clear product thinking.",
    )

    assert report.evidence_trace
    assert report.evidence_trace[0].skill
    assert report.evidence_trace[0].status in {"matched", "missing"}
    assert report.evidence_trace[0].recommendation
    assert report.tailored_resume.summary
    assert report.tailored_resume.skills
    assert report.tailored_resume.bullets
    assert report.tailored_resume.integrity_note
    assert report.case_study.problem
    assert report.case_study.solution
    assert report.case_study.tradeoffs
    assert report.case_study.demo_talk_track


def test_tailored_resume_skills_do_not_claim_missing_skills():
    report = analyze_job_fit(
        "Jane jane@example.com Summary React TypeScript Docker FastAPI project.",
        "Need React TypeScript Docker FastAPI RAG Embedding SQL Testing.",
    )

    assert set(report.tailored_resume.skills).issubset(set(report.matched_skills))
    assert set(report.tailored_resume.skills).isdisjoint(set(report.missing_skills))


def test_evidence_trace_scores_direct_weak_and_missing_evidence():
    report = analyze_job_fit(
        """
        Jane jane@example.com
        Summary
        Developer using React.
        Projects
        Built a React dashboard with TypeScript and Docker that reduced reporting time by 35%.
        """,
        "Need React TypeScript Docker FastAPI.",
    )

    by_skill = {item.skill: item for item in report.evidence_trace}

    assert by_skill["React"].quality == "direct"
    assert by_skill["React"].quality_score >= 80
    assert by_skill["TypeScript"].quality in {"direct", "weak"}
    assert by_skill["FastAPI"].quality == "missing"
    assert by_skill["FastAPI"].quality_score == 0


def test_report_includes_interview_pack_with_star_answers_and_risks():
    report = analyze_job_fit(
        """
        Jane jane@example.com
        Summary
        AI application developer.
        Projects
        Built a Dockerized React FastAPI job-fit analyzer that reduced resume review time by 35%.
        """,
        "Need React FastAPI Docker RAG SQL Testing and clear product thinking.",
    )

    assert report.interview_pack.positioning_statement
    assert len(report.interview_pack.star_answers) >= 2
    first = report.interview_pack.star_answers[0]
    assert first.skill
    assert first.situation
    assert first.task
    assert first.action
    assert first.result
    assert report.interview_pack.risk_notes
    assert any("SQL" in note or "Testing" in note or "RAG" in note for note in report.interview_pack.risk_notes)
    assert report.interview_pack.close_pitch


def test_report_includes_proof_plan_for_missing_and_weak_evidence():
    report = analyze_job_fit(
        """
        Jane jane@example.com
        Summary
        AI application developer using React and RAG.
        Projects
        Built a React job-fit analyzer that reduced resume review time by 35%.
        """,
        "Need React RAG SQL Testing and clear proof artifacts.",
    )

    assert report.proof_plan
    by_skill = {item.skill: item for item in report.proof_plan}

    assert "SQL" in by_skill
    assert by_skill["SQL"].risk_level == "missing"
    assert by_skill["SQL"].proof_artifact
    assert by_skill["SQL"].small_task
    assert by_skill["SQL"].acceptance_check
    assert 1 <= by_skill["SQL"].estimated_days <= 7

    assert "RAG" in by_skill
    assert by_skill["RAG"].risk_level in {"weak", "missing"}
    assert by_skill["RAG"].proof_artifact


def test_report_includes_portfolio_readiness_score_and_next_action():
    strong = analyze_job_fit(
        """
        Jane jane@example.com
        Summary
        AI application developer focused on local-first tools.
        Skills
        React TypeScript Docker FastAPI RAG SQL Testing
        Projects
        Built a Dockerized React FastAPI RAG analyzer with SQL persistence and pytest coverage that reduced resume review time by 35%.
        """,
        "Need React TypeScript Docker FastAPI RAG SQL Testing and clear product thinking.",
    )
    weak = analyze_job_fit(
        "Jane jane@example.com Summary Developer using React.",
        "Need React TypeScript Docker FastAPI RAG SQL Testing and clear product thinking.",
    )

    assert 0 <= strong.portfolio_readiness.score <= 100
    assert strong.portfolio_readiness.level in {"draft", "almost_ready", "ready"}
    assert strong.portfolio_readiness.strengths
    assert strong.portfolio_readiness.next_best_action
    assert weak.portfolio_readiness.blockers
    assert strong.portfolio_readiness.score > weak.portfolio_readiness.score


def test_report_includes_action_board_prioritized_from_proof_and_bullet_gaps():
    report = analyze_job_fit(
        """
        Jane jane@example.com
        Summary
        AI application developer using React and RAG.
        Projects
        Built a React job-fit analyzer that reduced resume review time by 35%.
        Worked on dashboards.
        """,
        "Need React RAG SQL Testing and clear proof artifacts.",
    )

    assert report.action_board
    first = report.action_board[0]
    assert first.priority == "high"
    assert first.source == "proof_plan"
    assert first.title
    assert first.skill in {"SQL", "Testing"}
    assert first.reason
    assert first.acceptance_check
    assert 1 <= first.estimated_days <= 7

    sources = {item.source for item in report.action_board}
    assert "proof_plan" in sources
    assert "bullet_score" in sources
    assert any(item.priority == "medium" for item in report.action_board)


def test_action_board_keeps_readiness_blocker_when_many_actions_exist():
    resume = """
    Jane jane@example.com
    Summary
    Developer using React.
    Projects
    Worked on dashboard alpha.
    Worked on dashboard beta.
    Worked on dashboard gamma.
    Worked on dashboard delta.
    Worked on dashboard epsilon.
    Worked on dashboard zeta.
    Worked on dashboard eta.
    Worked on dashboard theta.
    """
    jd = "Need React TypeScript Docker FastAPI RAG Embedding SQL Testing Vector Search PostgreSQL CI/CD Auth."

    report = analyze_job_fit(resume, jd)

    assert len(report.action_board) <= 12
    assert any(item.source == "readiness" for item in report.action_board)


def test_report_includes_portfolio_case_study_export_for_readme_storytelling():
    report = analyze_job_fit(
        """
        Jane jane@example.com
        Summary
        AI application developer focused on local-first tools.
        Skills
        React TypeScript Docker FastAPI RAG SQL Testing
        Projects
        Built a Dockerized React FastAPI RAG analyzer with SQL persistence and pytest coverage that reduced resume review time by 35%.
        """,
        "Need React TypeScript Docker FastAPI RAG SQL Testing and clear product thinking.",
    )

    export = report.portfolio_export

    assert "JobFit RAG" in export.headline
    assert export.problem == report.case_study.problem
    assert export.solution == report.case_study.solution
    assert export.architecture == report.case_study.architecture
    assert export.tradeoffs == report.case_study.tradeoffs
    assert export.proof_artifacts
    assert str(report.portfolio_readiness.score) in export.readiness_summary
    assert export.next_actions
    assert export.resume_bullet
    assert "Docker" in export.resume_bullet or "FastAPI" in export.resume_bullet
