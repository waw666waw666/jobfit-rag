import type { AnalysisReport } from "./types";

export function normalizeReport(report: AnalysisReport): AnalysisReport {
  return {
    ...report,
    learning_plan: report.learning_plan ?? [],
    proof_plan: report.proof_plan ?? [],
    bullet_scores: report.bullet_scores ?? [],
    evidence_trace: (report.evidence_trace ?? []).map((item) => ({
      ...item,
      quality: item.quality ?? (item.status === "missing" ? "missing" : "weak"),
      quality_score: item.quality_score ?? (item.status === "missing" ? 0 : 55),
    })),
    tailored_resume: report.tailored_resume ?? { summary: "", skills: [], bullets: [], integrity_note: "" },
    case_study: report.case_study ?? { problem: "", solution: "", architecture: [], tradeoffs: [], demo_talk_track: [] },
    interview_pack: report.interview_pack ?? { positioning_statement: "", star_answers: [], risk_notes: [], close_pitch: "" },
    portfolio_readiness: report.portfolio_readiness ?? {
      score: 0,
      level: "draft",
      strengths: [],
      blockers: [],
      next_best_action: "",
    },
    action_board: report.action_board ?? [],
    portfolio_export: report.portfolio_export ?? {
      headline: "",
      problem: "",
      solution: "",
      architecture: [],
      tradeoffs: [],
      proof_artifacts: [],
      readiness_summary: "",
      next_actions: [],
      resume_bullet: "",
    },
  };
}
