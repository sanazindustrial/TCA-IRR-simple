# ==============================================================================
# TCA-IRR Auto-Deploy Script for Azure Web App
# ==============================================================================
# Usage: .\deploy-azure.ps1 [-SkipBuild] [-SetupSecrets]
# ==============================================================================

param(
    [switch]$SkipBuild,
    [switch]$SetupSecrets
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot
$AppName = "TCA-IRR"
$ResourceGroup = "DEV"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TCA-IRR Auto-Deploy to Azure" -ForegroundColor Cyan  
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Function to check Azure login
function Test-AzureLogin {
    try {
        $account = az account show 2>$null | ConvertFrom-Json
        if ($account) {
            Write-Host "[OK] Logged in as: $($account.user.name)" -ForegroundColor Green
            return $true
        }
    } catch {}
    Write-Host "[ERROR] Not logged into Azure CLI. Run 'az login' first." -ForegroundColor Red
    return $false
}

# Function to setup GitHub secrets
function Setup-GitHubSecrets {
    Write-Host "`n[SETUP] Getting Azure publish profile..." -ForegroundColor Yellow
    
    $publishProfile = az webapp deployment list-publishing-profiles `
        --name $AppName `
        --resource-group $ResourceGroup `
        --xml 2>$null
    
    if ($publishProfile) {
        $profilePath = Join-Path $WorkspaceRoot "publish-profile.xml"
        $publishProfile | Out-File -FilePath $profilePath -Encoding utf8
        
        Write-Host "`n[SUCCESS] Publish profile saved to: $profilePath" -ForegroundColor Green
        Write-Host ""
        Write-Host "==== GITHUB SECRETS SETUP ====" -ForegroundColor Cyan
        Write-Host "1. Go to: https://github.com/sanazindustrial/TCA-IRR-simple/settings/secrets/actions"
        Write-Host "2. Click 'New repository secret'"
        Write-Host "3. Name: AZURE_WEBAPP_PUBLISH_PROFILE"
        Write-Host "4. Value: Copy the entire contents of publish-profile.xml"
        Write-Host "5. Click 'Add secret'"
        Write-Host ""
        Write-Host "After adding the secret, GitHub Actions will auto-deploy on every push!"
        Write-Host ""
        
        # Open the file in default editor
        Start-Process $profilePath
    } else {
        Write-Host "[ERROR] Failed to get publish profile" -ForegroundColor Red
    }
}

# Main deployment function
function Deploy-ToAzure {
    Write-Host "[1/5] Checking Azure login..." -ForegroundColor Yellow
    if (-not (Test-AzureLogin)) { exit 1 }
    
    Set-Location $WorkspaceRoot
    
    # Build if not skipped
    if (-not $SkipBuild) {
        Write-Host "`n[2/5] Building Next.js app..." -ForegroundColor Yellow
        
        # Clean previous build
        if (Test-Path ".next") { Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue }
        if (Test-Path "deploy-pkg") { Remove-Item -Path "deploy-pkg" -Recurse -Force -ErrorAction SilentlyContinue }
        if (Test-Path "deploy.zip") { Remove-Item -Path "deploy.zip" -Force -ErrorAction SilentlyContinue }
        
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Build failed!" -ForegroundColor Red
            exit 1
        }
        Write-Host "[OK] Build completed" -ForegroundColor Green
    } else {
        Write-Host "`n[2/5] Skipping build (using existing .next folder)" -ForegroundColor Yellow
    }
    
    # Create deployment package
    Write-Host "`n[3/5] Creating deployment package..." -ForegroundColor Yellow
    
    if (Test-Path "deploy-pkg") { Remove-Item -Path "deploy-pkg" -Recurse -Force }
    New-Item -ItemType Directory -Path "deploy-pkg" | Out-Null
    
    # Use robocopy for faster copying
    robocopy ".next\standalone" "deploy-pkg" /E /NFL /NDL /NJH /NJS /NP | Out-Null
    New-Item -ItemType Directory -Path "deploy-pkg\.next\static" -Force | Out-Null
    robocopy ".next\static" "deploy-pkg\.next\static" /E /NFL /NDL /NJH /NJS /NP | Out-Null
    
    if (Test-Path "public") {
        robocopy "public" "deploy-pkg\public" /E /NFL /NDL /NJH /NJS /NP | Out-Null
    }
    
    # Create minimal package.json
    '{"name":"tca-irr","scripts":{"start":"node server.js"}}' | Out-File -FilePath "deploy-pkg\package.json" -Encoding utf8 -NoNewline
    
    # Create zip
    Write-Host "[3/5] Compressing..." -ForegroundColor Yellow
    if (Test-Path "deploy.zip") { Remove-Item "deploy.zip" -Force }
    Compress-Archive -Path "deploy-pkg\*" -DestinationPath "deploy.zip" -CompressionLevel Fastest -Force
    
    $zipSize = [math]::Round((Get-Item "deploy.zip").Length / 1MB, 2)
    Write-Host "[OK] Package created: $zipSize MB" -ForegroundColor Green
    
    # Get credentials
    Write-Host "`n[4/5] Getting deployment credentials..." -ForegroundColor Yellow
    $creds = az webapp deployment list-publishing-credentials `
        --name $AppName `
        --resource-group $ResourceGroup `
        --query "[publishingUserName,publishingPassword]" -o tsv
    
    $credArray = $creds -split "`n"
    $user = $credArray[0].Trim()
    $pass = $credArray[1].Trim()
    
    # Deploy
    Write-Host "`n[5/5] Deploying to Azure Web App..." -ForegroundColor Yellow
    
    $result = curl.exe --fail -s -w "%{http_code}" `
        -X POST `
        -u "${user}:${pass}" `
        --data-binary "@deploy.zip" `
        -H "Content-Type: application/zip" `
        "https://tca-irr.scm.azurewebsites.net/api/zipdeploy?isAsync=false"
    
    if ($result -eq "200") {
        Write-Host "`n============================================" -ForegroundColor Green
        Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Site URL: https://tca-irr.azurewebsites.net" -ForegroundColor Cyan
        Write-Host ""
        
        # Test the site
        Write-Host "Verifying deployment (waiting 15s for restart)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
        
        try {
            $response = Invoke-WebRequest -Uri "https://tca-irr.azurewebsites.net" -UseBasicParsing -TimeoutSec 30
            Write-Host "[OK] Site is responding: HTTP $($response.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "[WARN] Site is still starting up. Please wait a moment." -ForegroundColor Yellow
        }
    } else {
        Write-Host "[ERROR] Deployment failed with status: $result" -ForegroundColor Red
        exit 1
    }
    
    # Cleanup
    Remove-Item -Path "deploy-pkg" -Recurse -Force -ErrorAction SilentlyContinue
}

# Main execution
if ($SetupSecrets) {
    if (Test-AzureLogin) {
        Setup-GitHubSecrets
    }
} else {
    Deploy-ToAzure
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
