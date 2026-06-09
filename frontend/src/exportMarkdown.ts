import type { ApplicationItem, AnalysisReport, Copy } from "./types";
import { toJobSourceMarkdownSection } from "./jobSource";
import type { JobSourceMetadata } from "./jobSource";

export function toPortfolioCaseStudyMarkdown(report: AnalysisReport, t: Copy, jobSource?: JobSourceMetadata) {
  const exportData = report.portfolio_export;
  return `# ${exportData.headline || "JobFit RAG Portfolio Case Study"}

${t.generated}: ${new Date(report.created_at).toLocaleString()}

${toJobSourceMarkdownSection(t, jobSource)}## ${t.problem}

${exportData.problem || t.noItems}

## ${t.solution}

${exportData.solution || t.noItems}

## ${t.architecture}

${exportData.architecture.map((item) => `- ${item}`).join("\n") || `- ${t.noItems}`}

## ${t.tradeoffs}

${exportData.tradeoffs.map((item) => `- ${item}`).join("\n") || `- ${t.noItems}`}

## ${t.proofArtifacts}

${exportData.proof_artifacts.map((item) => `- ${item}`).join("\n") || `- ${t.noItems}`}

## ${t.readiness}

${exportData.readiness_summary || t.noItems}

## ${t.nextActions}

${exportData.next_actions.map((item) => `- ${item}`).join("\n") || `- ${t.noItems}`}

## ${t.resumeBullet}

- ${exportData.resume_bullet || t.noItems}

## ${t.disclaimerTitle}

${t.disclaimer}
`;
}

export function toInterviewPackMarkdown(report: AnalysisReport, t: Copy, applications: ApplicationItem[], jobSource?: JobSourceMetadata) {
  const linkedApplications = applications.filter((item) => item.report_id === report.id);
  const applicationLines = linkedApplications.length
    ? linkedApplications.map((item) => `- ${item.company} / ${item.role}: ${item.status}. ${t.nextAction}: ${item.next_action || t.noItems}`)
    : [`- ${t.noItems}`];
  const starLines = report.interview_pack.star_answers.length
    ? report.interview_pack.star_answers.flatMap((item, index) => [
        `### ${index + 1}. ${item.skill}`,
        "",
        `- ${t.situation}: ${item.situation}`,
        `- ${t.task}: ${item.task}`,
        `- ${t.action}: ${item.action}`,
        `- ${t.result}: ${item.result}`,
        "",
      ])
    : [`- ${t.noItems}`, ""];
  return `# JobFit RAG ${t.interviewPack}

${t.generated}: ${new Date(report.created_at).toLocaleString()}

${toJobSourceMarkdownSection(t, jobSource)}## ${t.overallMatch}

- ${t.score}: ${report.overall_score}/100
- ${t.reportId}: ${report.id}
- ${report.summary}

## ${t.positioningStatement}

${report.interview_pack.positioning_statement || t.noItems}

## ${t.starAnswers}

${starLines.join("\n")}
## ${t.riskNotes}

${report.interview_pack.risk_notes.map((item) => `- ${item}`).join("\n") || `- ${t.noItems}`}

## ${t.closePitch}

${report.interview_pack.close_pitch || t.noItems}

## ${t.interviewQuestions}

${report.interview_questions.map((item) => `- ${item}`).join("\n") || `- ${t.noItems}`}

## ${t.trackerTitle}

${applicationLines.join("\n")}

## ${t.disclaimerTitle}

${t.disclaimer}
`;
}

