#!/usr/bin/env pwsh
# Deploy via Kudu ZIP Deploy API

$kuduUrl = "https://tcairrapiccontainer.scm.azurewebsites.net/api/zipdeploy"
$username = "`$tcairrapiccontainer"
$password = "4dyqdt2neKnPiMWys4Bwjm78fvEpeiEwq9fNjwPXPue2Z5sW4yDvzAzb9szz"
$zipPath = "backend-deploy.zip"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TCA-IRR Backend - Kudu Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Create startup.sh
$startupContent = @'
#!/bin/bash
pip install --upgrade pip
pip install -r requirements.txt
gunicorn main:app --bind 0.0.0.0:8000 --workers 2 --worker-class uvicorn.workers.UvicornWorker --timeout 600
'@

$startupContent | Out-File -FilePath "startup.sh" -Encoding ASCII -NoNewline
Write-Host "Created startup.sh" -ForegroundColor Green

# Files to deploy
$deployFiles = @(
    "main.py",
    "requirements.txt",
    "ssd_tirr_report_config.py",
    "ai_integration.py",
    "database_config.py",
    "startup.sh"
)

# Check files exist
foreach ($file in $deployFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "Missing file: $file" -ForegroundColor Red
        exit 1
    }
}

# Create zip
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path $deployFiles -DestinationPath $zipPath -Force
Write-Host "Created $zipPath" -ForegroundColor Green

# Deploy via Kudu
Write-Host "Deploying to Azure via Kudu API..." -ForegroundColor Yellow

$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${username}:${password}"))
$headers = @{
    Authorization  = "Basic $base64Auth"
    "Content-Type" = "application/zip"
}

try {
    $response = Invoke-RestMethod -Uri $kuduUrl -Method Post -Headers $headers -InFile $zipPath -TimeoutSec 300
    Write-Host "Deployment successful!" -ForegroundColor Green
}
catch {
    Write-Host "Deployment response: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    if ($_.Exception.Response.StatusCode -eq 200 -or $_.Exception.Response.StatusCode -eq 202) {
        Write-Host "Deployment accepted!" -ForegroundColor Green
    }
    else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Wait for app restart
Write-Host "Waiting for app to restart (30s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verify
Write-Host "Verifying deployment..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://tcairrapiccontainer.azurewebsites.net/health" -Method GET -TimeoutSec 60
    Write-Host "Health check: $($health.status)" -ForegroundColor Green
}
catch {
    Write-Host "Health check: App may still be starting..." -ForegroundColor Yellow
}

# Check OpenAPI for SSD endpoints
Write-Host "Checking for SSD endpoints..." -ForegroundColor Yellow
try {
    $openapi = Invoke-RestMethod -Uri "https://tcairrapiccontainer.azurewebsites.net/openapi.json" -Method GET -TimeoutSec 60
    $paths = $openapi.paths.PSObject.Properties.Name | Sort-Object
    
    $ssdEndpoints = $paths | Where-Object { $_ -like "*ssd*" }
    if ($ssdEndpoints) {
        Write-Host "SSD Endpoints found:" -ForegroundColor Green
        $ssdEndpoints | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
    }
    else {
        Write-Host "SSD endpoints not yet visible in OpenAPI" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "All endpoints ($($paths.Count)):" -ForegroundColor Cyan
    $paths | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
}
catch {
    Write-Host "Could not fetch OpenAPI spec" -ForegroundColor Yellow
}

# Cleanup
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  App: https://tcairrapiccontainer.azurewebsites.net" -ForegroundColor White
Write-Host "  Docs: https://tcairrapiccontainer.azurewebsites.net/docs" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
