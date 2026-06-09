param()

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot

function Invoke-NodeCheck {
  $nodeScript = @'
(async () => {
const fs = require("fs");
const path = require("path");
const ts = require("./frontend/node_modules/typescript");

const exportSource = fs.readFileSync(path.join(process.cwd(), "frontend/src/exportMarkdown.ts"), "utf8");
const jobSourceSource = fs.readFileSync(path.join(process.cwd(), "frontend/src/jobSource.ts"), "utf8");
const mainSource = fs.readFileSync(path.join(process.cwd(), "frontend/src/main.tsx"), "utf8");

if (!/analyzeFit\(resumeText, jdText\)/.test(mainSource)) {
  throw new Error("analyzeFit(resumeText, jdText) call not found");
}
if (/analyzeFit\(resumeText, jdText, jobSource\)/.test(mainSource)) {
  throw new Error("jobSource is passed to analyzer");
}

const tempDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "jobfit-export-check-"));
const compilerOptions = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2020,
};
const jobSourceJs = ts.transpileModule(jobSourceSource, { compilerOptions }).outputText;
const exportJs = ts
  .transpileModule(exportSource, { compilerOptions })
  .outputText.replace('from "./jobSource"', 'from "./jobSource.mjs"');
fs.writeFileSync(path.join(tempDir, "jobSource.mjs"), jobSourceJs);
fs.writeFileSync(path.join(tempDir, "exportMarkdown.mjs"), exportJs);
const mod = await import(`file:///${path.join(tempDir, "exportMarkdown.mjs").replace(/\\/g, "/")}`);

const report = {
  id: "report-1",
  created_at: "2026-06-08T00:00:00.000Z",
  overall_score: 90,
  summary: "Strong match",
  score_breakdown: { keyword_score: 90, semantic_score: 91, structure_score: 92 },
  api_mode: "local_fallback",
  structure: { action: { key: "action", label: "Action", detected: true, detail: "ok" } },
  portfolio_readiness: { score: 80, level: "ready", next_best_action: "Ship", strengths: ["React"], blockers: [] },
  action_board: [],
  learning_plan: [],
  proof_plan: [],
  bullet_scores: [],
  evidence_trace: [],
  tailored_resume: { summary: "", skills: [], bullets: [], integrity_note: "" },
  case_study: { problem: "", solution: "", architecture: [], tradeoffs: [], demo_talk_track: [] },
  interview_pack: { positioning_statement: "", star_answers: [], risk_notes: [], close_pitch: "" },
  portfolio_export: { headline: "", problem: "", solution: "", architecture: [], tradeoffs: [], proof_artifacts: [], readiness_summary: "", next_actions: [], resume_bullet: "" },
  matched_skills: [],
  missing_skills: [],
  evidence: [],
  resume_suggestions: [],
  optimized_bullets: [],
  job_requirements: [],
  interview_questions: [],
};

const t = new Proxy({
  generated: "Generated",
  jobSourceTitle: "Job Source",
  jobCompany: "Company",
  jobRole: "Role",
  jobSourceUrl: "Source URL",
  jobCapturedAt: "Captured date",
  noItems: "None",
  score: "Score",
  reportId: "Report ID",
  source: "Source",
  estimatedDays: "Estimated days",
  acceptanceCheck: "Acceptance check",
  resumeSource: "Resume",
  jdSource: "JD",
  detected: "Detected",
  missing: "Missing",
  compareHint: "Select two reports",
}, {
  get(target, prop) {
    return prop in target ? target[prop] : String(prop);
  },
});

const jobSource = {
  company: "Example AI Lab",
  role: "AI Application Developer",
  sourceUrl: "https://example.com/jobs/ai-application-developer",
  capturedAt: "2026-06-08",
};

const outputs = [
  ["report", mod.toMarkdown(report, t, [], jobSource)],
  ["interview pack", mod.toInterviewPackMarkdown(report, t, [], jobSource)],
  ["portfolio case study", mod.toPortfolioCaseStudyMarkdown(report, t, jobSource)],
];
const requiredLines = [
  "## Job Source",
  "- Company: Example AI Lab",
  "- Role: AI Application Developer",
  "- Source URL: https://example.com/jobs/ai-application-developer",
  "- Captured date: 2026-06-08",
];

for (const [name, output] of outputs) {
  for (const line of requiredLines) {
    if (!output.includes(line)) {
      throw new Error(`${name} missing output line: ${line}`);
    }
  }
}

const emptyOutput = mod.toMarkdown(report, t, [], {});
if (emptyOutput.includes("## Job Source")) {
  throw new Error("empty job source should not render");
}

console.log("PASS job source export content");
console.log("PASS empty job source omitted");
console.log("PASS analyzer payload unchanged");
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
'@

  Set-Location $repo
  $nodeScript | node
  if ($LASTEXITCODE -ne 0) {
    throw "Job Source export check failed."
  }
}

Invoke-NodeCheck
Write-Host "PASS check-job-source-export"