export function toMarkdown(report: AnalysisReport, t: Copy, compareReports: AnalysisReport[], jobSource?: JobSourceMetadata) {
  const structureLines = Object.values(report.structure)
    .map((item) => `- ${item.label}: ${item.detected ? t.detected : t.missing}. ${item.detail}`)
    .join("\n");
  const readinessLines = [
    `- ${t.score}: ${report.portfolio_readiness.score}/100`,
    `- ${t.readinessLevel}: ${report.portfolio_readiness.level}`,
    `- ${t.nextBestAction}: ${report.portfolio_readiness.next_best_action || t.noItems}`,
    `- ${t.strengths}: ${report.portfolio_readiness.strengths.join("; ") || t.noItems}`,
    `- ${t.blockers}: ${report.portfolio_readiness.blockers.join("; ") || t.noItems}`,
  ].join("\n");
  const actionLines = report.action_board
    .map((item) => `- [${item.priority}] ${item.title} (${t.source}: ${item.source}, ${t.estimatedDays}: ${item.estimated_days}): ${item.reason} ${t.acceptanceCheck}: ${item.acceptance_check}`)
    .join("\n");
  const learningLines = report.learning_plan
    .map((item) => `- ${t.day} ${item.day} - ${item.focus}: ${item.action} (${t.deliverable}: ${item.deliverable})`)
    .join("\n");
  const proofLines = report.proof_plan
    .map((item) => `- ${item.skill} [${item.risk_level}, ${item.estimated_days}d]: ${t.proofArtifact}: ${item.proof_artifact} ${t.smallTask}: ${item.small_task} ${t.acceptanceCheck}: ${item.acceptance_check}`)
    .join("\n");
  const bulletLines = report.bullet_scores
    .map((item) => `- ${item.score}/100: ${item.bullet} (${item.suggestion})`)
    .join("\n");
  const traceLines = report.evidence_trace
    .map((item) => `- ${item.skill} [${item.status}, ${item.quality}, ${item.quality_score}/100]: ${item.gap_reason} ${item.recommendation}`)
    .join("\n");
  const tailoredLines = [
    `### ${t.tailoredSummary}`,
    report.tailored_resume.summary || t.noItems,
    "",
    `### ${t.matchedSkills}`,
    ...(report.tailored_resume.skills.length ? report.tailored_resume.skills.map((skill) => `- ${skill}`) : [`- ${t.noItems}`]),
    "",
    `### ${t.optimizedBullets}`,
    ...(report.tailored_resume.bullets.length ? report.tailored_resume.bullets.map((item) => `- ${item}`) : [`- ${t.noItems}`]),
    "",
    `### ${t.integrityNote}`,
    report.tailored_resume.integrity_note || t.noItems,
  ].join("\n");
  const caseStudyLines = [
    `- ${t.problem}: ${report.case_study.problem || t.noItems}`,
    `- ${t.solution}: ${report.case_study.solution || t.noItems}`,
    `- ${t.architecture}: ${report.case_study.architecture.join("; ") || t.noItems}`,
    `- ${t.tradeoffs}: ${report.case_study.tradeoffs.join("; ") || t.noItems}`,
    `- ${t.demoTalkTrack}: ${report.case_study.demo_talk_track.join("; ") || t.noItems}`,
  ].join("\n");
  const interviewPackLines = [
    `- ${t.positioningStatement}: ${report.interview_pack.positioning_statement || t.noItems}`,
    `- ${t.starAnswers}: ${report.interview_pack.star_answers.map((item) => item.skill).join(", ") || t.noItems}`,
    `- ${t.riskNotes}: ${report.interview_pack.risk_notes.join("; ") || t.noItems}`,
    `- ${t.closePitch}: ${report.interview_pack.close_pitch || t.noItems}`,
  ].join("\n");
  const compareLines = compareReports.length === 2 ? markdownCompare(compareReports, t) : `- ${t.compareHint}`;
  return `# JobFit RAG Report

${t.generated}: ${new Date(report.created_at).toLocaleString()}

${toJobSourceMarkdownSection(t, jobSource)}## ${t.disclaimerTitle}

${t.disclaimer}

## ${t.overallMatch}

${t.score}: ${report.overall_score}/100

${report.summary}

## ${t.scoreBreakdown}

- ${t.keywordScore}: ${report.score_breakdown.keyword_score}/100
- ${t.semanticScore}: ${report.score_breakdown.semantic_score}/100
- ${t.structureScore}: ${report.score_breakdown.structure_score}/100
- ${t.apiMode}: ${report.api_mode}

## ${t.structure}

${structureLines}

## ${t.readiness}

${readinessLines}

## ${t.actionBoard}

${actionLines || `- ${t.noItems}`}

## ${t.compareTitle}

${compareLines}

## ${t.matchedSkills}

${report.matched_skills.map((skill) => `- ${skill}`).join("\n") || `- ${t.noItems}`}

## ${t.missingSkills}

${report.missing_skills.map((skill) => `- ${skill}`).join("\n") || `- ${t.noItems}`}

## ${t.evidence}

${report.evidence.map((item) => `- ${item.skill} (${item.source === "resume" ? t.resumeSource : t.jdSource}): ${item.quote}`).join("\n")}

## ${t.evidenceTrace}

${traceLines || `- ${t.noItems}`}

## ${t.resumeSuggestions}

${report.resume_suggestions.map((item) => `- ${item}`).join("\n")}

## ${t.optimizedBullets}

${report.optimized_bullets.map((item) => `- ${item}`).join("\n")}

## ${t.learningPlan}

${learningLines || `- ${t.noItems}`}

## ${t.proofPlan}

${proofLines || `- ${t.noItems}`}

## ${t.tailoredResume}

${tailoredLines}

## ${t.caseStudy}

${caseStudyLines}

## ${t.interviewPack}

${interviewPackLines}

## ${t.bulletRubric}

${bulletLines || `- ${t.noItems}`}

## ${t.interviewQuestions}

${report.interview_questions.map((item) => `- ${item}`).join("\n")}
`;
}

function markdownCompare(reports: AnalysisReport[], t: Copy) {
  const [previous, current] = reports;
  const delta = current.overall_score - previous.overall_score;
  const gained = current.matched_skills.filter((skill) => !previous.matched_skills.includes(skill));
  return [
    `- ${t.scoreDelta}: ${delta >= 0 ? "+" : ""}${delta}`,
    `- ${t.gainedSkills}: ${gained.join(", ") || t.noItems}`,
    `- ${t.remainingGaps}: ${current.missing_skills.join(", ") || t.noItems}`,
  ].join("\n");
}
