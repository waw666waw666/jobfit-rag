import type { KeyboardEvent } from "react";
import { BulletList, Panel, TagList } from "./components";
import type { AnalysisReport, Copy, StructureAnalysis, Tab } from "./types";

const reportTabs: Tab[] = ["overview", "readiness", "action", "skills", "evidence", "trace", "rewrite", "tailored", "case", "interview", "proof", "structure", "learning", "bullets"];

function tabId(tab: Tab) {
  return `report-tab-${tab}`;
}

function panelId(tab: Tab) {
  return `report-panel-${tab}`;
}

export function ReportView({
  report,
  t,
  activeTab,
  setActiveTab,
}: {
  report: AnalysisReport;
  t: Copy;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}) {
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, tab: Tab) {
    const index = reportTabs.indexOf(tab);
    const lastIndex = reportTabs.length - 1;
    let nextIndex = index;

    if (event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
    else if (event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = lastIndex;
    else return;

    event.preventDefault();
    const nextTab = reportTabs[nextIndex];
    setActiveTab(nextTab);
    window.requestAnimationFrame(() => document.getElementById(tabId(nextTab))?.focus());
  }

  return (
    <section className="report">
      <div className="score-block">
        <div className="score-ring">{report.overall_score}</div>
        <div>
          <p className="eyebrow">{t.overallMatch}</p>
          <h2>{report.summary}</h2>
          <p className="muted">{t.reportId}: {report.id}</p>
          <ApiBadge report={report} t={t} />
        </div>
      </div>
      <div className="disclaimer">
        <strong>{t.disclaimerTitle}</strong>
        <span>{t.disclaimer}</span>
      </div>
      <nav className="tabs" aria-label="Report sections" role="tablist">
        {reportTabs.map((tab) => (
          <button
            aria-controls={panelId(tab)}
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "active" : ""}
            id={tabId(tab)}
            key={tab}
            onClick={() => setActiveTab(tab)}
            onKeyDown={(event) => handleTabKeyDown(event, tab)}
            role="tab"
            tabIndex={activeTab === tab ? 0 : -1}
            type="button"
          >
            {t.tabs[tab]}
          </button>
        ))}
      </nav>
      {reportTabs.map((tab) => (
        <section
          aria-labelledby={tabId(tab)}
          hidden={activeTab !== tab}
          id={panelId(tab)}
          key={tab}
          role="tabpanel"
          tabIndex={0}
        >
          {tab === "overview" ? <Overview report={report} t={t} /> : null}
          {tab === "readiness" ? <ReadinessView report={report} t={t} /> : null}
          {tab === "action" ? <ActionBoardView report={report} t={t} /> : null}
          {tab === "skills" ? <Skills report={report} t={t} /> : null}
          {tab === "evidence" ? <Evidence report={report} t={t} /> : null}
          {tab === "trace" ? <EvidenceTrace report={report} t={t} /> : null}
          {tab === "rewrite" ? <Rewrite report={report} t={t} /> : null}
          {tab === "tailored" ? <TailoredResume report={report} t={t} /> : null}
          {tab === "case" ? <CaseStudyView report={report} t={t} /> : null}
          {tab === "interview" ? <InterviewPackView report={report} t={t} /> : null}
          {tab === "proof" ? <ProofPlanView report={report} t={t} /> : null}
          {tab === "structure" ? <Structure report={report} t={t} /> : null}
          {tab === "learning" ? <LearningPlan report={report} t={t} /> : null}
          {tab === "bullets" ? <BulletRubric report={report} t={t} /> : null}
        </section>
      ))}
    </section>
  );
}

function Overview({ report, t }: { report: AnalysisReport; t: Copy }) {
  return (
    <div className="report-grid">
      <Panel title={t.scoreBreakdown}>
        <ScoreBars report={report} t={t} />
      </Panel>
      <Panel title={t.jdRequirements}>
        <ul className="dense-list">
          {report.job_requirements.map((item) => (
            <li key={item.name}><strong>{item.name}</strong><span>{item.category}</span></li>
          ))}
        </ul>
      </Panel>
      <Panel title={t.structure}>
        <StructureList structure={report.structure} t={t} />
      </Panel>
    </div>
  );
}

function ReadinessView({ report, t }: { report: AnalysisReport; t: Copy }) {
  return (
    <div className="report-grid">
      <Panel title={t.readiness}>
        <div className={`readiness-card ${report.portfolio_readiness.level}`}>
          <strong>{report.portfolio_readiness.score}/100</strong>
          <span>{t.readinessLevel}: {report.portfolio_readiness.level}</span>
          <p>{t.nextBestAction}: {report.portfolio_readiness.next_best_action}</p>
        </div>
      </Panel>
      <Panel title={t.strengths}>
        <BulletList items={report.portfolio_readiness.strengths} />
      </Panel>
      <Panel title={t.blockers}>
        <BulletList items={report.portfolio_readiness.blockers.length ? report.portfolio_readiness.blockers : [t.noItems]} />
      </Panel>
    </div>
  );
}

