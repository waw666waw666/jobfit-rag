param(
  [string]$BackendUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

function Fail {
  param([string]$Message)
  throw $Message
}

function Invoke-Api {
  param(
    [string]$Path,
    [string]$Method = "GET",
    [string]$Body = "",
    [string]$ContentType = "application/json"
  )

  try {
    if ($Body) {
      return Invoke-RestMethod -Uri "$BackendUrl$Path" -Method $Method -Body $Body -ContentType $ContentType
    }
    return Invoke-RestMethod -Uri "$BackendUrl$Path" -Method $Method
  } catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode) {
      throw "HTTP status $statusCode from $Method $Path; response body redacted."
    }
    throw "$Method $Path failed; error detail redacted."
  }
}

function Assert-TextContains {
  param(
    [string]$Name,
    [string]$Text,
    [string[]]$Needles
  )
  foreach ($needle in $Needles) {
    if (-not $Text.Contains($needle)) {
      Fail "$Name missing '$needle'"
    }
  }
}

function Assert-NotBlank {
  param(
    [string]$Name,
    [object]$Value
  )
  if ($null -eq $Value) {
    Fail "$Name is null"
  }
  if ($Value -is [string] -and [string]::IsNullOrWhiteSpace($Value)) {
    Fail "$Name is blank"
  }
  if ($Value -is [array] -and $Value.Count -eq 0) {
    Fail "$Name is empty"
  }
}

function Build-ReportMarkdown {
  param([object]$Report)
  @"
# JobFit RAG Report

## Disclaimer
This is a job-fit guidance score, not a hiring prediction.

## Overall Match
$($Report.overall_score)/100

## Score Breakdown
Keyword: $($Report.score_breakdown.keyword_score)
Semantic: $($Report.score_breakdown.semantic_score)
Structure: $($Report.score_breakdown.structure_score)
API Mode: $($Report.api_mode)

## Structure
$($Report.structure | ConvertTo-Json -Compress)

## Readiness
$($Report.portfolio_readiness.score)/100
$($Report.portfolio_readiness.next_best_action)

## Action Board
$($Report.action_board | ConvertTo-Json -Compress)

## Matched Skills
$($Report.matched_skills -join ", ")

## Missing Skills
$($Report.missing_skills -join ", ")

## Evidence Trace
$($Report.evidence_trace | ConvertTo-Json -Compress)

## Resume Suggestions
$($Report.resume_suggestions -join "`n")

## Optimized Bullets
$($Report.optimized_bullets -join "`n")

## Learning Plan
$($Report.learning_plan | ConvertTo-Json -Compress)

## Proof Plan
$($Report.proof_plan | ConvertTo-Json -Compress)

## Tailored Resume
$($Report.tailored_resume | ConvertTo-Json -Compress)

## Case Study
$($Report.case_study | ConvertTo-Json -Compress)

## Interview Pack
$($Report.interview_pack | ConvertTo-Json -Compress)

## Bullet Rubric
$($Report.bullet_scores | ConvertTo-Json -Compress)

## Interview Questions
$($Report.interview_questions -join "`n")
"@
}

function Build-InterviewMarkdown {
  param([object]$Report)
  @"
# JobFit RAG Interview Pack

## Overall Match
$($Report.overall_score)/100

## Positioning Statement
$($Report.interview_pack.positioning_statement)

## STAR Answers
$($Report.interview_pack.star_answers | ConvertTo-Json -Compress)

## Risk Notes
$($Report.interview_pack.risk_notes -join "`n")

## Close Pitch
$($Report.interview_pack.close_pitch)

## Interview Questions
$($Report.interview_questions -join "`n")

## Disclaimer
This is guidance, not a hiring prediction.
"@
}

function Build-PortfolioMarkdown {
  param([object]$Report)
  $export = $Report.portfolio_export
  @"
# $($export.headline)

## Problem
$($export.problem)

## Solution
$($export.solution)

## Architecture
$($export.architecture -join "`n")

## Trade-offs
$($export.tradeoffs -join "`n")

## Proof Artifacts
$($export.proof_artifacts -join "`n")

## Readiness
$($export.readiness_summary)

## Next Actions
$($export.next_actions -join "`n")

## Resume Bullet
$($export.resume_bullet)

## Disclaimer
This is guidance, not a hiring prediction.
"@
}

Write-Host "RUN  markdown quality"

$body = @{
  resume_text = "Jane jane@example.com Summary AI application developer focused on local-first tools. Skills React TypeScript Docker FastAPI RAG SQL Testing Projects Built a Dockerized React FastAPI RAG analyzer with SQL persistence and pytest coverage that reduced resume review time by 35%."
  jd_text = "Need React TypeScript Docker FastAPI RAG SQL Testing and clear product thinking."
} | ConvertTo-Json

$report = Invoke-Api -Path "/api/analyze" -Method Post -Body $body -ContentType "application/json"

Assert-NotBlank "portfolio_export.headline" $report.portfolio_export.headline
Assert-NotBlank "interview_pack.positioning_statement" $report.interview_pack.positioning_statement
Assert-NotBlank "evidence_trace" $report.evidence_trace
Assert-NotBlank "learning_plan" $report.learning_plan
Assert-NotBlank "bullet_scores" $report.bullet_scores

$reportMarkdown = Build-ReportMarkdown $report
$interviewMarkdown = Build-InterviewMarkdown $report
$portfolioMarkdown = Build-PortfolioMarkdown $report

Assert-TextContains "report markdown" $reportMarkdown @(
  "# JobFit RAG Report",
  "## Disclaimer",
  "## Overall Match",
  "## Score Breakdown",
  "## Structure",
  "## Readiness",
  "## Action Board",
  "## Matched Skills",
  "## Missing Skills",
  "## Evidence Trace",
  "## Resume Suggestions",
  "## Optimized Bullets",
  "## Learning Plan",
  "## Proof Plan",
  "## Tailored Resume",
  "## Case Study",
  "## Interview Pack",
  "## Bullet Rubric",
  "## Interview Questions",
  "React",
  "Docker"
)

Assert-TextContains "interview markdown" $interviewMarkdown @(
  "# JobFit RAG Interview Pack",
  "## Overall Match",
  "## Positioning Statement",
  "## STAR Answers",
  "## Risk Notes",
  "## Close Pitch",
  "## Interview Questions",
  "## Disclaimer"
)

Assert-TextContains "portfolio markdown" $portfolioMarkdown @(
  "# JobFit RAG",
  "## Problem",
  "## Solution",
  "## Architecture",
  "## Trade-offs",
  "## Proof Artifacts",
  "## Readiness",
  "## Next Actions",
  "## Resume Bullet",
  "## Disclaimer"
)

Write-Host "PASS markdown quality"
