# TCA-IRR App - Quick Start for Azure Deployment

Write-Host "🚀 TCA-IRR App - Azure Deployment Quick Start" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Step 1: Check prerequisites
Write-Host "📋 Step 1: Checking Prerequisites..." -ForegroundColor Yellow

$prerequisites = @()

# Check Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
}
else {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    $prerequisites += "Node.js 18+"
}

# Check npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
}
else {
    Write-Host "❌ npm not found" -ForegroundColor Red
    $prerequisites += "npm"
}

# Check Azure CLI
if (Get-Command az -ErrorAction SilentlyContinue) {
    $azVersion = (az version --output tsv 2>$null) -split "`t" | Select-Object -First 1
    Write-Host "✅ Azure CLI: $azVersion" -ForegroundColor Green
}
else {
    Write-Host "❌ Azure CLI not found" -ForegroundColor Red
    $prerequisites += "Azure CLI"
}

# Check Azure Developer CLI
if (Get-Command azd -ErrorAction SilentlyContinue) {
    $azdVersion = (azd version 2>$null | Select-String "azd version" | ForEach-Object { $_.ToString().Split(' ')[2] })
    Write-Host "✅ Azure Developer CLI: $azdVersion" -ForegroundColor Green
}
else {
    Write-Host "❌ Azure Developer CLI not found" -ForegroundColor Red
    $prerequisites += "Azure Developer CLI (azd)"
}

if ($prerequisites.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Missing Prerequisites:" -ForegroundColor Red
    foreach ($prereq in $prerequisites) {
        Write-Host "   - $prereq" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Please install the missing tools:" -ForegroundColor Cyan
    Write-Host "- Azure CLI: winget install Microsoft.AzureCLI" -ForegroundColor Gray
    Write-Host "- Azure Developer CLI: winget install Microsoft.Azd" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Run this script again after installation." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📁 Step 2: Project Setup..." -ForegroundColor Yellow

# Check if package.json exists
if (Test-Path "package.json") {
    Write-Host "✅ package.json found" -ForegroundColor Green
}
else {
    Write-Host "❌ package.json not found - are you in the project directory?" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install

Write-Host ""
Write-Host "🔧 Step 3: Environment Setup..." -ForegroundColor Yellow

# Check for .env.local
if (-not (Test-Path ".env.local")) {
    if (Test-Path ".env.example") {
        Write-Host "📋 Creating .env.local from template..." -ForegroundColor Blue
        Copy-Item ".env.example" ".env.local"
        Write-Host "⚠️  Please edit .env.local with your configuration:" -ForegroundColor Yellow
        Write-Host "   - Google GenAI API Key" -ForegroundColor Gray
        Write-Host "   - Firebase configuration" -ForegroundColor Gray
        Write-Host "   - Azure subscription details" -ForegroundColor Gray
        Write-Host ""
        $response = Read-Host "Press Enter when you've configured .env.local, or 'skip' to continue"
        if ($response -eq "skip") {
            Write-Host "⚠️  Skipping environment configuration - you may need to configure this later" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "⚠️  .env.example not found - manual configuration required" -ForegroundColor Yellow
    }
}
else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🏗️ Step 4: Build Test..." -ForegroundColor Yellow
Write-Host "Testing application build..." -ForegroundColor Blue

try {
    npm run build
    Write-Host "✅ Build successful!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Build failed - please fix build errors before deployment" -ForegroundColor Red
    Write-Host "Run 'npm run build' to see detailed errors" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Blue
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Configure your .env.local with API keys (if not done already)" -ForegroundColor White
Write-Host "2. Login to Azure: az login && azd auth login" -ForegroundColor White
Write-Host "3. Deploy to Azure: .\deploy.ps1" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see AZURE_DEPLOYMENT.md" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Would you like to start the deployment now? (y/N)"
if ($response -match "^[Yy]") {
    Write-Host ""
    Write-Host "🚀 Starting deployment..." -ForegroundColor Green
    & .\deploy.ps1
}
else {
    Write-Host ""
    Write-Host "Ready for deployment! Run '.\deploy.ps1' when you're ready." -ForegroundColor Cyan
}