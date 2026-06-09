param(
  [switch]$ShowCommandOutput
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot

function Get-SafeErrorMessage {
  param([object]$ErrorRecord)
  $message = $ErrorRecord.Exception.Message
  if ($message -match "^Command failed with exit code \d+\. Output redacted\.$") {
    return $message
  }
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
  $output = & $Command 2>&1
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "Command failed with exit code $exitCode. Output redacted."
  }
  if ($ShowCommandOutput) {
    $output | Out-Host
  }
}

Set-Location $repo

Step "frontend build" {
  Invoke-Checked { npm --prefix frontend run build }
}

Step "accessibility" {
  Invoke-Checked { powershell -ExecutionPolicy Bypass -File (Join-Path $repo "scripts/check-accessibility.ps1") }
}

Step "backend python syntax" {
  $pythonFiles = Get-ChildItem -Path (Join-Path $repo "backend") -Filter "*.py" -Recurse | ForEach-Object { $_.FullName }
  Invoke-Checked { python -m py_compile @pythonFiles }
}

Write-Host "PASS verify-local"
