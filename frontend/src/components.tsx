import type { ReactNode } from "react";
import type { AnalysisReport, ApplicationItem, Copy, ResumeMatrixReport } from "./types";

export function MiniPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="mini-panel">
      <h2>{title}</h2>
      <ol>{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol>
    </article>
  );
}

export function DemoNotice({ t }: { t: Copy }) {
  return (
    <div className="demo-notice">
      <strong>{t.demoTitle}</strong>
      <span>{t.demoBody}</span>
    </div>
  );
}

export function ComparePanel({ reports, t }: { reports: AnalysisReport[]; t: Copy }) {
  if (!reports.length) {
    return (
      <section className="compare-panel">
        <div className="panel-header">
          <h2>{t.compareTitle}</h2>
        </div>
        <p className="muted">{t.compareHint}</p>
      </section>
    );
  }
  if (reports.length < 2) {
    return (
      <section className="compare-panel">
        <div className="panel-header">
          <h2>{t.compareTitle}</h2>
        </div>
        <p className="muted">{t.compareHint}</p>
        <CompareMini report={reports[0]} />
      </section>
    );
  }
  const [previous, current] = reports;
  const delta = current.overall_score - previous.overall_score;
  const gained = current.matched_skills.filter((skill) => !previous.matched_skills.includes(skill));
  const remaining = current.missing_skills;
  return (
    <section className="compare-panel">
      <div className="panel-header">
        <h2>{t.compareTitle}</h2>
      </div>
      <div className="compare-grid">
        <CompareMini report={previous} />
        <CompareMini report={current} />
      </div>
      <div className="compare-metrics">
        <span>{t.scoreDelta}: <strong>{delta >= 0 ? "+" : ""}{delta}</strong></span>
        <span>{t.gainedSkills}: <strong>{gained.join(", ") || t.noItems}</strong></span>
        <span>{t.remainingGaps}: <strong>{remaining.join(", ") || t.noItems}</strong></span>
      </div>
    </section>
  );
}

function CompareMini({ report }: { report: AnalysisReport }) {
  return (
    <div className="compare-mini">
      <strong>{report.overall_score}/100</strong>
      <span>{report.summary}</span>
    </div>
  );
}

