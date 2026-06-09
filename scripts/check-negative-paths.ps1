param(
  [string]$BackendUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

function Read-Response {
  param(
    [System.Net.WebResponse]$Response
  )

  $reader = [System.IO.StreamReader]::new($Response.GetResponseStream())
  try {
    $content = $reader.ReadToEnd()
  } finally {
    $reader.Close()
  }

  return @{
    StatusCode = [int]$Response.StatusCode
    Body = if ($content) { $content | ConvertFrom-Json } else { $null }
  }
}

function Send-Request {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body = $null
  )

  $request = [System.Net.HttpWebRequest]::Create("$BackendUrl$Path")
  $request.Method = $Method
  $request.Accept = "application/json"

  if ($null -ne $Body) {
    $payload = $Body | ConvertTo-Json -Depth 30
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    $request.ContentType = "application/json"
    $request.ContentLength = $bytes.Length
    $stream = $request.GetRequestStream()
    try {
      $stream.Write($bytes, 0, $bytes.Length)
    } finally {
      $stream.Close()
    }
  }

  try {
    return Read-Response $request.GetResponse()
  } catch [System.Net.WebException] {
    if (-not $_.Exception.Response) {
      throw
    }
    return Read-Response $_.Exception.Response
  }
}

function Send-MultipartFile {
  param(
    [string]$Path,
    [string]$Filename,
    [string]$Content,
    [string]$MimeType
  )

  $boundary = "----JobFitRagBoundary$(Get-Random)"
  $payload = "--$boundary`r`n" +
    "Content-Disposition: form-data; name=`"file`"; filename=`"$Filename`"`r`n" +
    "Content-Type: $MimeType`r`n`r`n" +
    "$Content`r`n" +
    "--$boundary--`r`n"
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
  $request = [System.Net.HttpWebRequest]::Create("$BackendUrl$Path")
  $request.Method = "POST"
  $request.Accept = "application/json"
  $request.ContentType = "multipart/form-data; boundary=$boundary"
  $request.ContentLength = $bytes.Length
  $stream = $request.GetRequestStream()
  try {
    $stream.Write($bytes, 0, $bytes.Length)
  } finally {
    $stream.Close()
  }

  try {
    return Read-Response $request.GetResponse()
  } catch [System.Net.WebException] {
    if (-not $_.Exception.Response) {
      throw
    }
    return Read-Response $_.Exception.Response
  }
}

function Assert-Status {
  param(
    [string]$Name,
    [hashtable]$Response,
    [int]$ExpectedStatus,
    [string]$ExpectedDetail = ""
  )

  $statusCode = [int]$Response.StatusCode
  $body = $Response.Body

  if ($statusCode -ne $ExpectedStatus) {
    throw "$Name expected HTTP $ExpectedStatus, got $statusCode"
  }

  if ($ExpectedDetail -and $body.detail -ne $ExpectedDetail) {
    throw "$Name expected detail '$ExpectedDetail', got '$($body.detail)'"
  }
}

Write-Host "RUN  negative paths"

$privateResume = "PRIVATE_RESUME_TEXT_SHOULD_NOT_ECHO React TypeScript Docker"
$validationError = Send-Request "POST" "/api/analyze" @{ resume_text = $privateResume }
Assert-Status "analyze missing jd_text" $validationError 422
if (($validationError.Body | ConvertTo-Json -Depth 30) -match "PRIVATE_RESUME_TEXT_SHOULD_NOT_ECHO") {
  throw "Validation error echoed private resume text"
}

Assert-Status "unsupported resume file type" `
  (Send-MultipartFile "/api/parse-resume" "resume.exe" "not a supported resume file" "application/octet-stream") `
  400 `
  "Unsupported file type. Use PDF, TXT, or Markdown."

$created = Send-Request "POST" "/api/analyze" @{
    resume_text = "Jane jane@example.com Summary React TypeScript Docker FastAPI built portfolio product."
    jd_text = "Role requires React, TypeScript, Docker, FastAPI, SQL, and Testing."
  }

Assert-Status "unsupported import version" `
  (Send-Request "POST" "/api/reports-import" @{
      version = "wrong-version"
      exported_at = "2026-06-06T00:00:00Z"
      reports = @()
    }) `
  400 `
  "Unsupported export version"

$existing = Send-Request "GET" "/api/reports/$($created.Body.id)"
if ([int]$existing.StatusCode -ne 200) {
  throw "Existing report was not preserved after rejected import"
}

Assert-Status "missing report detail" `
  (Send-Request "GET" "/api/reports/missing-report-id") `
  404 `
  "Report not found"

Assert-Status "missing report delete" `
  (Send-Request "DELETE" "/api/reports/missing-report-id") `
  404 `
  "Report not found"

Assert-Status "missing application patch" `
  (Send-Request "PATCH" "/api/applications/missing-application-id" @{ status = "applied" }) `
  404 `
  "Application not found"

Write-Host "PASS negative paths"
