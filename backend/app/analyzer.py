from __future__ import annotations

import math
import re
import uuid
from collections import Counter
from datetime import datetime, timezone

from .ai_client import embedding_mode_for, refine_report
from .models import (
    ActionBoardItem,
    AnalysisReport,
    BulletScore,
    CaseStudy,
    EvidenceItem,
    EvidenceTraceItem,
    InterviewPack,
    JobRequirement,
    LearningPlanItem,
    PortfolioReadiness,
    PortfolioExport,
    ProofPlanItem,
    ResumeMatrixReport,
    ResumeVersionInput,
    ResumeVersionMatrixItem,
    ScoreBreakdown,
    StarAnswer,
    StructureAnalysis,
    StructureSignal,
    TailoredResumeDraft,
)
from .skills import SKILL_CATALOG

STOPWORDS = {
    "and",
    "the",
    "for",
    "with",
    "that",
    "this",
    "you",
    "are",
    "from",
    "will",
    "have",
    "has",
    "using",
    "able",
    "your",
    "our",
    "工作",
    "经验",
    "负责",
    "项目",
    "能力",
    "熟悉",
    "掌握",
}


def extract_skills(text: str) -> list[str]:
    normalized = text.lower()
    found: list[str] = []
    for skill, (_, aliases) in SKILL_CATALOG.items():
        for alias in aliases:
            if _contains_term(normalized, alias.lower()):
                found.append(skill)
                break
    return sorted(found)


def analyze_job_fit(resume_text: str, jd_text: str) -> AnalysisReport:
    resume_skills = set(extract_skills(resume_text))
    jd_skills = set(extract_skills(jd_text))
    matched = sorted(resume_skills & jd_skills)
    missing = sorted(jd_skills - resume_skills)
    structure = analyze_resume_structure(resume_text)
    score_breakdown, api_mode = _score_breakdown(matched, missing, resume_text, jd_text, structure)
    score = _final_score(score_breakdown)

    requirements = [
        JobRequirement(name=skill, category=SKILL_CATALOG[skill][0], importance="required")
        for skill in sorted(jd_skills)
    ]
    evidence = _build_evidence(matched, missing, resume_text, jd_text)
    suggestions = _build_suggestions(missing, matched)
    bullets = _build_bullets(matched, missing)
    questions = _build_questions(missing, matched)
    learning_plan = _build_learning_plan(missing, matched)
    bullet_scores = score_resume_bullets(resume_text)
    evidence_trace = _build_evidence_trace(matched, missing, resume_text, jd_text)
    proof_plan = _build_proof_plan(evidence_trace)
    tailored_resume = _build_tailored_resume(matched, missing, bullets)
    case_study = _build_case_study(score, matched, missing)
    interview_pack = _build_interview_pack(score, matched, missing, evidence_trace, case_study)
    portfolio_readiness = _build_portfolio_readiness(score, evidence_trace, proof_plan, bullet_scores, case_study, interview_pack)
    action_board = _build_action_board(proof_plan, bullet_scores, portfolio_readiness)
    portfolio_export = _build_portfolio_export(case_study, portfolio_readiness, action_board, proof_plan, bullets, matched, missing)
    refinement = refine_report(resume_text, jd_text, matched, missing)
    if refinement:
        api_mode = "api_refinement_enabled"
        suggestions = refinement["resume_suggestions"] or suggestions
        bullets = refinement["optimized_bullets"] or bullets
        tailored_resume = _build_tailored_resume(matched, missing, bullets)
        questions = refinement["interview_questions"] or questions
    elif api_mode == "api_refinement_enabled":
        api_mode = "api_failed_fallback"

    return AnalysisReport(
        id=str(uuid.uuid4()),
        created_at=datetime.now(timezone.utc),
        overall_score=score,
        score_breakdown=score_breakdown,
        api_mode=api_mode,
        structure=structure,
        summary=_summary(score, matched, missing),
        matched_skills=matched,
        missing_skills=missing,
        job_requirements=requirements,
        evidence=evidence,
        resume_suggestions=suggestions,
        optimized_bullets=bullets,
        interview_questions=questions,
        learning_plan=learning_plan,
        proof_plan=proof_plan,
        bullet_scores=bullet_scores,
        evidence_trace=evidence_trace,
        tailored_resume=tailored_resume,
        case_study=case_study,
        interview_pack=interview_pack,
        portfolio_readiness=portfolio_readiness,
        action_board=action_board,
        portfolio_export=portfolio_export,
    )