export function FastActionPanels({ report, t }: { report: AnalysisReport; t: Copy }) {
  const sprintItems = report.action_board.slice(0, 3);
  const riskItems = report.evidence_trace
    .filter((item) => item.quality !== "direct")
    .sort((a, b) => a.quality_score - b.quality_score)
    .slice(0, 3);

  return (
    <section className="fast-panels" aria-labelledby="fast-actions-title">
      <h2 className="visually-hidden" id="fast-actions-title">{t.fastActionsTitle}</h2>
      <Panel title={t.prioritySprintTitle}>
        <p className="muted">{t.prioritySprintHint}</p>
        {sprintItems.length ? (
          <ol className="fast-list">
            {sprintItems.map((item) => (
              <li key={`${item.priority}-${item.skill}-${item.title}`}>
                <strong>{item.title}</strong>
                <span>{t.skill}: {item.skill}</span>
                <small>{t.acceptanceCheck}: {item.acceptance_check}</small>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">{t.noItems}</p>
        )}
      </Panel>
      <Panel title={t.riskRadarTitle}>
        <p className="muted">{t.riskRadarHint}</p>
        {riskItems.length ? (
          <ol className="fast-list risk-list">
            {riskItems.map((item) => (
              <li className={item.quality} key={`${item.skill}-${item.status}-${item.quality}`}>
                <strong>{item.skill}</strong>
                <span>{t.evidenceQuality}: {item.quality} · {item.quality_score}/100</span>
                <small>{item.recommendation}</small>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">{t.noItems}</p>
        )}
      </Panel>
    </section>
  );
}

export function TrackerPanel({
  applications,
  company,
  role,
  nextAction,
  setCompany,
  setRole,
  setNextAction,
  addApplication,
  markApplied,
  t,
}: {
  applications: ApplicationItem[];
  company: string;
  role: string;
  nextAction: string;
  setCompany: (value: string) => void;
  setRole: (value: string) => void;
  setNextAction: (value: string) => void;
  addApplication: () => void;
  markApplied: (item: ApplicationItem) => void;
  t: Copy;
}) {
  return (
    <section className="tracker-panel">
      <div className="panel-header">
        <h2>{t.trackerTitle}</h2>
      </div>
      <div className="tracker-form">
        <input aria-label={t.company} value={company} onChange={(event) => setCompany(event.target.value)} placeholder={t.company} />
        <input aria-label={t.role} value={role} onChange={(event) => setRole(event.target.value)} placeholder={t.role} />
        <input aria-label={t.nextAction} value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder={t.nextAction} />
        <button className="secondary" onClick={addApplication} type="button">{t.addTarget}</button>
      </div>
      {applications.length ? (
        <ul className="tracker-list">
          {applications.slice(0, 5).map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.company}</strong>
                <span>{item.role}</span>
              </div>
              <small>{t.status}: {item.status}</small>
              <small>{t.nextAction}: {item.next_action || t.noItems}</small>
              <button className="ghost compact" onClick={() => markApplied(item)} type="button">{t.markApplied}</button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{t.noApplications}</p>
      )}
    </section>
  );
}

export function ResumeMatrixPanel({
  matrixResumeText,
  setMatrixResumeText,
  runResumeMatrix,
  canRunMatrix,
  matrixReport,
  matrixLoading,
  t,
}: {
  matrixResumeText: string;
  setMatrixResumeText: (value: string) => void;
  runResumeMatrix: () => void;
  canRunMatrix: boolean;
  matrixReport: ResumeMatrixReport | null;
  matrixLoading: boolean;
  t: Copy;
}) {
  return (
    <section className="matrix-panel">
      <div className="panel-header">
        <h2>{t.matrixTitle}</h2>
        <button className="secondary" disabled={!canRunMatrix} onClick={runResumeMatrix} type="button">
          {matrixLoading ? t.analyzing : t.runMatrix}
        </button>
      </div>
      <p className="muted">{t.matrixHint}</p>
      <label className="field compact-field">
        <span>{t.matrixTailored}</span>
        <textarea
          id="matrix-resume-text"
          value={matrixResumeText}
          onChange={(event) => setMatrixResumeText(event.target.value)}
          placeholder={t.resumePlaceholder}
        />
      </label>
      {matrixReport ? (
        <div className="matrix-result" aria-live="polite">
          <div>
            <strong>{t.matrixBest}: {matrixReport.best_version}</strong>
            <span>{t.scoreDelta}: {matrixReport.score_delta >= 0 ? "+" : ""}{matrixReport.score_delta}</span>
          </div>
          <ul>
            {matrixReport.versions.map((item) => (
              <li key={item.label}>
                <strong>{item.label}: {item.overall_score}/100</strong>
                <span>{t.readiness}: {item.readiness_score}/100</span>
                <span>{t.gainedSkills}: {item.gained_skills.join(", ") || t.noItems}</span>
                <span>{t.remainingGaps}: {item.remaining_gaps.join(", ") || t.noItems}</span>
              </li>
            ))}
          </ul>
          <BulletList items={matrixReport.recommendations} />
        </div>
      ) : null}
    </section>
  );
}

export function EmptyReport({ t }: { t: Copy }) {
  return <section className="empty-state"><h2>{t.emptyTitle}</h2><p>{t.emptyBody}</p></section>;
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <article className="panel"><h3>{title}</h3>{children}</article>;
}

export function BulletList({ items }: { items: string[] }) {
  return <ul className="bullet-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

export function TagList({ items, tone, emptyText }: { items: string[]; tone: "good" | "warn"; emptyText: string }) {
  if (!items.length) return <p className="muted">{emptyText}</p>;
  return <div className="tags">{items.map((item) => <span className={tone} key={item}>{item}</span>)}</div>;
}
