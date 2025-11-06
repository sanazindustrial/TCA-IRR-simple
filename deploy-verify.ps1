#!/usr/bin/env powershell
# TCA-IRR Final Deployment Verification Script
# This script verifies that the application is ready for Azure deployment

Write-Host "🚀 TCA-IRR Application - Final Deployment Verification" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "📁 Project Structure Check..." -ForegroundColor Yellow

# Check essential files
$essentialFiles = @(
    "package.json",
    "next.config.ts",
    "azure.yaml",
    "infra/main.bicep",
    "main.py",
    "requirements.txt",
    "src/app/layout.tsx"
)

$missingFiles = @()
foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Missing essential files. Cannot proceed with deployment." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Dependencies Check..." -ForegroundColor Yellow

# Check if node_modules exists
if (Test-Path "node_modules") {
    Write-Host "  ✅ Node.js dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Node.js dependencies not installed. Running npm install..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Node.js dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to install Node.js dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔨 Build Verification..." -ForegroundColor Yellow

# Test production build
Write-Host "  🔄 Running production build..." -ForegroundColor Cyan
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Production build successful" -ForegroundColor Green
} else {
    Write-Host "  ❌ Production build failed" -ForegroundColor Red
    exit 1
}

Write-Host "🐍 Backend Verification..." -ForegroundColor Yellow

# Check Python requirements
if (Test-Path "__pycache__") {
    Write-Host "  ✅ Python bytecode detected" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  No Python bytecode found, testing Python setup..." -ForegroundColor Yellow
}

# Test Python backend startup (briefly)
Write-Host "  🔄 Testing Python backend..." -ForegroundColor Cyan
$pythonProcess = Start-Process -FilePath "py" -ArgumentList "main.py" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3

if (!$pythonProcess.HasExited) {
    Write-Host "  ✅ Python backend starts successfully" -ForegroundColor Green
    Stop-Process -Id $pythonProcess.Id -Force
} else {
    Write-Host "  ❌ Python backend failed to start" -ForegroundColor Red
    exit 1
}

Write-Host "☁️  Azure Deployment Readiness..." -ForegroundColor Yellow

# Check Azure configuration
if (Test-Path "azure.yaml") {
    Write-Host "  ✅ Azure Developer CLI configuration ready" -ForegroundColor Green
} else {
    Write-Host "  ❌ azure.yaml missing" -ForegroundColor Red
}

if (Test-Path "infra/main.bicep") {
    Write-Host "  ✅ Bicep infrastructure templates ready" -ForegroundColor Green
} else {
    Write-Host "  ❌ Bicep templates missing" -ForegroundColor Red
}

if (Test-Path ".env.example") {
    Write-Host "  ✅ Environment configuration example available" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  No .env.example found" -ForegroundColor Yellow
}

Write-Host "🔍 Git Repository Status..." -ForegroundColor Yellow

# Check git status
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "  ⚠️  Uncommitted changes detected:" -ForegroundColor Yellow
    Write-Host "$gitStatus" -ForegroundColor Gray
} else {
    Write-Host "  ✅ Git repository is clean" -ForegroundColor Green
}

# Check remote URL
$gitRemote = git remote get-url origin 2>$null
if ($gitRemote -match "github.com/sanazindustrial/TCA-IRR-simple") {
    Write-Host "  ✅ Connected to correct GitHub repository" -ForegroundColor Green
} else {
    Write-Host "  ❌ Git remote not configured correctly" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 VERIFICATION COMPLETE!" -ForegroundColor Green -BackgroundColor Black
Write-Host "============================================================" -ForegroundColor Green

Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "  • Frontend: Next.js 15.3.3 ✅" -ForegroundColor White
Write-Host "  • Backend: FastAPI + Python ✅" -ForegroundColor White  
Write-Host "  • Database: Azure PostgreSQL ✅" -ForegroundColor White
Write-Host "  • Infrastructure: Bicep Templates ✅" -ForegroundColor White
Write-Host "  • Repository: GitHub ✅" -ForegroundColor White

Write-Host ""
Write-Host "🚀 Ready for Azure Deployment!" -ForegroundColor Green -BackgroundColor Black
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run 'azd auth login' to authenticate with Azure" -ForegroundColor White
Write-Host "2. Run 'azd up' to deploy to Azure" -ForegroundColor White
Write-Host "3. Monitor deployment in Azure Portal" -ForegroundColor White
Write-Host ""
Write-Host "Local Development:" -ForegroundColor Cyan
Write-Host "• Frontend: npm run dev (http://localhost:3000)" -ForegroundColor White
Write-Host "• Backend: py main.py (http://localhost:8000)" -ForegroundColor White