def compare_resume_versions(versions: list[ResumeVersionInput], jd_text: str) -> ResumeMatrixReport:
    reports = [(version.label, analyze_job_fit(version.resume_text, jd_text)) for version in versions]
    baseline_skills = set(reports[0][1].matched_skills)
    items: list[ResumeVersionMatrixItem] = []
    for label, report in reports:
        matched = set(report.matched_skills)
        items.append(
            ResumeVersionMatrixItem(
                label=label,
                overall_score=report.overall_score,
                readiness_score=report.portfolio_readiness.score,
                matched_skills=report.matched_skills,
                missing_skills=report.missing_skills,
                gained_skills=sorted(matched - baseline_skills),
                remaining_gaps=report.missing_skills,
                next_best_action=report.portfolio_readiness.next_best_action,
            )
        )

    best = max(items, key=lambda item: (item.overall_score, item.readiness_score, len(item.matched_skills)))
    baseline_score = items[0].overall_score
    recommendations = _build_matrix_recommendations(items, best)
    return ResumeMatrixReport(
        jd_summary=_matrix_jd_summary(jd_text),
        best_version=best.label,
        score_delta=best.overall_score - baseline_score,
        versions=items,
        recommendations=recommendations,
    )


def _build_matrix_recommendations(items: list[ResumeVersionMatrixItem], best: ResumeVersionMatrixItem) -> list[str]:
    recommendations = [
        f"Use '{best.label}' as the strongest current resume version for this JD.",
        f"Keep matched skills visible near the top: {', '.join(best.matched_skills[:5]) or 'none yet'}.",
    ]
    if best.remaining_gaps:
        recommendations.append("Build or document proof for remaining gaps: " + ", ".join(best.remaining_gaps[:5]) + ".")
    gained = [skill for item in items[1:] for skill in item.gained_skills]
    if gained:
        recommendations.append("The tailored versions improved JD coverage by adding: " + ", ".join(sorted(set(gained))[:6]) + ".")
    recommendations.append(best.next_best_action)
    return recommendations


def _matrix_jd_summary(jd_text: str) -> str:
    skills = extract_skills(jd_text)
    if skills:
        return "Target JD asks for: " + ", ".join(skills[:8]) + "."
    return jd_text.strip()[:160]


def cosine_similarity(text_a: str, text_b: str) -> float:
    tokens_a = _tokens(text_a)
    tokens_b = _tokens(text_b)
    if not tokens_a or not tokens_b:
        return 0.0
    a = Counter(tokens_a)
    b = Counter(tokens_b)
    common = set(a) & set(b)
    numerator = sum(a[token] * b[token] for token in common)
    denom_a = math.sqrt(sum(value * value for value in a.values()))
    denom_b = math.sqrt(sum(value * value for value in b.values()))
    return numerator / (denom_a * denom_b) if denom_a and denom_b else 0.0


def analyze_resume_structure(text: str) -> StructureAnalysis:
    lowered = text.lower()
    contact = bool(re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text) or re.search(r"\+?\d[\d\s().-]{7,}", text))
    summary = bool(re.search(r"\b(summary|profile|objective|简介|总结|个人优势)\b", lowered))
    skills = bool(re.search(r"\b(skills|technical skills|tech stack|技能|技术栈)\b", lowered))
    experience = bool(re.search(r"\b(experience|work history|project|projects|built|developed|led|项目|经历|负责)\b", lowered))
    impact = bool(re.search(r"(\d+%|\$\d+|\b\d+x\b|\b\d+\s*(users|requests|ms|seconds|hours|days)\b|提升|降低|增长)", lowered))

    return StructureAnalysis(
        contact_info=_signal("contact_info", "Contact info", contact, "Email or phone detected." if contact else "Add email or phone near the top."),
        summary_section=_signal("summary_section", "Summary section", summary, "Summary/profile section detected." if summary else "Add a short target-role summary."),
        skills_section=_signal("skills_section", "Skills section", skills, "Skills section detected." if skills else "Add a clear skills or tech stack section."),
        experience_evidence=_signal("experience_evidence", "Project or experience evidence", experience, "Project or work evidence detected." if experience else "Add project or experience evidence."),
        measurable_impact=_signal("measurable_impact", "Measurable impact", impact, "Metrics or impact numbers detected." if impact else "Add measurable results such as %, users, latency, or time saved."),
    )


