param(
  [string]$BackendUrl = "http://localhost:8000",
  [string]$FixturePath = ""
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
if (-not $FixturePath) {
  $FixturePath = Join-Path $repo "docs/evaluation-fixtures.json"
}

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

function Assert-ContainsAll {
  param(
    [string]$Name,
    [object[]]$Actual,
    [object[]]$Expected
  )
  foreach ($item in $Expected) {
    if ($Actual -notcontains $item) {
      Fail "$Name missing expected item. Actual values redacted."
    }
  }
}

function Assert-SectionPresent {
  param(
    [object]$Report,
    [string]$Section
  )
  $value = $Report.$Section
  if ($null -eq $value) {
    Fail "Missing section '$Section'"
  }
  if ($value -is [array] -and $value.Count -eq 0) {
    Fail "Section '$Section' is empty"
  }
}

Set-Location $repo

Write-Host "RUN  evaluation fixtures"

if (-not (Test-Path $FixturePath)) {
  Fail "Fixture file not found: $FixturePath"
}

$bundle = Get-Content -LiteralPath $FixturePath -Raw | ConvertFrom-Json
if ($bundle.version -ne "jobfit-rag-evaluation-v1") {
  Fail "Unexpected fixture version: $($bundle.version)"
}

foreach ($case in $bundle.cases) {
  Write-Host "RUN  fixture $($case.id)"
  $body = @{
    resume_text = $case.resume_text
    jd_text = $case.jd_text
  } | ConvertTo-Json

  $report = Invoke-Api -Path "/api/analyze" -Method Post -Body $body -ContentType "application/json"
  $expect = $case.expect

  if ($report.overall_score -lt $expect.min_score -or $report.overall_score -gt $expect.max_score) {
    Fail "$($case.id) score $($report.overall_score) outside expected range $($expect.min_score)-$($expect.max_score)"
  }

  Assert-ContainsAll "$($case.id) matched_skills" $report.matched_skills $expect.matched_skills
  Assert-ContainsAll "$($case.id) missing_skills" $report.missing_skills $expect.missing_skills

  if ($report.api_mode -ne $expect.api_mode) {
    Fail "$($case.id) api_mode expected $($expect.api_mode), got $($report.api_mode)"
  }

  if ($report.portfolio_readiness.score -lt $expect.min_readiness_score) {
    Fail "$($case.id) readiness score $($report.portfolio_readiness.score) below $($expect.min_readiness_score)"
  }

  if (($report.action_board | Measure-Object).Count -lt $expect.min_action_items) {
    Fail "$($case.id) expected at least $($expect.min_action_items) action items"
  }

  if ($expect.required_action_sources) {
    $sources = @($report.action_board | ForEach-Object { $_.source })
    Assert-ContainsAll "$($case.id) action sources" $sources $expect.required_action_sources
  }

  foreach ($section in $expect.required_sections) {
    Assert-SectionPresent $report $section
  }

  Write-Host "PASS fixture $($case.id)"
}

Write-Host "PASS evaluation fixtures"
