g#!/usr/bin/env pwsh
# Simple deploy script for TCA-IRR Backend

$ResourceGroup = "tca-platform-rg"
$AppName = "tcairrapiccontainer"
$zipPath = "backend-deploy.zip"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TCA-IRR Backend Deployment" -ForegroundColor Cyan
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

# Create deployment zip
$deployFiles = @(
    "main.py",
    "requirements.txt",
    "ssd_tirr_report_config.py",
    "ai_integration.py",
    "database_config.py",
    "startup.sh"
)

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Check all files exist
foreach ($file in $deployFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "Missing file: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Creating deployment package..." -ForegroundColor Yellow
Compress-Archive -Path $deployFiles -DestinationPath $zipPath -Force
Write-Host "Created $zipPath" -ForegroundColor Green

# Deploy to Azure
Write-Host "Deploying to Azure Web App..." -ForegroundColor Yellow
az webapp deployment source config-zip --resource-group $ResourceGroup --name $AppName --src $zipPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "" 
Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host ""

# Wait for deployment
Write-Host "Waiting for app to restart..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Verify deployment
Write-Host "Verifying deployment..." -ForegroundColor Yellow

try {
    $null = Invoke-RestMethod -Uri "https://$AppName.azurewebsites.net/health" -Method GET -TimeoutSec 30
    Write-Host "Health check passed!" -ForegroundColor Green
}
catch {
    Write-Host "Health check may need more time..." -ForegroundColor Yellow
}

# Check OpenAPI endpoints
try {
    $openapi = Invoke-RestMethod -Uri "https://$AppName.azurewebsites.net/openapi.json" -Method GET -TimeoutSec 30
    $paths = $openapi.paths.PSObject.Properties.Name | Sort-Object
    Write-Host ""
    Write-Host "Available endpoints:" -ForegroundColor Cyan
    foreach ($path in $paths) {
        Write-Host "  $path" -ForegroundColor White
    }
}
catch {
    Write-Host "Could not fetch OpenAPI spec" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend URL: https://$AppName.azurewebsites.net" -ForegroundColor White
Write-Host "API Docs:    https://$AppName.azurewebsites.net/docs" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

# Cleanup
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