def score_resume_bullets(text: str) -> list[BulletScore]:
    candidates = _resume_bullet_candidates(text)
    return [_score_bullet(candidate) for candidate in candidates[:8]]


def _contains_term(text: str, term: str) -> bool:
    if re.search(r"[\u4e00-\u9fff]", term):
        return term in text
    return re.search(rf"(?<![a-z0-9+#]){re.escape(term)}(?![a-z0-9+#])", text) is not None


def _tokens(text: str) -> list[str]:
    raw = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.]{1,}|[\u4e00-\u9fff]{2,}", text.lower())
    return [token for token in raw if token not in STOPWORDS]


def _score_breakdown(
    matched: list[str],
    missing: list[str],
    resume_text: str,
    jd_text: str,
    structure: StructureAnalysis,
) -> tuple[ScoreBreakdown, str]:
    coverage = len(matched) / max(1, len(matched) + len(missing))
    semantic, api_mode = _semantic_similarity(resume_text, jd_text)
    structure_score = _structure_score(structure)
    return (
        ScoreBreakdown(
            keyword_score=_clamp_score(coverage * 100),
            semantic_score=_clamp_score(semantic * 100),
            structure_score=structure_score,
        ),
        api_mode,
    )


def _final_score(score: ScoreBreakdown) -> int:
    return _clamp_score(score.keyword_score * 0.55 + score.semantic_score * 0.25 + score.structure_score * 0.20)


def _semantic_similarity(resume_text: str, jd_text: str) -> tuple[float, str]:
    embeddings, mode = embedding_mode_for([resume_text[:6000], jd_text[:6000]])
    if embeddings and len(embeddings) == 2:
        return _vector_cosine(embeddings[0], embeddings[1]), mode
    return cosine_similarity(resume_text, jd_text), mode


def _vector_cosine(vector_a: list[float], vector_b: list[float]) -> float:
    numerator = sum(left * right for left, right in zip(vector_a, vector_b))
    denom_a = math.sqrt(sum(value * value for value in vector_a))
    denom_b = math.sqrt(sum(value * value for value in vector_b))
    return numerator / (denom_a * denom_b) if denom_a and denom_b else 0.0


def _structure_score(structure: StructureAnalysis) -> int:
    signals = [
        structure.contact_info,
        structure.summary_section,
        structure.skills_section,
        structure.experience_evidence,
        structure.measurable_impact,
    ]
    detected = sum(1 for signal in signals if signal.detected)
    return _clamp_score((detected / len(signals)) * 100)


def _signal(key: str, label: str, detected: bool, detail: str) -> StructureSignal:
    return StructureSignal(key=key, label=label, detected=detected, detail=detail)


def _clamp_score(value: float) -> int:
    return max(0, min(100, int(round(value))))


def _build_evidence(
    matched: list[str], missing: list[str], resume_text: str, jd_text: str
) -> list[EvidenceItem]:
    evidence: list[EvidenceItem] = []
    for skill in matched[:8]:
        evidence.append(EvidenceItem(skill=skill, source="resume", quote=_quote_for(skill, resume_text)))
        evidence.append(
            EvidenceItem(skill=skill, source="job_description", quote=_quote_for(skill, jd_text))
        )
    for skill in missing[:6]:
        evidence.append(
            EvidenceItem(skill=skill, source="job_description", quote=_quote_for(skill, jd_text))
        )
    return evidence


