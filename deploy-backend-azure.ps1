# Deploy Backend to Azure Web App
# This script deploys the main.py FastAPI backend to Azure

param(
    [string]$ResourceGroup = "tca-platform-rg",
    [string]$AppName = "tcairrapiccontainer",
    [switch]$SkipLogin
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TCA-IRR Backend Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
$azInstalled = Get-Command az -ErrorAction SilentlyContinue
if (-not $azInstalled) {
    Write-Host "❌ Azure CLI is not installed!" -ForegroundColor Red
    Write-Host "   Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Login to Azure if needed
if (-not $SkipLogin) {
    Write-Host "🔐 Logging into Azure..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Azure login failed!" -ForegroundColor Red
        exit 1
    }
}

# Verify the web app exists
Write-Host "🔍 Verifying web app exists..." -ForegroundColor Yellow
$appExists = az webapp show --name $AppName --resource-group $ResourceGroup 2>$null
if (-not $appExists) {
    Write-Host "❌ Web app '$AppName' not found in resource group '$ResourceGroup'!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Found web app: $AppName" -ForegroundColor Green

# Create deployment zip
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
$deployFiles = @(
    "main.py",
    "requirements.txt",
    "ssd_tirr_report_config.py",
    "ai_integration.py",
    "database_config.py",
    "startup.sh"
)

$zipPath = "backend-deploy.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Create startup.sh if it doesn't exist
if (-not (Test-Path "startup.sh")) {
    $startupContent = @'
#!/bin/bash
pip install --upgrade pip
pip install -r requirements.txt
python main.py
'@
    $startupContent | Out-File -FilePath "startup.sh" -Encoding utf8 -NoNewline
}

Compress-Archive -Path $deployFiles -DestinationPath $zipPath -Force
Write-Host "✅ Created $zipPath" -ForegroundColor Green

# Deploy to Azure
Write-Host "🚀 Deploying to Azure Web App..." -ForegroundColor Yellow
az webapp deployment source config-zip `
    --resource-group $ResourceGroup `
    --name $AppName `
    --src $zipPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""

# Verify deployment
Write-Host "🔍 Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    $healthResponse = Invoke-WebRequest -Uri "https://$AppName.azurewebsites.net/health" -Method GET -UseBasicParsing -TimeoutSec 30
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend health check passed!" -ForegroundColor Green
    }
}
catch {
    Write-Host "⚠️ Health check failed - backend may still be starting..." -ForegroundColor Yellow
}

# Check SSD endpoint
try {
    $ssdResponse = Invoke-WebRequest -Uri "https://$AppName.azurewebsites.net/api/ssd/audit/stats" -Method GET -UseBasicParsing -TimeoutSec 30
    if ($ssdResponse.StatusCode -eq 200) {
        Write-Host "✅ SSD endpoint is available!" -ForegroundColor Green
    }
}
catch {
    Write-Host "⚠️ SSD endpoint not yet available - restart may be needed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend URL: https://$AppName.azurewebsites.net" -ForegroundColor White
Write-Host "API Docs:    https://$AppName.azurewebsites.net/docs" -ForegroundColor White
Write-Host "Health:      https://$AppName.azurewebsites.net/health" -ForegroundColor White
Write-Host ""

# Cleanup
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
