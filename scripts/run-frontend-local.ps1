param(
  [string]$BackendUrl = "http://localhost:8000",
  [int]$Port = 3000,
  [string]$ListenHost = "127.0.0.1"
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $repo "frontend"
$previousLocation = Get-Location
$previousApiBaseUrl = $env:VITE_API_BASE_URL

try {
  Set-Location $frontend
  $env:VITE_API_BASE_URL = $BackendUrl.TrimEnd("/")
  npm run dev -- --host $ListenHost --port $Port --strictPort
} finally {
  Set-Location $previousLocation
  if ($null -eq $previousApiBaseUrl) {
    Remove-Item Env:\VITE_API_BASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:VITE_API_BASE_URL = $previousApiBaseUrl
  }
}