def _build_evidence_trace(
    matched: list[str], missing: list[str], resume_text: str, jd_text: str
) -> list[EvidenceTraceItem]:
    rows: list[EvidenceTraceItem] = []
    for skill in matched[:8]:
        quality, quality_score = _evidence_quality(skill, resume_text)
        rows.append(
            EvidenceTraceItem(
                skill=skill,
                status="matched",
                quality=quality,
                quality_score=quality_score,
                resume_evidence=_quote_for(skill, resume_text),
                jd_evidence=_quote_for(skill, jd_text),
                gap_reason=_quality_reason(skill, quality),
                recommendation=_quality_recommendation(skill, quality),
            )
        )
    for skill in missing[:8]:
        rows.append(
            EvidenceTraceItem(
                skill=skill,
                status="missing",
                quality="missing",
                quality_score=0,
                resume_evidence="No direct resume evidence found.",
                jd_evidence=_quote_for(skill, jd_text),
                gap_reason=f"The JD asks for {skill}, but the resume does not show direct evidence.",
                recommendation=f"Add a truthful project bullet or learning artifact that demonstrates {skill}.",
            )
        )
    return rows


def _quote_for(skill: str, text: str) -> str:
    candidates = _skill_sentences(skill, text)
    scored = sorted(candidates, key=_sentence_evidence_score, reverse=True)
    if scored:
        return scored[0].strip()[:240]
    aliases = SKILL_CATALOG[skill][1]
    sentences = re.split(r"(?<=[。.!?])\s+|\n+", text.strip())
    for sentence in sentences:
        lowered = sentence.lower()
        if any(alias.lower() in lowered for alias in aliases):
            return sentence.strip()[:240]
    return text.strip()[:240]


def _evidence_quality(skill: str, text: str) -> tuple[str, int]:
    candidates = _skill_sentences(skill, text)
    if not candidates:
        return "missing", 0
    best_score = max(_sentence_evidence_score(sentence) for sentence in candidates)
    if best_score >= 2:
        return "direct", 95
    if best_score == 1:
        return "direct", 85
    return "weak", 55


def _quality_reason(skill: str, quality: str) -> str:
    if quality == "direct":
        return f"Resume shows project or delivery evidence for {skill}, not just a keyword mention."
    return f"Resume mentions {skill}, but evidence is thin; it needs a project, action, or measurable result."


def _skill_sentences(skill: str, text: str) -> list[str]:
    aliases = SKILL_CATALOG[skill][1]
    sentences = re.split(r"(?<=[.!?])\s+|\n+", text.strip())
    matches: list[str] = []
    for sentence in sentences:
        lowered = sentence.lower()
        if any(_contains_term(lowered, alias.lower()) for alias in aliases):
            matches.append(sentence.strip())
    return matches


def _sentence_evidence_score(sentence: str) -> int:
    lowered = sentence.lower()
    has_delivery = bool(re.search(r"\b(built|created|developed|designed|implemented|led|improved|reduced|launched|project|projects|experience)\b", lowered))
    has_metric = bool(re.search(r"(\d+%|\$\d+|\b\d+x\b|\b\d+\s*(users|requests|ms|seconds|hours|days)\b)", lowered))
    return int(has_delivery) + int(has_metric)


def _quality_recommendation(skill: str, quality: str) -> str:
    if quality == "direct":
        return f"Keep {skill} in the summary and reinforce it in the strongest project bullet."
    return f"Strengthen {skill} with one truthful action + technology + result bullet."


def _build_suggestions(missing: list[str], matched: list[str]) -> list[str]:
    suggestions: list[str] = []
    if missing:
        suggestions.append("Add direct resume evidence for missing skills: " + ", ".join(missing[:5]) + ".")
        suggestions.append("Prepare a small 1-2 week proof project or learning artifact for each critical gap.")
    if matched:
        suggestions.append("Move matched skills into the resume summary and first project entries: " + ", ".join(matched[:5]) + ".")
    suggestions.append("Rewrite project bullets as action + technology + result instead of listing tool names.")
    return suggestions


