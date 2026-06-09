param(
  [string]$BackendUrl = "http://localhost:8000",
  [string]$FrontendUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$secretPattern = "sk-[A-Za-z0-9_-]{20,}|OPENAI_API_KEY=[A-Za-z0-9_-]{8,}|Authorization:[[:space:]]*Bearer[[:space:]]+[A-Za-z0-9._-]{20,}"
$powerShellExe = (Get-Process -Id $PID).Path

function Get-SafeErrorMessage {
  param([object]$ErrorRecord)
  $statusCode = $ErrorRecord.Exception.Response.StatusCode.value__
  if ($statusCode) {
    return "HTTP status $statusCode; response body redacted."
  }
  return "Error detail redacted. Run this step locally for full diagnostics."
}

function Step {
  param(
    [string]$Name,
    [scriptblock]$Block
  )
  Write-Host "RUN  $Name"
  try {
    & $Block
    Write-Host "PASS $Name"
  } catch {
    Write-Host "FAIL $Name"
    Write-Host (Get-SafeErrorMessage $_)
    exit 1
  }
}

function Invoke-Checked {
  param(
    [scriptblock]$Command
  )
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $output = & $Command 2>&1
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($exitCode -ne 0) {
    throw "Command failed with exit code $exitCode. Output redacted."
  }
  foreach ($line in $output) {
    Write-Host "$line"
  }
}

function Retry {
  param(
    [string]$Name,
    [scriptblock]$Block,
    [int]$Attempts = 20,
    [int]$DelaySeconds = 1
  )
  $lastError = $null
  for ($i = 1; $i -le $Attempts; $i++) {
    try {
      & $Block
      return
    } catch {
      $lastError = $_
      Start-Sleep -Seconds $DelaySeconds
    }
  }
  throw "$Name failed after $Attempts attempts. Last error redacted."
}

Set-Location $repo

Step "backend image build" {
  Invoke-Checked { docker compose build backend }
}

Step "frontend image build" {
  Invoke-Checked { docker compose build frontend }
}

Step "backend tests" {
  Invoke-Checked { docker compose run --rm backend pytest -q }
}

Step "frontend production build" {
  Invoke-Checked { docker compose run --rm frontend npm run build }
}

Step "accessibility" {
  Invoke-Checked { & $powerShellExe -ExecutionPolicy Bypass -File (Join-Path $repo "scripts/check-accessibility.ps1") }
}

Step "compose services" {
  Invoke-Checked { docker compose up -d --build }
}

Step "backend health" {
  Retry "backend health" {
    $health = Invoke-RestMethod "$BackendUrl/health"
    if ($health.status -ne "ok" -or $health.service -ne "jobfit-rag") {
      throw "Unexpected health response: $($health | ConvertTo-Json -Compress)"
    }
  }
}

Step "frontend http" {
  Retry "frontend http" {
    $statusCode = (Invoke-WebRequest $FrontendUrl -UseBasicParsing).StatusCode
    if ($statusCode -ne 200) {
      throw "Unexpected frontend status: $statusCode"
    }
  }
}

Step "analyze api" {
  Retry "analyze api" {
    $strongBody = @{
      resume_text = "Jane jane@example.com Summary AI application developer focused on local-first tools. Skills React TypeScript Docker FastAPI RAG SQL Testing Projects Built a Dockerized React FastAPI RAG analyzer with SQL persistence and pytest coverage that reduced resume review time by 35%."
      jd_text = "Need React TypeScript Docker FastAPI RAG SQL Testing and clear product thinking."
    } | ConvertTo-Json
    $report = Invoke-RestMethod -Uri "$BackendUrl/api/analyze" -Method Post -Body $strongBody -ContentType "application/json"
    if (-not $report.portfolio_export.headline) {
      throw "Missing portfolio_export headline"
    }
    if (-not $report.portfolio_readiness.next_best_action) {
      throw "Missing portfolio_readiness next action"
    }

    $gapBody = @{
      resume_text = "Jane jane@example.com Summary AI application developer using React and RAG. Projects Built a React job-fit analyzer that reduced resume review time by 35%. Worked on dashboards."
      jd_text = "Need React RAG SQL Testing and clear proof artifacts."
    } | ConvertTo-Json
    $gapReport = Invoke-RestMethod -Uri "$BackendUrl/api/analyze" -Method Post -Body $gapBody -ContentType "application/json"
    if (($gapReport.action_board | Measure-Object).Count -lt 1) {
      throw "Missing action_board items"
    }
  }
}

Step "resume matrix" {
  Invoke-Checked { & $powerShellExe -ExecutionPolicy Bypass -File (Join-Path $repo "scripts/check-resume-matrix.ps1") -BackendUrl $BackendUrl }
}

Step "evaluation fixtures" {
  Invoke-Checked { & $powerShellExe -ExecutionPolicy Bypass -File (Join-Path $repo "scripts/evaluate-fixtures.ps1") -BackendUrl $BackendUrl }
}

Step "markdown quality" {
  Invoke-Checked { & $powerShellExe -ExecutionPolicy Bypass -File (Join-Path $repo "scripts/check-markdown-quality.ps1") -BackendUrl $BackendUrl }
}

Step "api contract" {
  Invoke-Checked { & $powerShellExe -ExecutionPolicy Bypass -File (Join-Path $repo "scripts/check-api-contract.ps1") -BackendUrl $BackendUrl }
}

Step "data integrity" {
  Invoke-Checked { & $powerShellExe -ExecutionPolicy Bypass -File (Join-Path $repo "scripts/check-data-integrity.ps1") -BackendUrl $BackendUrl }
}

Step "negative paths" {
  Invoke-Checked { & $powerShellExe -ExecutionPolicy Bypass -File (Join-Path $repo "scripts/check-negative-paths.ps1") -BackendUrl $BackendUrl }
}

Step "secret scan" {
  $scan = rg --count-matches --case-sensitive $secretPattern $repo 2>&1
  if ($LASTEXITCODE -eq 0) {
    $matchCount = 0
    foreach ($line in $scan) {
      $parts = "$line" -split ":"
      $countText = $parts[-1]
      $count = 0
      if ([int]::TryParse($countText, [ref]$count)) {
        $matchCount += $count
      }
    }
    throw "Potential secret pattern found in $matchCount match(es). Raw matches are redacted; inspect locally with care."
  }
  if ($LASTEXITCODE -ne 1) {
    throw "Secret scan failed with exit code $LASTEXITCODE"
  }
}

Write-Host "PASS smoke"
exit 0
