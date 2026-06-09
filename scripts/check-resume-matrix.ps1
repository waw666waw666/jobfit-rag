param(
  [string]$BackendUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

function Get-SafeUriPath {
  param([string]$Uri)

  try {
    $path = ([uri]$Uri).AbsolutePath
    if ($path) {
      return $path
    }
  } catch {
    return "API endpoint"
  }
  return "API endpoint"
}

function Invoke-Api {
  param(
    [string]$Uri,
    [string]$Method = "GET",
    [string]$Body = "",
    [string]$ContentType = "application/json"
  )

  try {
    if ($Body) {
      return Invoke-RestMethod -Uri $Uri -Method $Method -Body $Body -ContentType $ContentType
    }
    return Invoke-RestMethod -Uri $Uri -Method $Method
  } catch {
    $safePath = Get-SafeUriPath $Uri
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode) {
      throw "HTTP status $statusCode from $Method $safePath; response body redacted."
    }
    throw "$Method $safePath failed; error detail redacted."
  }
}

function Wait-Backend {
  for ($i = 1; $i -le 20; $i++) {
    try {
      $health = Invoke-Api "$BackendUrl/health"
      if ($health.status -eq "ok") {
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }
  throw "Backend health failed before resume matrix check. Last error redacted."
}

function Assert-True {
  param(
    [string]$Name,
    [bool]$Condition
  )

  if (-not $Condition) {
    throw "$Name failed"
  }
}

Write-Host "RUN  resume matrix"
Wait-Backend

$body = @{
  jd_text = "Role requires React, TypeScript, FastAPI, Docker, SQL, Testing, RAG, and clear product thinking."
  versions = @(
    @{
      label = "baseline"
      resume_text = "Jane jane@example.com Summary Frontend developer. Skills React TypeScript. Projects Built dashboards."
    },
    @{
      label = "tailored"
      resume_text = "Jane jane@example.com Summary AI application developer. Skills React TypeScript FastAPI Docker SQL Testing RAG. Projects Built a Dockerized React FastAPI RAG analyzer with SQL persistence and pytest coverage."
    }
  )
} | ConvertTo-Json -Depth 20

$matrix = Invoke-Api -Uri "$BackendUrl/api/resume-matrix" -Method Post -Body $body -ContentType "application/json"

Assert-True "best version is tailored" ($matrix.best_version -eq "tailored")
Assert-True "score delta positive" ([int]$matrix.score_delta -gt 0)
Assert-True "two versions returned" (@($matrix.versions).Count -eq 2)
Assert-True "tailored score higher" ([int]$matrix.versions[1].overall_score -gt [int]$matrix.versions[0].overall_score)
Assert-True "tailored gained skills" (@($matrix.versions[1].gained_skills).Count -gt 0)
Assert-True "recommendations returned" (@($matrix.recommendations).Count -gt 0)

Write-Host "PASS resume matrix"
