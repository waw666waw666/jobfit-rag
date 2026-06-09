from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    resume_text: str = Field(min_length=20)
    jd_text: str = Field(min_length=20)


class ResumeVersionInput(BaseModel):
    label: str = Field(min_length=1, max_length=80)
    resume_text: str = Field(min_length=20)


class ResumeMatrixRequest(BaseModel):
    jd_text: str = Field(min_length=20)
    versions: list[ResumeVersionInput] = Field(min_length=2, max_length=4)


class ParseResumeResponse(BaseModel):
    filename: str
    text: str


ApplicationStatus = Literal["target", "drafting", "applied", "interview", "offer", "rejected", "paused"]


class ApplicationCreate(BaseModel):
    company: str = Field(min_length=1, max_length=120)
    role: str = Field(min_length=1, max_length=160)
    status: ApplicationStatus = "target"
    next_action: str = Field(default="", max_length=300)
    report_id: str | None = None


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus | None = None
    next_action: str | None = Field(default=None, max_length=300)
    report_id: str | None = None


class ApplicationItem(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    company: str
    role: str
    status: ApplicationStatus
    next_action: str
    report_id: str | None = None


class EvidenceItem(BaseModel):
    skill: str
    source: Literal["resume", "job_description"]
    quote: str


class JobRequirement(BaseModel):
    name: str
    category: str
    importance: Literal["required", "preferred"] = "required"


class ScoreBreakdown(BaseModel):
    keyword_score: int = Field(ge=0, le=100)
    semantic_score: int = Field(ge=0, le=100)
    structure_score: int = Field(ge=0, le=100)


class StructureSignal(BaseModel):
    key: str
    label: str
    detected: bool
    detail: str


class StructureAnalysis(BaseModel):
    contact_info: StructureSignal
    summary_section: StructureSignal
    skills_section: StructureSignal
    experience_evidence: StructureSignal
    measurable_impact: StructureSignal


class LearningPlanItem(BaseModel):
    day: int = Field(ge=1, le=7)
    focus: str
    action: str
    deliverable: str


class ProofPlanItem(BaseModel):
    skill: str
    risk_level: Literal["weak", "missing"]
    proof_artifact: str
    small_task: str
    acceptance_check: str
    estimated_days: int = Field(ge=1, le=7)


class BulletScore(BaseModel):
    bullet: str
    score: int = Field(ge=0, le=100)
    has_action: bool
    has_technology: bool
    has_result: bool
    has_metric: bool
    suggestion: str


class EvidenceTraceItem(BaseModel):
    skill: str
    status: Literal["matched", "missing"]
    quality: Literal["direct", "weak", "missing"] = "missing"
    quality_score: int = Field(default=0, ge=0, le=100)
    resume_evidence: str
    jd_evidence: str
    gap_reason: str
    recommendation: str


class TailoredResumeDraft(BaseModel):
    summary: str
    skills: list[str]
    bullets: list[str]
    integrity_note: str


class CaseStudy(BaseModel):
    problem: str
    solution: str
    architecture: list[str]
    tradeoffs: list[str]
    demo_talk_track: list[str]


class StarAnswer(BaseModel):
    skill: str
    situation: str
    task: str
    action: str
    result: str


class InterviewPack(BaseModel):
    positioning_statement: str
    star_answers: list[StarAnswer]
    risk_notes: list[str]
    close_pitch: str


class PortfolioReadiness(BaseModel):
    score: int = Field(ge=0, le=100)
    level: Literal["draft", "almost_ready", "ready"]
    strengths: list[str]
    blockers: list[str]
    next_best_action: str


class ActionBoardItem(BaseModel):
    title: str
    source: Literal["proof_plan", "bullet_score", "readiness"]
    skill: str
    priority: Literal["high", "medium", "low"]
    reason: str
    acceptance_check: str
    estimated_days: int = Field(ge=1, le=7)


class PortfolioExport(BaseModel):
    headline: str
    problem: str
    solution: str
    architecture: list[str]
    tradeoffs: list[str]
    proof_artifacts: list[str]
    readiness_summary: str
    next_actions: list[str]
    resume_bullet: str


class AnalysisReport(BaseModel):
    id: str
    created_at: datetime
    overall_score: int = Field(ge=0, le=100)
    score_breakdown: ScoreBreakdown
    api_mode: Literal["local_fallback", "api_refinement_enabled", "api_failed_fallback"]
    structure: StructureAnalysis
    summary: str
    matched_skills: list[str]
    missing_skills: list[str]
    job_requirements: list[JobRequirement]
    evidence: list[EvidenceItem]
    resume_suggestions: list[str]
    optimized_bullets: list[str]
    interview_questions: list[str]
    learning_plan: list[LearningPlanItem] = Field(default_factory=list)
    proof_plan: list[ProofPlanItem] = Field(default_factory=list)
    bullet_scores: list[BulletScore] = Field(default_factory=list)
    evidence_trace: list[EvidenceTraceItem] = Field(default_factory=list)
    tailored_resume: TailoredResumeDraft = Field(
        default_factory=lambda: TailoredResumeDraft(summary="", skills=[], bullets=[], integrity_note="")
    )
    case_study: CaseStudy = Field(
        default_factory=lambda: CaseStudy(problem="", solution="", architecture=[], tradeoffs=[], demo_talk_track=[])
    )
    interview_pack: InterviewPack = Field(
        default_factory=lambda: InterviewPack(positioning_statement="", star_answers=[], risk_notes=[], close_pitch="")
    )
    portfolio_readiness: PortfolioReadiness = Field(
        default_factory=lambda: PortfolioReadiness(
            score=0,
            level="draft",
            strengths=[],
            blockers=[],
            next_best_action="Generate a report and add proof artifacts before presenting this portfolio.",
        )
    )
    action_board: list[ActionBoardItem] = Field(default_factory=list)
    portfolio_export: PortfolioExport = Field(
        default_factory=lambda: PortfolioExport(
            headline="",
            problem="",
            solution="",
            architecture=[],
            tradeoffs=[],
            proof_artifacts=[],
            readiness_summary="",
            next_actions=[],
            resume_bullet="",
        )
    )


class ReportListItem(BaseModel):
    id: str
    created_at: datetime
    overall_score: int
    summary: str


class ResumeVersionMatrixItem(BaseModel):
    label: str
    overall_score: int = Field(ge=0, le=100)
    readiness_score: int = Field(ge=0, le=100)
    matched_skills: list[str]
    missing_skills: list[str]
    gained_skills: list[str] = Field(default_factory=list)
    remaining_gaps: list[str] = Field(default_factory=list)
    next_best_action: str


class ResumeMatrixReport(BaseModel):
    jd_summary: str
    best_version: str
    score_delta: int
    versions: list[ResumeVersionMatrixItem]
    recommendations: list[str]


class ReportsExport(BaseModel):
    version: str = "jobfit-rag-export-v1"
    exported_at: datetime
    reports: list[AnalysisReport]


class ReportImportStats(BaseModel):
    imported: int
    skipped: int = 0


class ReportsImportResult(BaseModel):
    imported: int
    skipped: int = 0
