import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./smoke",
  timeout: 60_000,
  expect: { timeout: 20_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: 'powershell -NoProfile -Command "Set-Location ..\\backend; $env:PYTHONPATH=(Get-Location).Path; $env:JOBFIT_DB_PATH=(Join-Path (Resolve-Path ..).Path \\"data\\browser-smoke-jobfit.sqlite3\\"); $env:JOBFIT_EXTRA_CORS_ORIGINS=\\"http://127.0.0.1:4173\\"; ..\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001"',
      url: "http://127.0.0.1:8001/health",
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "powershell -NoProfile -ExecutionPolicy Bypass -File ../scripts/run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 4173",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
