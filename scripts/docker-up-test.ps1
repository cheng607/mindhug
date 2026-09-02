# Docker production stack validation (Windows PowerShell)
# Run from repo root: powershell -ExecutionPolicy Bypass -File .\scripts\docker-up-test.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "==> Checking Docker engine..."
$retries = 0
while ($retries -lt 30) {
    try {
        docker info *> $null
        if ($LASTEXITCODE -eq 0) { break }
    } catch {}
    $retries++
    Write-Host "Waiting for Docker Desktop ($retries/30)..."
    Start-Sleep -Seconds 5
}
if ($retries -ge 30) {
    Write-Error "Docker is not ready. Start Docker Desktop and retry."
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.production.example" ".env"
    Write-Host "Copied .env.production.example to .env"
}

Write-Host "==> docker compose config"
docker compose config
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> docker compose up -d --build"
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Waiting for services..."
Start-Sleep -Seconds 25

$healthOk = $false
for ($i = 1; $i -le 24; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing -TimeoutSec 5
        if ($resp.StatusCode -eq 200) {
            $healthOk = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 5
}

docker compose ps

if ($healthOk) {
    Write-Host "[PASS] http://localhost/health is reachable"
    Write-Host "Manual check: register -> login -> chat -> admin"
} else {
    Write-Warning "Health check failed. Run: docker compose logs -f backend frontend"
    exit 1
}
