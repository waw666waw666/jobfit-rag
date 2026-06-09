param()

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot

function Fail {
  param([string]$Message)
  throw $Message
}

Set-Location $repo

$modulePath = Join-Path $repo "frontend/src/reportHistory.ts"
$mainPath = Join-Path $repo "frontend/src/main.tsx"

if (-not (Test-Path -LiteralPath $modulePath)) {
  Fail "frontend/src/reportHistory.ts does not exist"
}

$moduleSource = Get-Content -LiteralPath $modulePath -Raw
$mainSource = Get-Content -LiteralPath $mainPath -Raw

foreach ($pattern in @(
  "export function isCompareReportSelected",
  "export function removeCompareReport",
  "export function appendCompareReport",
  "export function clearDeletedReport"
)) {
  if ($moduleSource -notmatch $pattern) {
    Fail "reportHistory module missing pattern: $pattern"
  }
}

if ($mainSource -notmatch 'from "\./reportHistory"') {
  Fail "main.tsx does not import reportHistory module"
}

foreach ($pattern in @(
  "compareReports\.some",
  "compareReports\.filter",
  "compareReports\.slice"
)) {
  if ($mainSource -match $pattern) {
    Fail "main.tsx still owns compare selection primitive: $pattern"
  }
}

$nodeScript = @'
(async () => {
const fs = require("fs");
const path = require("path");
const os = require("os");
const ts = require("./frontend/node_modules/typescript");

const source = fs.readFileSync(path.join(process.cwd(), "frontend/src/reportHistory.ts"), "utf8");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jobfit-history-check-"));
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
fs.writeFileSync(path.join(tempDir, "reportHistory.mjs"), js);
const mod = await import(`file:///${path.join(tempDir, "reportHistory.mjs").replace(/\\/g, "/")}`);

const reportA = { id: "a", summary: "A" };
const reportB = { id: "b", summary: "B" };
const reportC = { id: "c", summary: "C" };
const deletedA = { id: "a" };
const deletedC = { id: "c" };

if (!mod.isCompareReportSelected([reportA], "a")) throw new Error("selected report not detected");
if (mod.isCompareReportSelected([reportA], "b")) throw new Error("unselected report detected");

const removed = mod.removeCompareReport([reportA, reportB], "a");
if (removed.length !== 1 || removed[0].id !== "b") throw new Error("removeCompareReport failed");

const appendedOne = mod.appendCompareReport([], reportA);
if (appendedOne.length !== 1 || appendedOne[0].id !== "a") throw new Error("append first report failed");

const appendedTwo = mod.appendCompareReport([reportA], reportB);
if (appendedTwo.length !== 2 || appendedTwo[0].id !== "a" || appendedTwo[1].id !== "b") {
  throw new Error("append second report failed");
}

const capped = mod.appendCompareReport([reportA, reportB], reportC);
if (capped.length !== 2 || capped[0].id !== "b" || capped[1].id !== "c") {
  throw new Error("appendCompareReport should keep the latest two reports");
}

if (mod.clearDeletedReport(reportA, deletedA) !== null) throw new Error("deleted current report not cleared");
if (mod.clearDeletedReport(reportA, deletedC)?.id !== "a") throw new Error("unrelated delete cleared current report");
if (mod.clearDeletedReport(null, deletedA) !== null) throw new Error("null current report not preserved");

console.log("PASS report history selection");
console.log("PASS report delete current-state rule");
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
'@

$nodeScript | node
if ($LASTEXITCODE -ne 0) {
  Fail "report history behavior check failed"
}

Write-Host "PASS check-report-history"
