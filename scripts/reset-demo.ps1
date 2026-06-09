param(
  [string]$BackendUrl = "http://localhost:8000",
  [switch]$NoSeed,
  [switch]$NoBackup,
  [switch]$NoDocker
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $repo "data"
$dbPath = Join-Path $dataDir "jobfit.sqlite3"

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

Step "validate data path" {
  New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
  $dataItem = Get-Item -LiteralPath $dataDir
  if (($dataItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
    throw "Refuse to reset reparse-point data directory: $dataDir"
  }
  $resolvedRepo = (Resolve-Path $repo).Path
  $resolvedData = (Resolve-Path $dataDir).Path
  $repoPrefix = if ($resolvedRepo.EndsWith([System.IO.Path]::DirectorySeparatorChar)) { $resolvedRepo } else { "$resolvedRepo$([System.IO.Path]::DirectorySeparatorChar)" }
  if (-not $resolvedData.StartsWith($repoPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refuse to reset outside repo: $resolvedData"
  }
}

Step "stop compose services" {
  if ($NoDocker) {
    Write-Host "SKIP Docker disabled by -NoDocker"
    return
  }
  docker compose stop | Out-Host
}

Step "backup database" {
  if ((Test-Path $dbPath) -and -not $NoBackup) {
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    Copy-Item -LiteralPath $dbPath -Destination (Join-Path $dataDir "jobfit.sqlite3.bak-$stamp") -Force
  }
}

Step "reset database file" {
  if (Test-Path $dbPath) {
    Remove-Item -LiteralPath $dbPath -Force
  }
}

Step "start compose services" {
  if ($NoDocker) {
    Write-Host "SKIP Docker disabled by -NoDocker"
    return
  }
  docker compose up -d --build | Out-Host
}

Step "backend health" {
  if ($NoDocker -and $NoSeed) {
    Write-Host "SKIP backend health because -NoDocker -NoSeed only resets the local database file"
    return
  }
  Retry "backend health" {
    $health = Invoke-RestMethod "$BackendUrl/health"
    if ($health.status -ne "ok") {
      throw "Unexpected health response: $($health | ConvertTo-Json -Compress)"
    }
  }
}

if (-not $NoSeed) {
  $reports = @()

  Step "seed frontend report" {
    $body = @{
      resume_text = "Jane Doe jane@example.com Summary Frontend developer focused on React and TypeScript dashboards. Skills React, TypeScript, Docker, REST API, SQLite, testing Experience Built a local-first dashboard that reduced manual weekly reporting time by 35%."
      jd_text = "Frontend Engineer role requiring React, TypeScript, REST API integration, testing, Docker, product thinking, and clear UI implementation evidence."
    } | ConvertTo-Json
    $reports += Invoke-RestMethod -Uri "$BackendUrl/api/analyze" -Method Post -Body $body -ContentType "application/json"
  }

  Step "seed ai app report" {
    $body = @{
      resume_text = "Jane Doe jane@example.com Summary AI application developer building local-first tools. Skills React, TypeScript, FastAPI, Docker, SQLite, RAG, embeddings Projects Built a Dockerized resume/JD analyzer using FastAPI, React, evidence matching, and Markdown export for 2-minute job-fit reviews."
      jd_text = "AI Application Developer role requires React, TypeScript, FastAPI, Docker, RAG, embeddings, vector search, SQL, testing, and measurable product impact."
    } | ConvertTo-Json
    $reports += Invoke-RestMethod -Uri "$BackendUrl/api/analyze" -Method Post -Body $body -ContentType "application/json"
  }

  Step "seed application tracker" {
    $reportId = $reports[-1].id
    $body = @{
      company = "Acme AI"
      role = "AI Application Developer"
      status = "target"
      next_action = "Use portfolio case study export in a mock interview."
      report_id = $reportId
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BackendUrl/api/applications" -Method Post -Body $body -ContentType "application/json" | Out-Null
  }

  Step "verify seeded demo data" {
    $history = Invoke-RestMethod "$BackendUrl/api/reports"
    $apps = Invoke-RestMethod "$BackendUrl/api/applications"
    if (($history | Measure-Object).Count -ne 2) {
      throw "Expected 2 demo reports, found $(($history | Measure-Object).Count)"
    }
    if (($apps | Measure-Object).Count -ne 1) {
      throw "Expected 1 demo application, found $(($apps | Measure-Object).Count)"
    }
  }
}

Write-Host "PASS reset-demo"
