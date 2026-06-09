param()

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot

function Fail {
  param([string]$Message)
  throw $Message
}

Set-Location $repo

$modulePath = Join-Path $repo "frontend/src/applicationTracker.ts"
$mainPath = Join-Path $repo "frontend/src/main.tsx"
$apiPath = Join-Path $repo "frontend/src/api.ts"

if (-not (Test-Path -LiteralPath $modulePath)) {
  Fail "frontend/src/applicationTracker.ts does not exist"
}

$moduleSource = Get-Content -LiteralPath $modulePath -Raw
$mainSource = Get-Content -LiteralPath $mainPath -Raw
$apiSource = Get-Content -LiteralPath $apiPath -Raw

foreach ($pattern in @(
  "export type ApplicationDraft",
  "export function buildApplicationPayload",
  "export function emptyApplicationDraft",
  "export function buildAppliedApplicationPayload"
)) {
  if ($moduleSource -notmatch $pattern) {
    Fail "applicationTracker module missing pattern: $pattern"
  }
}

if ($mainSource -notmatch 'from "\./applicationTracker"') {
  Fail "main.tsx does not import applicationTracker module"
}
foreach ($pattern in @(
  "company\.trim\(\)",
  "role\.trim\(\)",
  "nextAction\.trim\(\)",
  "createApplication\(\s*\{"
)) {
  if ($mainSource -match $pattern) {
    Fail "main.tsx still owns application payload primitive: $pattern"
  }
}

if ($apiSource -notmatch "buildAppliedApplicationPayload") {
  Fail "api.ts does not use buildAppliedApplicationPayload"
}
if ($apiSource -match "Follow up in 7 days\.") {
  Fail "api.ts still owns applied fallback copy"
}

$nodeScript = @'
(async () => {
const fs = require("fs");
const path = require("path");
const os = require("os");
const ts = require("./frontend/node_modules/typescript");

const source = fs.readFileSync(path.join(process.cwd(), "frontend/src/applicationTracker.ts"), "utf8");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jobfit-application-check-"));
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
fs.writeFileSync(path.join(tempDir, "applicationTracker.mjs"), js);
const mod = await import(`file:///${path.join(tempDir, "applicationTracker.mjs").replace(/\\/g, "/")}`);

const payload = mod.buildApplicationPayload(
  { company: "  Example AI Lab  ", role: "  AI Developer  ", nextAction: "  Send resume  " },
  "report-1"
);
if (payload.company !== "Example AI Lab") throw new Error("company not trimmed");
if (payload.role !== "AI Developer") throw new Error("role not trimmed");
if (payload.next_action !== "Send resume") throw new Error("next action not trimmed");
if (payload.report_id !== "report-1") throw new Error("report id not preserved");

const noReportPayload = mod.buildApplicationPayload(
  { company: "Example", role: "Role", nextAction: "" },
  undefined
);
if (noReportPayload.report_id !== null) throw new Error("missing report id should become null");
if (noReportPayload.next_action !== "") throw new Error("empty next action should stay empty string");

if (mod.buildApplicationPayload({ company: " ", role: "Role", nextAction: "x" }, "report-1") !== null) {
  throw new Error("blank company should block payload");
}
if (mod.buildApplicationPayload({ company: "Company", role: " ", nextAction: "x" }, "report-1") !== null) {
  throw new Error("blank role should block payload");
}

const empty = mod.emptyApplicationDraft();
if (empty.company !== "" || empty.role !== "" || empty.nextAction !== "") throw new Error("empty draft mismatch");

const appliedExisting = mod.buildAppliedApplicationPayload({ next_action: "Custom follow-up" });
if (appliedExisting.status !== "applied" || appliedExisting.next_action !== "Custom follow-up") {
  throw new Error("existing applied next action not preserved");
}
const appliedFallback = mod.buildAppliedApplicationPayload({ next_action: "" });
if (appliedFallback.status !== "applied" || appliedFallback.next_action !== "Follow up in 7 days.") {
  throw new Error("applied fallback mismatch");
}

console.log("PASS application create payload");
console.log("PASS application applied payload");
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
'@

$nodeScript | node
if ($LASTEXITCODE -ne 0) {
  Fail "application tracker behavior check failed"
}

Write-Host "PASS check-application-tracker"