def _build_bullets(matched: list[str], missing: list[str]) -> list[str]:
    focus = matched[:4] or ["核心技术"]
    bullets = [
        f"Built a job-relevant project using {', '.join(focus)} to solve a measurable user workflow.",
        "Designed a local-first workflow with clear data flow, validation, and repeatable Docker-based setup.",
        "Improved resume-project alignment by mapping requirements to evidence-backed implementation details.",
    ]
    if missing:
        bullets.append(f"Planned targeted upskilling for gaps including {', '.join(missing[:3])}.")
    return bullets


def _build_questions(missing: list[str], matched: list[str]) -> list[str]:
    questions = [
        "Walk me through the project that best demonstrates your engineering ability and your specific contribution.",
        "How do you verify whether AI-generated output is reliable, and how do you reduce hallucinations?",
    ]
    for skill in missing[:4]:
        questions.append(f"The role asks for {skill}. If your experience is thin, how would you close the gap and prove it?")
    for skill in matched[:3]:
        questions.append(f"Use a project example to explain how you applied {skill} to solve a real problem.")
    return questions


def _build_tailored_resume(matched: list[str], missing: list[str], bullets: list[str]) -> TailoredResumeDraft:
    focus = matched[:5] or ["product engineering", "local-first tooling"]
    skills = sorted(set(matched[:8]))
    summary = (
        "AI application developer focused on local-first tools, evidence-backed workflows, "
        f"and practical delivery with {', '.join(focus[:4])}."
    )
    tailored_bullets = bullets[:4]
    if missing:
        tailored_bullets.append(
            "Planned targeted proof artifacts for role gaps including " + ", ".join(missing[:3]) + "."
        )
    return TailoredResumeDraft(
        summary=summary,
        skills=skills,
        bullets=tailored_bullets,
        integrity_note="Draft only reorganizes and strengthens existing evidence; do not claim skills or outcomes you cannot defend.",
    )


def _build_case_study(score: int, matched: list[str], missing: list[str]) -> CaseStudy:
    matched_text = ", ".join(matched[:5]) or "core engineering skills"
    missing_text = ", ".join(missing[:4]) or "minor role-specific gaps"
    return CaseStudy(
        problem="Job seekers need a fast way to compare a resume with a target JD without sending private data to a heavy hosted system.",
        solution=(
            f"JobFit RAG turns the resume and JD into an explainable report with score {score}/100, "
            f"matched evidence for {matched_text}, and gap actions for {missing_text}."
        ),
        architecture=[
            "React + TypeScript single-page interface",
            "FastAPI backend with deterministic fallback analysis",
            "SQLite local persistence mounted through Docker Compose",
            "Optional OpenAI-compatible refinement through environment variables",
        ],
        tradeoffs=[
            "SQLite keeps setup simple but is not intended for multi-user scale.",
            "Deterministic scoring is explainable but less nuanced than a full ML ranking model.",
            "No local LLM keeps weak laptops responsive but relies on optional API calls for richer refinement.",
        ],
        demo_talk_track=[
            "Paste or upload a resume and target JD.",
            "Show score breakdown, evidence trace, and missing skill plan.",
            "Open report history, compare two target roles, then export Markdown.",
        ],
    )


def _build_interview_pack(
    score: int,
    matched: list[str],
    missing: list[str],
    evidence_trace: list[EvidenceTraceItem],
    case_study: CaseStudy,
) -> InterviewPack:
    strongest = [item for item in evidence_trace if item.status == "matched"][:3]
    star_answers = [
        StarAnswer(
            skill=item.skill,
            situation=case_study.problem,
            task=f"Show practical evidence for {item.skill} in a job-relevant project.",
            action=item.resume_evidence,
            result=f"Use this as proof of {item.skill}; evidence quality is {item.quality} ({item.quality_score}/100).",
        )
        for item in strongest
    ]
    if len(star_answers) < 2:
        star_answers.append(
            StarAnswer(
                skill="Product thinking",
                situation=case_study.problem,
                task="Turn a resume review problem into a usable local workflow.",
                action=case_study.solution,
                result=f"Created an explainable job-fit report with score {score}/100 and concrete next actions.",
            )
        )
    risk_notes = [
        f"{skill}: be honest that direct resume evidence is still missing; explain the proof artifact you will build next."
        for skill in missing[:5]
    ]
    weak = [item.skill for item in evidence_trace if item.quality == "weak"]
    if weak:
        risk_notes.append("Weak evidence needs stronger project bullets for: " + ", ".join(weak[:4]) + ".")
    return InterviewPack(
        positioning_statement=(
            "I build local-first AI application workflows that turn vague career data into explainable, exportable decisions."
        ),
        star_answers=star_answers,
        risk_notes=risk_notes or ["No major evidence risks detected; keep answers specific and tied to project proof."],
        close_pitch=(
            "This project shows full-stack product judgment: Docker-first setup, FastAPI analysis, React UI, SQLite persistence, "
            "explainable evidence, and a workflow a real job seeker can use."
        ),
    )


