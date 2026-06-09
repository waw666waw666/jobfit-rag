param()

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot

function Fail {
  param([string]$Message)
  throw $Message
}

Set-Location $repo

$modulePath = Join-Path $repo "frontend/src/markdownDownloads.ts"
$mainPath = Join-Path $repo "frontend/src/main.tsx"

if (-not (Test-Path -LiteralPath $modulePath)) {
  Fail "frontend/src/markdownDownloads.ts does not exist"
}

$moduleSource = Get-Content -LiteralPath $modulePath -Raw
$mainSource = Get-Content -LiteralPath $mainPath -Raw

foreach ($pattern in @(
  "export type MarkdownDownload",
  "export function downloadMarkdownFile",
  "export function buildMarkdownFilename"
)) {
  if ($moduleSource -notmatch $pattern) {
    Fail "markdownDownloads module missing pattern: $pattern"
  }
}

foreach ($pattern in @(
  "new Blob",
  "URL\.createObjectURL",
  "URL\.revokeObjectURL"
)) {
  if ($mainSource -match $pattern) {
    Fail "main.tsx still owns browser download primitive: $pattern"
  }
}

foreach ($pattern in @(
  "downloadMarkdownFile",
  "buildMarkdownFilename"
)) {
  if ($mainSource -notmatch $pattern) {
    Fail "main.tsx missing markdown download module use: $pattern"
  }
}

$nodeScript = @'
(async () => {
const fs = require("fs");
const path = require("path");
const os = require("os");
const ts = require("./frontend/node_modules/typescript");

const source = fs.readFileSync(path.join(process.cwd(), "frontend/src/markdownDownloads.ts"), "utf8");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jobfit-download-check-"));
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
fs.writeFileSync(path.join(tempDir, "markdownDownloads.mjs"), js);
const mod = await import(`file:///${path.join(tempDir, "markdownDownloads.mjs").replace(/\\/g, "/")}`);

const cases = [
  ["report", "en", "abcdef123456", "jobfit-report-en-abcdef12.md"],
  ["interview-pack", "zh", "1234567890ab", "jobfit-interview-pack-zh-12345678.md"],
  ["portfolio-case-study", "en", "fedcba987654", "jobfit-portfolio-case-study-en-fedcba98.md"],
];

for (const [kind, language, reportId, expected] of cases) {
  const actual = mod.buildMarkdownFilename(kind, language, reportId);
  if (actual !== expected) {
    throw new Error(`${kind} filename mismatch: ${actual}`);
  }
}

if (mod.buildMarkdownFilename("report", "en", undefined) !== "jobfit-report-en-unknown.md") {
  throw new Error("missing report id fallback mismatch");
}

console.log("PASS markdown filename builder");
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
'@

$nodeScript | node
if ($LASTEXITCODE -ne 0) {
  Fail "markdown download module behavior check failed"
}

Write-Host "PASS check-markdown-downloads"
