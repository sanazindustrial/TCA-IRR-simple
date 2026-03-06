#!/usr/bin/env pwsh
# Production Deployment Script for TCA-IRR App
# This script deploys the TCA analysis application to Azure with comprehensive setup

param(
    [string]$Environment = "production",
    [string]$ResourceGroup = "tca-irr-rg",
    [string]$Location = "East US 2",
    [string]$AppName = "tca-irr-app",
    [switch]$SkipBuild = $false,
    [switch]$Force = $false
)

Write-Host "🚀 TCA-IRR Production Deployment Script" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Cyan
Write-Host "Location: $Location" -ForegroundColor Cyan
Write-Host "App Name: $AppName" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n📋 Checking Prerequisites..." -ForegroundColor Yellow

# Check Azure CLI
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Blue
    exit 1
}

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python is not installed. Please install Python 3.11+ first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Verify Azure login
Write-Host "`n🔐 Checking Azure Authentication..." -ForegroundColor Yellow
$azAccount = az account show --query "user.name" -o tsv 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged into Azure. Running 'az login'..." -ForegroundColor Red
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Azure login failed" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "✅ Logged into Azure as: $azAccount" -ForegroundColor Green
}

# Build and test application
if (-not $SkipBuild) {
    Write-Host "`n🔨 Building Application..." -ForegroundColor Yellow
    
    # Install dependencies
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install failed" -ForegroundColor Red
        exit 1
    }
    
    # Install Python dependencies
    Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Python dependencies installation failed" -ForegroundColor Red
        exit 1
    }
    
    # Run TypeScript type checking with error handling
    Write-Host "Running TypeScript type checking..." -ForegroundColor Cyan
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ TypeScript type checking found issues, but continuing..." -ForegroundColor Yellow
        if (-not $Force) {
            $continue = Read-Host "Do you want to continue despite type errors? (y/N)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                Write-Host "❌ Deployment cancelled due to type errors" -ForegroundColor Red
                exit 1
            }
        }
    }
    
    # Build Next.js application
    Write-Host "Building Next.js application..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Next.js build failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Application built successfully" -ForegroundColor Green
}

# Create Azure resources
Write-Host "`n☁️ Creating Azure Resources..." -ForegroundColor Yellow

# Create resource group
Write-Host "Creating resource group: $ResourceGroup" -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create resource group" -ForegroundColor Red
    exit 1
}

# Create App Service Plan
$appServicePlan = "$AppName-plan"
Write-Host "Creating App Service Plan: $appServicePlan" -ForegroundColor Cyan
az appservice plan create --name $appServicePlan --resource-group $ResourceGroup --location $Location --sku B1 --is-linux
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create App Service Plan" -ForegroundColor Red
    exit 1
}

# Create Web App
Write-Host "Creating Web App: $AppName" -ForegroundColor Cyan
az webapp create --name $AppName --resource-group $ResourceGroup --plan $appServicePlan --runtime "NODE:18-lts"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create Web App" -ForegroundColor Red
    exit 1
}

# Configure Web App settings
Write-Host "Configuring Web App settings..." -ForegroundColor Cyan

# Set environment variables
az webapp config appsettings set --name $AppName --resource-group $ResourceGroup --settings `
    "NODE_ENV=production" `
    "NEXT_TELEMETRY_DISABLED=1" `
    "PORT=8080" `
    "WEBSITE_NODE_DEFAULT_VERSION=18.17.0"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to configure Web App settings" -ForegroundColor Red
    exit 1
}

# Configure startup command
az webapp config set --name $AppName --resource-group $ResourceGroup --startup-file "npm start"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to configure startup command" -ForegroundColor Red
    exit 1
}

# Create deployment package
Write-Host "`n📦 Creating Deployment Package..." -ForegroundColor Yellow

# Create temporary deployment directory
$deployDir = "deploy-temp"
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}
New-Item -ItemType Directory -Path $deployDir

# Copy necessary files
Write-Host "Copying application files..." -ForegroundColor Cyan
Copy-Item -Path ".next" -Destination "$deployDir/.next" -Recurse
Copy-Item -Path "public" -Destination "$deployDir/public" -Recurse
Copy-Item -Path "src" -Destination "$deployDir/src" -Recurse
Copy-Item -Path "package.json" -Destination "$deployDir/"
Copy-Item -Path "package-lock.json" -Destination "$deployDir/" -ErrorAction SilentlyContinue
Copy-Item -Path "next.config.*" -Destination "$deployDir/" -ErrorAction SilentlyContinue
Copy-Item -Path "requirements.txt" -Destination "$deployDir/"
Copy-Item -Path "*.py" -Destination "$deployDir/" -ErrorAction SilentlyContinue

# Create web.config for Azure Web App
$webConfig = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
"@

$webConfig | Out-File -FilePath "$deployDir/web.config" -Encoding UTF8

# Deploy to Azure
Write-Host "`n🚀 Deploying to Azure..." -ForegroundColor Yellow

# Create ZIP package
$zipPath = "tca-irr-deployment.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

Write-Host "Creating deployment package..." -ForegroundColor Cyan
Compress-Archive -Path "$deployDir/*" -DestinationPath $zipPath

# Deploy using ZIP deployment
Write-Host "Uploading to Azure Web App..." -ForegroundColor Cyan
az webapp deploy --name $AppName --resource-group $ResourceGroup --src-path $zipPath --type zip
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

# Clean up temporary files
Write-Host "Cleaning up temporary files..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $deployDir
Remove-Item $zipPath

# Get the application URL
$appUrl = az webapp show --name $AppName --resource-group $ResourceGroup --query "defaultHostName" -o tsv
$fullUrl = "https://$appUrl"

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "🌐 Application URL: $fullUrl" -ForegroundColor Cyan
Write-Host "📊 Azure Portal: https://portal.azure.com" -ForegroundColor Blue

# Additional deployment verification
Write-Host "`n🔍 Deployment Verification..." -ForegroundColor Yellow
Write-Host "Checking application health..." -ForegroundColor Cyan

Start-Sleep -Seconds 30  # Wait for app to start

try {
    $response = Invoke-WebRequest -Uri $fullUrl -TimeoutSec 30 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application is responding successfully" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ Application responded with status code: $($response.StatusCode)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "⚠️ Unable to verify application health immediately. It may take a few minutes to start." -ForegroundColor Yellow
    Write-Host "Please check the application manually at: $fullUrl" -ForegroundColor Blue
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Visit your application: $fullUrl" -ForegroundColor White
Write-Host "2. Configure any additional environment variables if needed" -ForegroundColor White
Write-Host "3. Set up custom domain (optional)" -ForegroundColor White
Write-Host "4. Configure SSL certificate (optional)" -ForegroundColor White
Write-Host "5. Set up monitoring and logging" -ForegroundColor White

Write-Host "`n🎉 TCA-IRR Application Successfully Deployed to Production!" -ForegroundColor Green