def _build_proof_plan(evidence_trace: list[EvidenceTraceItem]) -> list[ProofPlanItem]:
    risky = [item for item in evidence_trace if item.quality in {"weak", "missing"}]
    plan: list[ProofPlanItem] = []
    for item in risky[:8]:
        if item.quality == "missing":
            plan.append(
                ProofPlanItem(
                    skill=item.skill,
                    risk_level="missing",
                    proof_artifact=f"Mini project note or README section proving {item.skill}.",
                    small_task=f"Build the smallest working slice that uses {item.skill} in a job-relevant workflow.",
                    acceptance_check=f"README shows problem, implementation, screenshot or command output, and one honest resume bullet for {item.skill}.",
                    estimated_days=3,
                )
            )
        else:
            plan.append(
                ProofPlanItem(
                    skill=item.skill,
                    risk_level="weak",
                    proof_artifact=f"Before/after resume bullet plus project evidence for {item.skill}.",
                    small_task=f"Add one measurable action + technology + result bullet tied to existing {item.skill} work.",
                    acceptance_check=f"Evidence includes a concrete action, project context, and result that can be defended in interview.",
                    estimated_days=1,
                )
            )
    return plan


def _build_portfolio_readiness(
    score: int,
    evidence_trace: list[EvidenceTraceItem],
    proof_plan: list[ProofPlanItem],
    bullet_scores: list[BulletScore],
    case_study: CaseStudy,
    interview_pack: InterviewPack,
) -> PortfolioReadiness:
    if evidence_trace:
        evidence_score = sum(item.quality_score for item in evidence_trace) / len(evidence_trace)
    else:
        evidence_score = 0
    strong_bullets = sum(1 for item in bullet_scores if item.score >= 75)
    bullet_score = min(100, strong_bullets * 25)
    proof_penalty = min(35, sum(12 if item.risk_level == "missing" else 6 for item in proof_plan))
    story_score = 0
    if case_study.problem and case_study.solution:
        story_score += 20
    if case_study.demo_talk_track:
        story_score += 15
    if interview_pack.positioning_statement and interview_pack.star_answers:
        story_score += 20
    if interview_pack.close_pitch:
        story_score += 10

    readiness_score = _clamp_score(score * 0.35 + evidence_score * 0.25 + bullet_score * 0.20 + story_score * 0.20 - proof_penalty)
    if readiness_score >= 75:
        level = "ready"
    elif readiness_score >= 50:
        level = "almost_ready"
    else:
        level = "draft"

    strengths: list[str] = []
    direct_count = sum(1 for item in evidence_trace if item.quality == "direct")
    if direct_count:
        strengths.append(f"{direct_count} skills have direct resume evidence.")
    if strong_bullets:
        strengths.append(f"{strong_bullets} resume bullets already score 75+.")
    if case_study.demo_talk_track:
        strengths.append("Case study and demo talk track are ready for interview walkthrough.")
    if interview_pack.star_answers:
        strengths.append("Interview pack includes STAR answers tied to evidence.")

    blockers: list[str] = []
    missing = [item.skill for item in proof_plan if item.risk_level == "missing"]
    weak = [item.skill for item in proof_plan if item.risk_level == "weak"]
    if missing:
        blockers.append("Missing proof artifacts for: " + ", ".join(missing[:5]) + ".")
    if weak:
        blockers.append("Weak evidence needs stronger bullets for: " + ", ".join(weak[:5]) + ".")
    if not strong_bullets:
        blockers.append("No resume bullet reaches the strong 75+ rubric threshold yet.")

    if blockers:
        next_best_action = blockers[0]
    elif level == "ready":
        next_best_action = "Use the case study and interview pack in a mock interview, then tailor the README for the target role."
    else:
        next_best_action = "Strengthen the highest-risk proof artifact and rerun the analysis."

    return PortfolioReadiness(
        score=readiness_score,
        level=level,
        strengths=strengths or ["The report has a complete local-first workflow to build on."],
        blockers=blockers,
        next_best_action=next_best_action,
    )


