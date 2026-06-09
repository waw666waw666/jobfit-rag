export type Language = "en" | "zh";
export type Tab =
  | "overview"
  | "readiness"
  | "action"
  | "skills"
  | "evidence"
  | "trace"
  | "rewrite"
  | "tailored"
  | "case"
  | "interview"
  | "proof"
  | "structure"
  | "learning"
  | "bullets";

export type EvidenceItem = { skill: string; source: "resume" | "job_description"; quote: string };
export type JobRequirement = { name: string; category: string; importance: "required" | "preferred" };
export type ScoreBreakdown = { keyword_score: number; semantic_score: number; structure_score: number };
export type ApiMode = "local_fallback" | "api_refinement_enabled" | "api_failed_fallback";
export type StructureSignal = { key: string; label: string; detected: boolean; detail: string };
export type StructureAnalysis = {
  contact_info: StructureSignal;
  summary_section: StructureSignal;
  skills_section: StructureSignal;
  experience_evidence: StructureSignal;
  measurable_impact: StructureSignal;
};
export type LearningPlanItem = { day: number; focus: string; action: string; deliverable: string };
export type ProofPlanItem = {
  skill: string;
  risk_level: "weak" | "missing";
  proof_artifact: string;
  small_task: string;
  acceptance_check: string;
  estimated_days: number;
};
export type BulletScore = {
  bullet: string;
  score: number;
  has_action: boolean;
  has_technology: boolean;
  has_result: boolean;
  has_metric: boolean;
  suggestion: string;
};
export type EvidenceTraceItem = {
  skill: string;
  status: "matched" | "missing";
  quality: "direct" | "weak" | "missing";
  quality_score: number;
  resume_evidence: string;
  jd_evidence: string;
  gap_reason: string;
  recommendation: string;
};
export type TailoredResumeDraft = { summary: string; skills: string[]; bullets: string[]; integrity_note: string };
export type CaseStudy = {
  problem: string;
  solution: string;
  architecture: string[];
  tradeoffs: string[];
  demo_talk_track: string[];
};
export type StarAnswer = { skill: string; situation: string; task: string; action: string; result: string };
export type InterviewPack = {
  positioning_statement: string;
  star_answers: StarAnswer[];
  risk_notes: string[];
  close_pitch: string;
};
export type PortfolioReadiness = {
  score: number;
  level: "draft" | "almost_ready" | "ready";
  strengths: string[];
  blockers: string[];
  next_best_action: string;
};
export type ActionBoardItem = {
  title: string;
  source: "proof_plan" | "bullet_score" | "readiness";
  skill: string;
  priority: "high" | "medium" | "low";
  reason: string;
  acceptance_check: string;
  estimated_days: number;
};
export type PortfolioExport = {
  headline: string;
  problem: string;
  solution: string;
  architecture: string[];
  tradeoffs: string[];
  proof_artifacts: string[];
  readiness_summary: string;
  next_actions: string[];
  resume_bullet: string;
};
export type AnalysisReport = {
  id: string;
  created_at: string;
  overall_score: number;
  score_breakdown: ScoreBreakdown;
  api_mode: ApiMode;
  structure: StructureAnalysis;
  summary: string;
  matched_skills: string[];
  missing_skills: string[];
  job_requirements: JobRequirement[];
  evidence: EvidenceItem[];
  resume_suggestions: string[];
  optimized_bullets: string[];
  interview_questions: string[];
  learning_plan: LearningPlanItem[];
  proof_plan: ProofPlanItem[];
  bullet_scores: BulletScore[];
  evidence_trace: EvidenceTraceItem[];
  tailored_resume: TailoredResumeDraft;
  case_study: CaseStudy;
  interview_pack: InterviewPack;
  portfolio_readiness: PortfolioReadiness;
  action_board: ActionBoardItem[];
  portfolio_export: PortfolioExport;
};
export type ReportListItem = { id: string; created_at: string; overall_score: number; summary: string };
export type ReportsExport = { version: string; exported_at: string; reports: AnalysisReport[] };
export type ReportsImportResult = { imported: number; skipped: number };
export type ResumeVersionMatrixItem = {
  label: string;
  overall_score: number;
  readiness_score: number;
  matched_skills: string[];
  missing_skills: string[];
  gained_skills: string[];
  remaining_gaps: string[];
  next_best_action: string;
};
export type ResumeMatrixReport = {
  jd_summary: string;
  best_version: string;
  score_delta: number;
  versions: ResumeVersionMatrixItem[];
  recommendations: string[];
};
export type ApplicationStatus = "target" | "drafting" | "applied" | "interview" | "offer" | "rejected" | "paused";
export type ApplicationItem = {
  id: string;
  created_at: string;
  updated_at: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  next_action: string;
  report_id?: string | null;
};

