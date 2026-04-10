# Azure Deployment Script for TCA-IRR App (Dynamic Web App)
# This script will deploy your Next.js application to Azure Web Service using Azure Developer CLI

param(
    [string]$EnvironmentName = "prod",
    [string]$Location = "eastus2",
    [switch]$SkipBuild = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Azure deployment for TCA-IRR Dynamic Web App..." -ForegroundColor Green

# Check if azd is installed
if (-not (Get-Command azd -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure Developer CLI (azd) is not installed." -ForegroundColor Red
    Write-Host "Please install it from: https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd" -ForegroundColor Yellow
    exit 1
}

# Check if az CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure CLI (az) is not installed." -ForegroundColor Red
    Write-Host "Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Login to Azure if not already logged in
Write-Host "🔐 Checking Azure authentication..." -ForegroundColor Blue
try {
    $null = az account show 2>$null
    Write-Host "✅ Already logged in to Azure" -ForegroundColor Green
}
catch {
    Write-Host "Please log in to Azure:" -ForegroundColor Yellow
    az login
    azd auth login
}

# Set environment variables
$env:AZURE_ENV_NAME = $EnvironmentName
$env:AZURE_LOCATION = $Location

Write-Host "📝 Environment: $EnvironmentName" -ForegroundColor Cyan
Write-Host "📍 Location: $Location" -ForegroundColor Cyan

# Build the application
if (-not $SkipBuild) {
    Write-Host "🏗️  Building Next.js application..." -ForegroundColor Blue
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
}

# Initialize azd if not already done
$envPath = ".azure\$EnvironmentName\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "🔧 Initializing Azure Developer environment..." -ForegroundColor Blue
    azd env new $EnvironmentName
}

# Provision and deploy
Write-Host "☁️  Provisioning Azure infrastructure..." -ForegroundColor Blue
azd provision --preview

if (-not $Force) {
    $response = Read-Host "Do you want to proceed with the deployment? (y/N)"
    if ($response -notmatch "^[Yy]") {
        Write-Host "❌ Deployment cancelled by user" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "🚀 Deploying to Azure..." -ForegroundColor Green
azd up --no-prompt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Your application should be available at the URL shown above." -ForegroundColor Cyan
    
    # Get the deployment information
    Write-Host "📋 Deployment Summary:" -ForegroundColor Blue
    azd show
}
else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Deployment process completed!" -ForegroundColor Green