def _build_action_board(
    proof_plan: list[ProofPlanItem],
    bullet_scores: list[BulletScore],
    portfolio_readiness: PortfolioReadiness,
) -> list[ActionBoardItem]:
    items: list[ActionBoardItem] = []
    for proof in proof_plan:
        priority = "high" if proof.risk_level == "missing" else "medium"
        items.append(
            ActionBoardItem(
                title=f"Create proof artifact for {proof.skill}",
                source="proof_plan",
                skill=proof.skill,
                priority=priority,
                reason=f"{proof.skill} evidence is {proof.risk_level}; this blocks portfolio readiness.",
                acceptance_check=proof.acceptance_check,
                estimated_days=proof.estimated_days,
            )
        )

    for bullet in bullet_scores:
        if bullet.score >= 75:
            continue
        items.append(
            ActionBoardItem(
                title="Rewrite low-scoring resume bullet",
                source="bullet_score",
                skill="Resume bullet",
                priority="medium" if bullet.score < 50 else "low",
                reason=f"Bullet scores {bullet.score}/100. {bullet.suggestion}",
                acceptance_check="Rewrite as action + technology + result + metric, then rerun the analysis.",
                estimated_days=1,
            )
        )

    if portfolio_readiness.blockers:
        items.append(
            ActionBoardItem(
                title="Resolve top readiness blocker",
                source="readiness",
                skill="Portfolio readiness",
                priority="high" if portfolio_readiness.level == "draft" else "medium",
                reason=portfolio_readiness.next_best_action,
                acceptance_check="Portfolio readiness no longer shows this blocker after rerunning the report.",
                estimated_days=1,
            )
        )

    priority_order = {"high": 0, "medium": 1, "low": 2}
    source_order = {"proof_plan": 0, "readiness": 1, "bullet_score": 2}
    return sorted(
        items,
        key=lambda item: (priority_order[item.priority], source_order[item.source], item.skill),
    )[:12]


def _build_portfolio_export(
    case_study: CaseStudy,
    portfolio_readiness: PortfolioReadiness,
    action_board: list[ActionBoardItem],
    proof_plan: list[ProofPlanItem],
    bullets: list[str],
    matched: list[str],
    missing: list[str],
) -> PortfolioExport:
    matched_text = ", ".join(matched[:5]) or "local-first product engineering"
    gap_text = ", ".join(missing[:4]) or "role-specific polish"
    proof_artifacts = [
        f"{item.skill}: {item.proof_artifact} Acceptance: {item.acceptance_check}"
        for item in proof_plan[:5]
    ]
    if not proof_artifacts:
        proof_artifacts = [
            "README demo script with screenshot, Docker commands, and one honest resume bullet.",
            "Interview walkthrough using score breakdown, evidence trace, and action board.",
        ]
    next_actions = [
        f"[{item.priority}] {item.title}: {item.acceptance_check}"
        for item in action_board[:5]
    ]
    if not next_actions:
        next_actions = [portfolio_readiness.next_best_action]
    resume_bullet = bullets[0] if bullets else (
        f"Built JobFit RAG to compare resumes with target JDs using {matched_text}, then convert gaps such as {gap_text} into evidence-backed portfolio actions."
    )
    return PortfolioExport(
        headline=f"JobFit RAG: local-first AI job-fit analyzer for evidence-backed portfolio storytelling",
        problem=case_study.problem,
        solution=case_study.solution,
        architecture=case_study.architecture,
        tradeoffs=case_study.tradeoffs,
        proof_artifacts=proof_artifacts,
        readiness_summary=(
            f"Portfolio readiness is {portfolio_readiness.score}/100 ({portfolio_readiness.level}). "
            f"Next best action: {portfolio_readiness.next_best_action}"
        ),
        next_actions=next_actions,
        resume_bullet=resume_bullet,
    )


