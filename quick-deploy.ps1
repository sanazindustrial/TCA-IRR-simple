#!/usr/bin/env pwsh

Write-Host "🚀 TCA-IRR Quick Production Deployment" -ForegroundColor Green
Write-Host "This will deploy your TCA Analysis app to Azure Web App Service" -ForegroundColor Cyan

# Quick deployment with minimal configuration
$AppName = "tca-irr-" + (Get-Random -Minimum 1000 -Maximum 9999)
$ResourceGroup = "tca-irr-rg"
$Location = "East US 2"

Write-Host "`n📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "App Name: $AppName" -ForegroundColor White
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "Location: $Location" -ForegroundColor White

# Check prerequisites
Write-Host "`n🔍 Checking Prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Please install Azure CLI from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Blue
    exit 1
}

# Login to Azure
Write-Host "🔐 Azure Login..." -ForegroundColor Yellow
$account = az account show --query "user.name" -o tsv 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Azure..." -ForegroundColor Cyan
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Azure login failed" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "✅ Already logged in as: $account" -ForegroundColor Green
}

Write-Host "`n🏗️ Creating Azure Resources..." -ForegroundColor Yellow

# Create resource group
Write-Host "Creating resource group..." -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location --output none
if ($LASTEXITCODE -ne 0) {
    Write-Host "Resource group may already exist, continuing..." -ForegroundColor Yellow
}

# Create App Service Plan
Write-Host "Creating App Service Plan..." -ForegroundColor Cyan
$PlanName = "$AppName-plan"
az appservice plan create --name $PlanName --resource-group $ResourceGroup --location $Location --sku F1 --output none
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create App Service Plan" -ForegroundColor Red
    exit 1
}

# Create Web App
Write-Host "Creating Web App..." -ForegroundColor Cyan
az webapp create --name $AppName --resource-group $ResourceGroup --plan $PlanName --runtime "NODE:18-lts" --output none
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create Web App" -ForegroundColor Red
    exit 1
}

# Configure App Settings
Write-Host "Configuring App Settings..." -ForegroundColor Cyan
az webapp config appsettings set --name $AppName --resource-group $ResourceGroup --settings `
    "NODE_ENV=production" `
    "NEXT_TELEMETRY_DISABLED=1" `
    "PORT=8080" `
    "WEBSITE_NODE_DEFAULT_VERSION=18.17.0" `
    --output none

az webapp config set --name $AppName --resource-group $ResourceGroup --startup-file "npm start" --output none

Write-Host "`n📦 Preparing Deployment..." -ForegroundColor Yellow

# Create deployment package
$DeployDir = "azure-deploy"
if (Test-Path $DeployDir) {
    Remove-Item -Recurse -Force $DeployDir
}
New-Item -ItemType Directory -Path $DeployDir | Out-Null

# Copy files
Write-Host "Copying application files..." -ForegroundColor Cyan
Copy-Item -Path ".next" -Destination "$DeployDir/.next" -Recurse
Copy-Item -Path "public" -Destination "$DeployDir/public" -Recurse
Copy-Item -Path "package.json" -Destination "$DeployDir/"
if (Test-Path "package-lock.json") {
    Copy-Item -Path "package-lock.json" -Destination "$DeployDir/"
}

# Create simple package.json for production
$productionPackage = @{
    name         = "tca-irr-app"
    version      = "1.0.0"
    private      = $true
    scripts      = @{
        start = "next start"
    }
    dependencies = (Get-Content package.json | ConvertFrom-Json).dependencies
} | ConvertTo-Json -Depth 10

$productionPackage | Out-File -FilePath "$DeployDir/package.json" -Encoding UTF8

# Create zip file
Write-Host "Creating deployment package..." -ForegroundColor Cyan
$ZipPath = "deployment.zip"
if (Test-Path $ZipPath) { Remove-Item $ZipPath }
Compress-Archive -Path "$DeployDir\*" -DestinationPath $ZipPath

Write-Host "`n🚀 Deploying to Azure..." -ForegroundColor Yellow
az webapp deploy --name $AppName --resource-group $ResourceGroup --src-path $ZipPath --type zip --timeout 600
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

# Clean up
Write-Host "Cleaning up..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $DeployDir
Remove-Item $ZipPath

$AppUrl = "https://$AppName.azurewebsites.net"

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "🌐 Your TCA-IRR app is available at:" -ForegroundColor Cyan
Write-Host "   $AppUrl" -ForegroundColor White
Write-Host "`n📊 Azure Resources Created:" -ForegroundColor Yellow
Write-Host "   Resource Group: $ResourceGroup" -ForegroundColor White  
Write-Host "   Web App: $AppName" -ForegroundColor White
Write-Host "   Plan: $PlanName" -ForegroundColor White

Write-Host "`n⚠️ Important Notes:" -ForegroundColor Yellow
Write-Host "   • Using F1 (Free) tier - upgrade for production" -ForegroundColor White
Write-Host "   • App may take 2-3 minutes to fully start" -ForegroundColor White
Write-Host "   • Configure environment variables in Azure Portal if needed" -ForegroundColor White

Write-Host "`n🎉 TCA Analysis App Successfully Deployed!" -ForegroundColor Green
Write-Host "Visit the Azure Portal to monitor your app: https://portal.azure.com" -ForegroundColor Blue

Start-Sleep -Seconds 2
Write-Host "`nOpening application..." -ForegroundColor Cyan
try {
    Start-Process $AppUrl
}
catch {
    Write-Host "Please manually open: $AppUrl" -ForegroundColor Blue
}