function ActionBoardView({ report, t }: { report: AnalysisReport; t: Copy }) {
  return (
    <Panel title={t.actionBoard}>
      {report.action_board.length ? (
        <ul className="proof-list action-list">
          {report.action_board.map((item) => (
            <li className={item.priority} key={`${item.source}-${item.skill}-${item.title}`}>
              <div>
                <strong>{item.title}</strong>
                <span>{t.priority}: {item.priority}</span>
                <span>{t.source}: {item.source}</span>
                <span>{t.estimatedDays}: {item.estimated_days}</span>
              </div>
              <p><b>{t.skill}:</b> {item.skill}</p>
              <p><b>{t.gapReason}:</b> {item.reason}</p>
              <p><b>{t.acceptanceCheck}:</b> {item.acceptance_check}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{t.noItems}</p>
      )}
    </Panel>
  );
}

function Skills({ report, t }: { report: AnalysisReport; t: Copy }) {
  return (
    <div className="report-grid">
      <Panel title={t.matchedSkills}><TagList items={report.matched_skills} tone="good" emptyText={t.noItems} /></Panel>
      <Panel title={t.missingSkills}><TagList items={report.missing_skills} tone="warn" emptyText={t.noItems} /></Panel>
    </div>
  );
}

function Evidence({ report, t }: { report: AnalysisReport; t: Copy }) {
  return (
    <Panel title={t.evidence}>
      <ul className="evidence-list">
        {report.evidence.map((item, index) => (
          <li key={`${item.skill}-${item.source}-${index}`}>
            <span>{item.skill}</span>
            <small>{item.source === "resume" ? t.resumeSource : t.jdSource}</small>
            <p>{item.quote}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function EvidenceTrace({ report, t }: { report: AnalysisReport; t: Copy }) {
  return (
    <Panel title={t.evidenceTrace}>
      <ul className="trace-list">
        {report.evidence_trace.map((item) => (
          <li className={item.status} key={`${item.skill}-${item.status}`}>
            <div>
              <strong>{item.skill}</strong>
              <span>{t.traceStatus}: {item.status}</span>
              <span>{t.evidenceQuality}: {item.quality}</span>
              <span>{t.qualityScore}: {item.quality_score}/100</span>
            </div>
            <p><b>{t.resumeEvidence}:</b> {item.resume_evidence}</p>
            <p><b>{t.jdEvidence}:</b> {item.jd_evidence}</p>
            <p><b>{t.gapReason}:</b> {item.gap_reason}</p>
            <p><b>{t.recommendation}:</b> {item.recommendation}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Rewrite({ report, t }: { report: AnalysisReport; t: Copy }) {
  return (
    <div className="report-grid">
      <Panel title={t.resumeSuggestions}><BulletList items={report.resume_suggestions} /></Panel>
      <Panel title={t.optimizedBullets}><BulletList items={report.optimized_bullets} /></Panel>
    </div>
  );
}

function TailoredResume({ report, t }: { report: AnalysisReport; t: Copy }) {
  return (
    <div className="report-grid">
      <Panel title={t.tailoredSummary}>
        <p className="draft-copy">{report.tailored_resume.summary}</p>
        <p className="muted">{t.integrityNote}: {report.tailored_resume.integrity_note}</p>
      </Panel>
      <Panel title={t.matchedSkills}>
        <TagList items={report.tailored_resume.skills} tone="good" emptyText={t.noItems} />
      </Panel>
      <Panel title={t.optimizedBullets}>
        <BulletList items={report.tailored_resume.bullets} />
      </Panel>
    </div>
  );
}

function CaseStudyView({ report, t }: { report: AnalysisReport; t: Copy }) {
  return (
    <div className="report-grid">
      <Panel title={t.problem}><p className="draft-copy">{report.case_study.problem}</p></Panel>
      <Panel title={t.solution}><p className="draft-copy">{report.case_study.solution}</p></Panel>
      <Panel title={t.architecture}><BulletList items={report.case_study.architecture} /></Panel>
      <Panel title={t.tradeoffs}><BulletList items={report.case_study.tradeoffs} /></Panel>
      <Panel title={t.demoTalkTrack}><BulletList items={report.case_study.demo_talk_track} /></Panel>
    </div>
  );
}

function InterviewPackView({ report, t }: { report: AnalysisReport; t: Copy }) {
  return (
    <div className="report-grid">
      <Panel title={t.positioningStatement}>
        <p className="draft-copy">{report.interview_pack.positioning_statement || t.noItems}</p>
      </Panel>
      <Panel title={t.closePitch}>
        <p className="draft-copy">{report.interview_pack.close_pitch || t.noItems}</p>
      </Panel>
      <Panel title={t.starAnswers}>
        {report.interview_pack.star_answers.length ? (
          <ul className="star-list">
            {report.interview_pack.star_answers.map((item) => (
              <li key={`${item.skill}-${item.task}`}>
                <strong>{item.skill}</strong>
                <p><b>{t.situation}:</b> {item.situation}</p>
                <p><b>{t.task}:</b> {item.task}</p>
                <p><b>{t.action}:</b> {item.action}</p>
                <p><b>{t.result}:</b> {item.result}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{t.noItems}</p>
        )}
      </Panel>
      <Panel title={t.riskNotes}>
        <BulletList items={report.interview_pack.risk_notes} />
      </Panel>
      <Panel title={t.interviewQuestions}>
        <BulletList items={report.interview_questions} />
      </Panel>
    </div>
  );
}

function ProofPlanView({ report, t }: { report: AnalysisReport; t: Copy }) {
  return (
    <Panel title={t.proofPlan}>
      {report.proof_plan.length ? (
        <ul className="proof-list">
          {report.proof_plan.map((item) => (
            <li className={item.risk_level} key={`${item.skill}-${item.risk_level}`}>
              <div>
                <strong>{item.skill}</strong>
                <span>{t.riskLevel}: {item.risk_level}</span>
                <span>{t.estimatedDays}: {item.estimated_days}</span>
              </div>
              <p><b>{t.proofArtifact}:</b> {item.proof_artifact}</p>
              <p><b>{t.smallTask}:</b> {item.small_task}</p>
              <p><b>{t.acceptanceCheck}:</b> {item.acceptance_check}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{t.noItems}</p>
      )}
    </Panel>
  );
}

function Structure({ report, t }: { report: AnalysisReport; t: Copy }) {
  return <Panel title={t.structure}><StructureList structure={report.structure} t={t} /></Panel>;
}

function LearningPlan({ report, t }: { report: AnalysisReport; t: Copy }) {
  return (
    <Panel title={t.learningPlan}>
      <ol className="learning-list">
        {report.learning_plan.map((item) => (
          <li key={item.day}>
            <strong>{t.day} {item.day}: {item.focus}</strong>
            <p>{t.action}: {item.action}</p>
            <small>{t.deliverable}: {item.deliverable}</small>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function BulletRubric({ report, t }: { report: AnalysisReport; t: Copy }) {
  return (
    <Panel title={t.bulletRubric}>
      {report.bullet_scores.length ? (
        <ul className="bullet-score-list">
          {report.bullet_scores.map((item) => (
            <li key={item.bullet}>
              <div>
                <strong>{item.score}/100</strong>
                <span>{item.bullet}</span>
              </div>
              <div className="rubric-flags">
                <Flag ok={item.has_action} label={t.hasAction} />
                <Flag ok={item.has_technology} label={t.hasTechnology} />
                <Flag ok={item.has_result} label={t.hasResult} />
                <Flag ok={item.has_metric} label={t.hasMetric} />
              </div>
              <p>{t.suggestion}: {item.suggestion}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{t.noItems}</p>
      )}
    </Panel>
  );
}

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return <span className={ok ? "flag-ok" : "flag-miss"}>{label}</span>;
}

function ApiBadge({ report, t }: { report: AnalysisReport; t: Copy }) {
  const text = report.api_mode === "api_refinement_enabled" ? t.apiEnabled : report.api_mode === "api_failed_fallback" ? t.apiFailed : t.localFallback;
  return <p className={`api-badge ${report.api_mode}`}>{t.apiMode}: {text}</p>;
}

function ScoreBars({ report, t }: { report: AnalysisReport; t: Copy }) {
  const rows = [
    [t.keywordScore, report.score_breakdown.keyword_score],
    [t.semanticScore, report.score_breakdown.semantic_score],
    [t.structureScore, report.score_breakdown.structure_score],
  ] as const;
  return (
    <div className="score-bars">
      {rows.map(([label, value]) => (
        <div className="score-row" key={label}>
          <span>{label}</span>
          <div><i style={{ width: `${value}%` }} /></div>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function StructureList({ structure, t }: { structure: StructureAnalysis; t: Copy }) {
  const signals = Object.values(structure);
  return (
    <ul className="structure-list">
      {signals.map((signal) => (
        <li className={signal.detected ? "ok" : "miss"} key={signal.key}>
          <strong>{signal.label}</strong>
          <span>{signal.detected ? t.detected : t.missing}</span>
          <p>{signal.detail}</p>
        </li>
      ))}
    </ul>
  );
}
