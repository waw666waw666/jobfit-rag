param(
  [string]$BackendUrl = "http://localhost:8000",
  [string]$OutputPath = "",
  [switch]$UpdateSnapshot
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$snapshotPath = if ($OutputPath) { $OutputPath } else { Join-Path $repo "docs/openapi.json" }

function Invoke-Api {
  param(
    [string]$Path,
    [string]$Method = "GET"
  )

  try {
    return Invoke-RestMethod -Uri "$BackendUrl$Path" -Method $Method
  } catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode) {
      throw "HTTP status $statusCode from $Method $Path; response body redacted."
    }
    throw "$Method $Path failed; error detail redacted."
  }
}

function Fail {
  param([string]$Message)
  throw $Message
}

function Assert-PathMethod {
  param(
    [object]$Spec,
    [string]$Path,
    [string]$Method
  )
  $pathItem = $Spec.paths.$Path
  if ($null -eq $pathItem) {
    Fail "Missing OpenAPI path $Path"
  }
  if ($null -eq $pathItem.$Method) {
    Fail "Missing OpenAPI method $($Method.ToUpper()) $Path"
  }
}

function Assert-Schema {
  param(
    [object]$Spec,
    [string]$Name
  )
  if ($null -eq $Spec.components.schemas.$Name) {
    Fail "Missing OpenAPI schema $Name"
  }
}

function Assert-SchemaField {
  param(
    [object]$Spec,
    [string]$SchemaName,
    [string]$FieldName
  )
  $schema = $Spec.components.schemas.$SchemaName
  if ($null -eq $schema) {
    Fail "Missing OpenAPI schema $SchemaName"
  }
  if ($null -eq $schema.properties.$FieldName) {
    Fail "Missing field $SchemaName.$FieldName"
  }
}

Write-Host "RUN  api contract"

$spec = Invoke-Api "/openapi.json"

if ($spec.info.title -ne "JobFit RAG API") {
  Fail "Unexpected OpenAPI title: $($spec.info.title)"
}

if (-not $spec.openapi.StartsWith("3.")) {
  Fail "Unexpected OpenAPI version: $($spec.openapi)"
}

Assert-PathMethod $spec "/health" "get"
Assert-PathMethod $spec "/api/analyze" "post"
Assert-PathMethod $spec "/api/resume-matrix" "post"
Assert-PathMethod $spec "/api/parse-resume" "post"
Assert-PathMethod $spec "/api/reports" "get"
Assert-PathMethod $spec "/api/reports/{report_id}" "get"
Assert-PathMethod $spec "/api/reports/{report_id}" "delete"
Assert-PathMethod $spec "/api/reports-export" "get"
Assert-PathMethod $spec "/api/reports-import" "post"
Assert-PathMethod $spec "/api/applications" "get"
Assert-PathMethod $spec "/api/applications" "post"
Assert-PathMethod $spec "/api/applications/{application_id}" "patch"

Assert-Schema $spec "AnalyzeRequest"
Assert-Schema $spec "ResumeMatrixRequest"
Assert-Schema $spec "ResumeMatrixReport"
Assert-Schema $spec "ResumeVersionInput"
Assert-Schema $spec "ResumeVersionMatrixItem"
Assert-Schema $spec "AnalysisReport-Output"
Assert-Schema $spec "ScoreBreakdown"
Assert-Schema $spec "EvidenceTraceItem"
Assert-Schema $spec "PortfolioReadiness"
Assert-Schema $spec "ActionBoardItem"
Assert-Schema $spec "PortfolioExport"
Assert-Schema $spec "InterviewPack"
Assert-Schema $spec "ReportsExport-Input"
Assert-Schema $spec "ReportsExport-Output"
Assert-Schema $spec "ApplicationItem"

Assert-SchemaField $spec "AnalyzeRequest" "resume_text"
Assert-SchemaField $spec "AnalyzeRequest" "jd_text"
Assert-SchemaField $spec "ResumeMatrixRequest" "jd_text"
Assert-SchemaField $spec "ResumeMatrixRequest" "versions"
Assert-SchemaField $spec "ResumeMatrixReport" "best_version"
Assert-SchemaField $spec "ResumeMatrixReport" "score_delta"
Assert-SchemaField $spec "ResumeMatrixReport" "versions"
Assert-SchemaField $spec "ResumeVersionMatrixItem" "label"
Assert-SchemaField $spec "ResumeVersionMatrixItem" "overall_score"
Assert-SchemaField $spec "ResumeVersionMatrixItem" "gained_skills"
Assert-SchemaField $spec "ResumeVersionMatrixItem" "remaining_gaps"
Assert-SchemaField $spec "AnalysisReport-Output" "overall_score"
Assert-SchemaField $spec "AnalysisReport-Output" "score_breakdown"
Assert-SchemaField $spec "AnalysisReport-Output" "matched_skills"
Assert-SchemaField $spec "AnalysisReport-Output" "missing_skills"
Assert-SchemaField $spec "AnalysisReport-Output" "evidence_trace"
Assert-SchemaField $spec "AnalysisReport-Output" "portfolio_readiness"
Assert-SchemaField $spec "AnalysisReport-Output" "action_board"
Assert-SchemaField $spec "AnalysisReport-Output" "portfolio_export"
Assert-SchemaField $spec "AnalysisReport-Output" "interview_pack"
Assert-SchemaField $spec "PortfolioReadiness" "score"
Assert-SchemaField $spec "PortfolioReadiness" "level"
Assert-SchemaField $spec "PortfolioReadiness" "next_best_action"
Assert-SchemaField $spec "ActionBoardItem" "priority"
Assert-SchemaField $spec "ActionBoardItem" "acceptance_check"
Assert-SchemaField $spec "PortfolioExport" "headline"
Assert-SchemaField $spec "PortfolioExport" "resume_bullet"
Assert-SchemaField $spec "ApplicationItem" "company"
Assert-SchemaField $spec "ApplicationItem" "role"
Assert-SchemaField $spec "ApplicationItem" "status"

$json = $spec | ConvertTo-Json -Depth 100

if ($UpdateSnapshot -or $OutputPath) {
  Set-Content -LiteralPath $snapshotPath -Value $json -Encoding UTF8
  Write-Host "PASS api contract snapshot updated: $snapshotPath"
} else {
  if (-not (Test-Path -LiteralPath $snapshotPath)) {
    Fail "OpenAPI snapshot not found: $snapshotPath. Re-run with -UpdateSnapshot to create it."
  }

  $currentComparable = $spec | ConvertTo-Json -Depth 100 -Compress
  $snapshotComparable = (Get-Content -LiteralPath $snapshotPath -Raw | ConvertFrom-Json) | ConvertTo-Json -Depth 100 -Compress
  if ($currentComparable -ne $snapshotComparable) {
    Fail "OpenAPI snapshot differs: $snapshotPath. Re-run with -UpdateSnapshot to refresh it intentionally."
  }

  Write-Host "PASS api contract"
}