export type Copy = {
  eyebrow: string;
  heroCopy: string;
  runtime: string;
  runtimeMode: string;
  model: string;
  localFirst: string;
  privacy: string;
  resume: string;
  resumeHelp: string;
  jd: string;
  jobSourceTitle: string;
  jobCompany: string;
  jobRole: string;
  jobSourceUrl: string;
  jobCapturedAt: string;
  jobSourceHelp: string;
  analyze: string;
  analyzing: string;
  exportMarkdown: string;
  exportInterviewPack: string;
  exportPortfolioCaseStudy: string;
  exportJson: string;
  importJson: string;
  loadFrontend: string;
  loadAi: string;
  demoMode: string;
  editMode: string;
  clear: string;
  history: string;
  refresh: string;
  delete: string;
  select: string;
  selected: string;
  open: string;
  noHistory: string;
  demoTitle: string;
  demoBody: string;
  compareTitle: string;
  compareHint: string;
  matrixTitle: string;
  matrixHint: string;
  matrixBaseline: string;
  matrixTailored: string;
  runMatrix: string;
  matrixBest: string;
  trackerTitle: string;
  company: string;
  role: string;
  status: string;
  nextAction: string;
  addTarget: string;
  markApplied: string;
  noApplications: string;
  evidenceQuality: string;
  qualityScore: string;
  scoreDelta: string;
  gainedSkills: string;
  remainingGaps: string;
  overallMatch: string;
  reportId: string;
  matchedSkills: string;
  missingSkills: string;
  jdRequirements: string;
  evidence: string;
  evidenceTrace: string;
  traceStatus: string;
  resumeEvidence: string;
  jdEvidence: string;
  gapReason: string;
  recommendation: string;
  resumeSuggestions: string;
  optimizedBullets: string;
  tailoredResume: string;
  tailoredSummary: string;
  integrityNote: string;
  caseStudy: string;
  problem: string;
  solution: string;
  architecture: string;
  tradeoffs: string;
  demoTalkTrack: string;
  interviewQuestions: string;
  interviewPack: string;
  positioningStatement: string;
  starAnswers: string;
  riskNotes: string;
  closePitch: string;
  situation: string;
  task: string;
  result: string;
  proofPlan: string;
  riskLevel: string;
  proofArtifact: string;
  smallTask: string;
  acceptanceCheck: string;
  estimatedDays: string;
  readiness: string;
  readinessLevel: string;
  strengths: string;
  blockers: string;
  nextBestAction: string;
  actionBoard: string;
  priority: string;
  source: string;
  skill: string;
  headline: string;
  proofArtifacts: string;
  nextActions: string;
  resumeBullet: string;
  structure: string;
  learningPlan: string;
  bulletRubric: string;
  day: string;
  action: string;
  deliverable: string;
  bulletScore: string;
  hasAction: string;
  hasTechnology: string;
  hasResult: string;
  hasMetric: string;
  suggestion: string;
  scoreBreakdown: string;
  keywordScore: string;
  semanticScore: string;
  structureScore: string;
  apiMode: string;
  localFallback: string;
  apiEnabled: string;
  apiFailed: string;
  disclaimerTitle: string;
  disclaimer: string;
  emptyTitle: string;
  emptyBody: string;
  noItems: string;
  fastActionsTitle: string;
  prioritySprintTitle: string;
  prioritySprintHint: string;
  riskRadarTitle: string;
  riskRadarHint: string;
  workflowTitle: string;
  workflowSteps: string[];
  detailTitle: string;
  detailItems: string[];
  resumePlaceholder: string;
  jdPlaceholder: string;
  generated: string;
  score: string;
  resumeSource: string;
  jdSource: string;
  detected: string;
  missing: string;
  importSuccess: string;
  errorPrefix: string;
  tabs: Record<Tab, string>;
};

export type InterviewCopy = Pick<
  Copy,
  | "exportInterviewPack"
  | "interviewPack"
  | "positioningStatement"
  | "starAnswers"
  | "riskNotes"
  | "closePitch"
  | "situation"
  | "task"
  | "result"
  | "proofPlan"
  | "riskLevel"
  | "proofArtifact"
  | "smallTask"
  | "acceptanceCheck"
  | "estimatedDays"
>;

export type ReadinessCopy = Pick<
  Copy,
  | "readiness"
  | "readinessLevel"
  | "strengths"
  | "blockers"
  | "nextBestAction"
>;

export type ActionCopy = Pick<Copy, "actionBoard" | "priority" | "source" | "skill">;

export type PortfolioCopy = Pick<
  Copy,
  | "exportPortfolioCaseStudy"
  | "headline"
  | "proofArtifacts"
  | "nextActions"
  | "resumeBullet"
>;
