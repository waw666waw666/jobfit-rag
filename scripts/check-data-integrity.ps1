param(
  [string]$BackendUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

function Send-Json {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body = $null
  )

  try {
    if ($null -eq $Body) {
      return Invoke-RestMethod -Uri "$BackendUrl$Path" -Method $Method
    }

    return Invoke-RestMethod `
      -Uri "$BackendUrl$Path" `
      -Method $Method `
      -Body ($Body | ConvertTo-Json -Depth 30) `
      -ContentType "application/json"
  } catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode) {
      throw "HTTP status $statusCode from $Method $Path; response body redacted."
    }
    throw "$Method $Path failed; error detail redacted."
  }
}

function Assert-Equal {
  param(
    [string]$Name,
    [object]$Actual,
    [object]$Expected
  )

  if ($Actual -ne $Expected) {
    throw "$Name mismatch. Expected and actual values redacted."
  }
}

function Wait-Backend {
  for ($i = 1; $i -le 20; $i++) {
    try {
      $health = Send-Json "GET" "/health"
      if ($health.status -eq "ok") {
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }
  throw "Backend health failed before data integrity check. Last error redacted."
}

Write-Host "RUN  data integrity"
Wait-Backend

$marker = [guid]::NewGuid().ToString("N")
$created = Send-Json "POST" "/api/analyze" @{
  resume_text = "Jane jane@example.com Summary AI application developer focused on local-first tools. Skills React TypeScript Docker FastAPI SQL Testing. Projects Built JobFit RAG data integrity marker $marker with Docker smoke verification and SQLite persistence."
  jd_text = "Role requires React, TypeScript, Docker, FastAPI, SQL, Testing, local-first data integrity, and clear product thinking."
}

$exported = Send-Json "GET" "/api/reports-export"
$targetReports = @($exported.reports | Where-Object { $_.id -eq $created.id })
Assert-Equal "export contains created report once" $targetReports.Count 1

Send-Json "DELETE" "/api/reports/$($created.id)" | Out-Null

try {
  Send-Json "GET" "/api/reports/$($created.id)" | Out-Null
  throw "Deleted report was still readable"
} catch {
  if ($_.Exception.Message -notmatch "HTTP status 404") {
    throw
  }
}

$singleReportBundle = @{
  version = "jobfit-rag-export-v1"
  exported_at = $exported.exported_at
  reports = @($targetReports[0])
}
$restored = Send-Json "POST" "/api/reports-import" $singleReportBundle
Assert-Equal "restored imported count" $restored.imported 1
Assert-Equal "restored skipped count" $restored.skipped 0

$afterRestore = Send-Json "GET" "/api/reports/$($created.id)"
Assert-Equal "restored id" $afterRestore.id $created.id
Assert-Equal "restored score" $afterRestore.overall_score $created.overall_score
Assert-Equal "restored summary" $afterRestore.summary $created.summary

$duplicate = $targetReports[0] | ConvertTo-Json -Depth 30 | ConvertFrom-Json
$duplicate.summary = "This duplicate import should not overwrite local data."
$duplicateBundle = @{
  version = "jobfit-rag-export-v1"
  exported_at = $exported.exported_at
  reports = @($duplicate)
}
$duplicateResult = Send-Json "POST" "/api/reports-import" $duplicateBundle
Assert-Equal "duplicate imported count" $duplicateResult.imported 0
Assert-Equal "duplicate skipped count" $duplicateResult.skipped 1

$afterDuplicate = Send-Json "GET" "/api/reports/$($created.id)"
Assert-Equal "duplicate did not overwrite summary" $afterDuplicate.summary $created.summary

Write-Host "PASS data integrity"
