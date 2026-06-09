param(
  [string]$Pattern = "backend/tests"
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$target = Join-Path $repo $Pattern
$backend = Join-Path $repo "backend"
$venvPython = Join-Path $repo ".venv\Scripts\python.exe"
$python = if (Test-Path $venvPython) { $venvPython } else { "python" }
$previousPythonPath = $env:PYTHONPATH
$previousDbPath = $env:JOBFIT_DB_PATH

Set-Location $repo
try {
  $env:PYTHONPATH = $backend
  $env:JOBFIT_DB_PATH = Join-Path $repo "data\test-jobfit.sqlite3"

  & $python -m pytest --version | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "pytest is not installed. Run: uv venv .venv --python 3.13; uv pip install --python .\.venv\Scripts\python.exe -r backend\requirements.txt"
  }

  if (-not (Test-Path $target)) {
    throw "Backend test target does not exist: $Pattern"
  }

  & $python -m pytest $Pattern -q | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Backend tests failed with exit code $LASTEXITCODE"
  }
} finally {
  if ($null -eq $previousPythonPath) {
    Remove-Item Env:\PYTHONPATH -ErrorAction SilentlyContinue
  } else {
    $env:PYTHONPATH = $previousPythonPath
  }

  if ($null -eq $previousDbPath) {
    Remove-Item Env:\JOBFIT_DB_PATH -ErrorAction SilentlyContinue
  } else {
    $env:JOBFIT_DB_PATH = $previousDbPath
  }
}
