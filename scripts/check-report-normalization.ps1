param()

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot

function Fail {
  param([string]$Message)
  throw $Message
}

Set-Location $repo

$modulePath = Join-Path $repo "frontend/src/reportNormalization.ts"
$mainPath = Join-Path $repo "frontend/src/main.tsx"

if (-not (Test-Path -LiteralPath $modulePath)) {
  Fail "frontend/src/reportNormalization.ts does not exist"
}

$moduleSource = Get-Content -LiteralPath $modulePath -Raw
$mainSource = Get-Content -LiteralPath $mainPath -Raw

if ($moduleSource -notmatch "export function normalizeReport") {
  Fail "reportNormalization module missing normalizeReport export"
}
if ($mainSource -match "function normalizeReport") {
  Fail "main.tsx still defines normalizeReport"
}
if ($mainSource -notmatch 'import \{ normalizeReport \} from "\./reportNormalization"') {
  Fail "main.tsx does not import normalizeReport from reportNormalization"
}

$nodeScript = @'
(async () => {
const fs = require("fs");
const path = require("path");
const os = require("os");
const ts = require("./frontend/node_modules/typescript");

const source = fs.readFileSync(path.join(process.cwd(), "frontend/src/reportNormalization.ts"), "utf8");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jobfit-normalize-check-"));
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
fs.writeFileSync(path.join(tempDir, "reportNormalization.mjs"), js);
const mod = await import(`file:///${path.join(tempDir, "reportNormalization.mjs").replace(/\\/g, "/")}`);

const legacyReport = {
  id: "report-1",
  created_at: "2026-06-08T00:00:00.000Z",
  overall_score: 63,
  score_breakdown: { keyword_score: 60, semantic_score: 61, structure_score: 62 },
  api_mode: "local_fallback",
  structure: {
    contact_info: { key: "contact_info", label: "Contact", detected: true, detail: "ok" },
    summary_section: { key: "summary_section", label: "Summary", detected: true, detail: "ok" },
    skills_section: { key: "skills_section", label: "Skills", detected: true, detail: "ok" },
    experience_evidence: { key: "experience_evidence", label: "Experience", detected: true, detail: "ok" },
    measurable_impact: { key: "measurable_impact", label: "Impact", detected: false, detail: "missing" },
  },
  summary: "legacy",
  matched_skills: ["React"],
  missing_skills: ["SQL"],
  job_requirements: [],
  evidence: [],
  resume_suggestions: [],
  optimized_bullets: [],
  interview_questions: [],
  evidence_trace: [
    { skill: "SQL", status: "missing", resume_evidence: "", jd_evidence: "SQL", gap_reason: "gap", recommendation: "prove" },
    { skill: "React", status: "matched", resume_evidence: "React", jd_evidence: "React", gap_reason: "", recommendation: "" },
  ],
};

const normalized = mod.normalizeReport(legacyReport);
const checks = [
  ["learning_plan", Array.isArray(normalized.learning_plan) && normalized.learning_plan.length === 0],
  ["proof_plan", Array.isArray(normalized.proof_plan) && normalized.proof_plan.length === 0],
  ["bullet_scores", Array.isArray(normalized.bullet_scores) && normalized.bullet_scores.length === 0],
  ["action_board", Array.isArray(normalized.action_board) && normalized.action_board.length === 0],
  ["tailored_resume", normalized.tailored_resume?.summary === "" && Array.isArray(normalized.tailored_resume.skills)],
  ["case_study", normalized.case_study?.problem === "" && normalized.case_study?.solution === "" && Array.isArray(normalized.case_study.architecture)],
  ["interview_pack", normalized.interview_pack?.positioning_statement === "" && Array.isArray(normalized.interview_pack.star_answers)],
  ["portfolio_readiness", normalized.portfolio_readiness?.level === "draft" && normalized.portfolio_readiness.score === 0],
  ["portfolio_export", normalized.portfolio_export?.headline === "" && Array.isArray(normalized.portfolio_export.next_actions)],
  ["missing quality", normalized.evidence_trace[0].quality === "missing" && normalized.evidence_trace[0].quality_score === 0],
  ["matched quality", normalized.evidence_trace[1].quality === "weak" && normalized.evidence_trace[1].quality_score === 55],
];

for (const [name, ok] of checks) {
  if (!ok) throw new Error(`normalization failed: ${name}`);
}

const currentReport = {
  ...legacyReport,
  learning_plan: [{ day: 1, focus: "Keep", action: "Do", deliverable: "Done" }],
  evidence_trace: [{ ...legacyReport.evidence_trace[1], quality: "direct", quality_score: 90 }],
  portfolio_readiness: { score: 70, level: "ready", strengths: ["React"], blockers: [], next_best_action: "Ship" },
};
const preserved = mod.normalizeReport(currentReport);
if (preserved.learning_plan.length !== 1) throw new Error("existing learning_plan not preserved");
if (preserved.evidence_trace[0].quality !== "direct" || preserved.evidence_trace[0].quality_score !== 90) {
  throw new Error("existing evidence quality not preserved");
}
if (preserved.portfolio_readiness.level !== "ready" || preserved.portfolio_readiness.score !== 70) {
  throw new Error("existing readiness not preserved");
}

console.log("PASS report normalization defaults");
console.log("PASS report normalization preserves current fields");
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
'@

$nodeScript | node
if ($LASTEXITCODE -ne 0) {
  Fail "report normalization behavior check failed"
}

Write-Host "PASS check-report-normalization"