def _build_learning_plan(missing: list[str], matched: list[str]) -> list[LearningPlanItem]:
    focus_pool = missing or matched or ["portfolio positioning"]
    plan: list[LearningPlanItem] = []
    for index in range(7):
        focus = focus_pool[index % len(focus_pool)]
        if index == 0:
            action = f"Map current resume evidence against {focus} and write the smallest proof gap."
            deliverable = f"One-page {focus} gap note."
        elif index in {1, 2, 3}:
            action = f"Build or extend a small project slice that demonstrates {focus}."
            deliverable = f"Working commit or screenshot proving {focus}."
        elif index == 4:
            action = f"Rewrite resume bullets to connect {focus} with action, technology, and result."
            deliverable = "Three revised resume bullets."
        elif index == 5:
            action = f"Prepare interview answers explaining trade-offs around {focus}."
            deliverable = "Two STAR-style interview answers."
        else:
            action = "Package the strongest proof into the portfolio README and demo script."
            deliverable = "Portfolio-ready demo note."
        plan.append(LearningPlanItem(day=index + 1, focus=focus, action=action, deliverable=deliverable))
    return plan


def _resume_bullet_candidates(text: str) -> list[str]:
    lines = [line.strip(" \t-*•") for line in text.splitlines()]
    explicit = [line for line in lines if 20 <= len(line) <= 220 and _looks_like_bullet(line)]
    if explicit:
        return explicit
    sentences = re.split(r"(?<=[.!?])\s+|\n+|(?=\b(?:Built|Created|Developed|Designed|Led|Improved|Reduced|Implemented|Worked)\b)", text.strip())
    return [sentence.strip(" \t-*•") for sentence in sentences if 20 <= len(sentence.strip()) <= 220 and _looks_like_bullet(sentence)]


def _looks_like_bullet(text: str) -> bool:
    lowered = text.lower()
    verbs = ["built", "created", "developed", "designed", "led", "improved", "reduced", "implemented", "worked"]
    return any(verb in lowered for verb in verbs)


def _score_bullet(bullet: str) -> BulletScore:
    lowered = bullet.lower()
    has_action = bool(re.search(r"\b(built|created|developed|designed|led|improved|reduced|implemented|launched|optimized|worked)\b", lowered))
    has_technology = bool(extract_skills(bullet) or re.search(r"\b(api|dashboard|database|frontend|backend|workflow|tool)\b", lowered))
    has_result = bool(re.search(r"\b(improved|reduced|increased|saved|accelerated|enabled|delivered|for|to)\b", lowered))
    has_metric = bool(re.search(r"(\d+%|\$\d+|\b\d+x\b|\b\d+\s*(users|requests|ms|seconds|hours|days|minute|minutes)\b)", lowered))
    score = _clamp_score(sum([has_action, has_technology, has_result, has_metric]) * 25)
    missing_parts: list[str] = []
    if not has_action:
        missing_parts.append("action verb")
    if not has_technology:
        missing_parts.append("technology")
    if not has_result:
        missing_parts.append("result")
    if not has_metric:
        missing_parts.append("metric")
    suggestion = "Strong bullet." if not missing_parts else "Add " + ", ".join(missing_parts) + "."
    return BulletScore(
        bullet=bullet,
        score=score,
        has_action=has_action,
        has_technology=has_technology,
        has_result=has_result,
        has_metric=has_metric,
        suggestion=suggestion,
    )


def _summary(score: int, matched: list[str], missing: list[str]) -> str:
    if score >= 75:
        level = "strong match"
    elif score >= 45:
        level = "moderate match"
    else:
        level = "low match"
    return f"{level}: {len(matched)} key skills matched, {len(missing)} gaps still need evidence."
