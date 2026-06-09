import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ReportView } from "./reportView";
import type { AnalysisReport, Copy, Tab } from "./types";

const tabLabels: Record<Tab, string> = {
  overview: "Overview",
  readiness: "Readiness",
  action: "Action",
  skills: "Skills",
  evidence: "Evidence",
  trace: "Trace",
  rewrite: "Rewrite",
  tailored: "Tailored",
  case: "Case",
  interview: "Interview",
  proof: "Proof",
  structure: "Structure",
  learning: "Learning",
  bullets: "Bullets",
};

const copy = new Proxy(
  { tabs: tabLabels },
  {
    get(target, property) {
      if (property in target) return target[property as keyof typeof target];
      return String(property);
    },
  },
) as Copy;

const report: AnalysisReport = {
  id: "sample-report",
  created_at: "2026-06-09T00:00:00Z",
  overall_score: 82,
  score_breakdown: { keyword_score: 80, semantic_score: 75, structure_score: 90 },
  api_mode: "local_fallback",
  structure: {
    contact_info: { key: "contact_info", label: "Contact info", detected: true, detail: "Email found." },
    summary_section: { key: "summary_section", label: "Summary", detected: true, detail: "Summary found." },
    skills_section: { key: "skills_section", label: "Skills", detected: true, detail: "Skills found." },
    experience_evidence: { key: "experience_evidence", label: "Experience", detected: true, detail: "Experience found." },
    measurable_impact: { key: "measurable_impact", label: "Impact", detected: true, detail: "Impact found." },
  },
  summary: "Strong local-first product fit.",
  matched_skills: ["React", "TypeScript"],
  missing_skills: ["SQL"],
  job_requirements: [{ name: "React", category: "frontend", importance: "required" }],
  evidence: [{ skill: "React", source: "resume", quote: "Built React dashboards." }],
  resume_suggestions: ["Add SQL proof."],
  optimized_bullets: ["Built React dashboards with measurable outcomes."],
  interview_questions: ["How did you measure impact?"],
  learning_plan: [{ day: 1, focus: "SQL", action: "Build query demo.", deliverable: "SQL notes." }],
  proof_plan: [{
    skill: "SQL",
    risk_level: "missing",
    proof_artifact: "SQLite project",
    small_task: "Add schema demo.",
    acceptance_check: "Demo query works.",
    estimated_days: 2,
  }],
  bullet_scores: [{
    bullet: "Built React dashboard.",
    score: 70,
    has_action: true,
    has_technology: true,
    has_result: true,
    has_metric: false,
    suggestion: "Add metric.",
  }],
  evidence_trace: [{
    skill: "React",
    status: "matched",
    quality: "direct",
    quality_score: 90,
    resume_evidence: "Built React dashboards.",
    jd_evidence: "Requires React.",
    gap_reason: "None.",
    recommendation: "Keep evidence.",
  }],
  tailored_resume: {
    summary: "Frontend developer with React evidence.",
    skills: ["React"],
    bullets: ["Built React dashboards."],
    integrity_note: "Only claims existing evidence.",
  },
  case_study: {
    problem: "Resume fit is hard to judge.",
    solution: "Evidence-grounded report.",
    architecture: ["React", "FastAPI"],
    tradeoffs: ["Local-first over cloud sync."],
    demo_talk_track: ["Show report tabs."],
  },
  interview_pack: {
    positioning_statement: "I build practical AI tools.",
    star_answers: [{ skill: "React", situation: "Demo", task: "Build UI", action: "Implemented tabs", result: "Clear report" }],
    risk_notes: ["Prepare SQL proof."],
    close_pitch: "I can ship local-first tools.",
  },
  portfolio_readiness: {
    score: 75,
    level: "almost_ready",
    strengths: ["Clear React evidence."],
    blockers: ["Needs SQL proof."],
    next_best_action: "Add SQL artifact.",
  },
  action_board: [{
    title: "Add SQL proof",
    source: "proof_plan",
    skill: "SQL",
    priority: "high",
    reason: "Missing evidence.",
    acceptance_check: "SQL demo passes.",
    estimated_days: 2,
  }],
  portfolio_export: {
    headline: "JobFit RAG",
    problem: "Job fit is unclear.",
    solution: "Evidence report.",
    architecture: ["React", "FastAPI"],
    tradeoffs: ["Local-first"],
    proof_artifacts: ["Demo"],
    readiness_summary: "75/100",
    next_actions: ["Add SQL"],
    resume_bullet: "Built JobFit RAG.",
  },
};

function Harness() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  return <ReportView report={report} t={copy} activeTab={activeTab} setActiveTab={setActiveTab} />;
}

afterEach(() => cleanup());

describe("ReportView tabs", () => {
  it("renders tabs and linked tab panels with selected and hidden state", () => {
    const { container } = render(<Harness />);
    const tablist = screen.getByRole("tablist", { name: "Report sections" });
    const tabs = screen.getAllByRole("tab");
    const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

    expect(tablist).toBeTruthy();
    expect(tabs).toHaveLength(Object.keys(tabLabels).length);
    expect(panels).toHaveLength(Object.keys(tabLabels).length);

    for (const tab of tabs) {
      const panelId = tab.getAttribute("aria-controls");
      expect(panelId).toBeTruthy();
      expect(document.getElementById(panelId!)).toBeTruthy();
    }

    expect(screen.getByRole("tab", { name: "Overview" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Readiness" }).getAttribute("aria-selected")).toBe("false");
    expect(document.getElementById("report-panel-readiness")?.hasAttribute("hidden")).toBe(true);
  });

  it("supports ArrowRight, ArrowLeft, Home, and End keyboard navigation with focus movement", async () => {
    render(<Harness />);
    const overview = screen.getByRole("tab", { name: "Overview" });

    overview.focus();
    fireEvent.keyDown(overview, { key: "ArrowRight" });
    await expectSelectedAndFocused("Readiness");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Readiness" }), { key: "ArrowLeft" });
    await expectSelectedAndFocused("Overview");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Overview" }), { key: "End" });
    await expectSelectedAndFocused("Bullets");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Bullets" }), { key: "Home" });
    await expectSelectedAndFocused("Overview");
  });
});

async function expectSelectedAndFocused(label: string) {
  const tab = screen.getByRole("tab", { name: label });
  await waitFor(() => {
    expect(tab.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tab);
  });
}
