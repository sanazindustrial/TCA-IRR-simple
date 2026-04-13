<#
.SYNOPSIS
    Auto-deploy TCA-IRR frontend to Azure Web App
.DESCRIPTION
    Builds Next.js app, creates deployment package, and deploys to Azure
.EXAMPLE
    .\auto-deploy.ps1
    .\auto-deploy.ps1 -SkipBuild
#>
param(
    [switch]$SkipBuild,
    [switch]$UpdateGitHubSecret
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  TCA-IRR Auto Deploy Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Configuration
$AppName = "TCA-IRR"
$ResourceGroup = "DEV"
$DeployPkg = "$ProjectRoot\deploy-pkg"
$DeployZip = "$ProjectRoot\deploy.zip"

# Step 1: Build (optional)
if (-not $SkipBuild) {
    Write-Host "`n[1/5] Building Next.js application..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "`n[1/5] Skipping build..." -ForegroundColor Gray
}

# Step 2: Prepare deployment package
Write-Host "`n[2/5] Preparing deployment package..." -ForegroundColor Yellow
if (Test-Path $DeployPkg) { Remove-Item -Path $DeployPkg -Recurse -Force }
if (Test-Path $DeployZip) { Remove-Item -Path $DeployZip -Force }

New-Item -ItemType Directory -Path $DeployPkg -Force | Out-Null

# Copy standalone output
if (Test-Path "$ProjectRoot\.next\standalone") {
    Copy-Item -Path "$ProjectRoot\.next\standalone\*" -Destination $DeployPkg -Recurse -Force
} else {
    throw ".next/standalone not found. Run build first."
}

# Copy static assets
if (Test-Path "$ProjectRoot\.next\static") {
    New-Item -ItemType Directory -Path "$DeployPkg\.next\static" -Force | Out-Null
    Copy-Item -Path "$ProjectRoot\.next\static\*" -Destination "$DeployPkg\.next\static" -Recurse -Force
}

# Copy public folder
if (Test-Path "$ProjectRoot\public") {
    Copy-Item -Path "$ProjectRoot\public" -Destination "$DeployPkg\public" -Recurse -Force
}

# Create package.json
Set-Content -Path "$DeployPkg\package.json" -Value '{"name":"tca-irr","scripts":{"start":"node server.js"}}'

# Step 3: Create zip
Write-Host "`n[3/5] Creating deployment zip..." -ForegroundColor Yellow
Compress-Archive -Path "$DeployPkg\*" -DestinationPath $DeployZip -Force
$zipSize = (Get-Item $DeployZip).Length / 1MB
Write-Host "  Created: deploy.zip ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green

# Step 4: Get Kudu credentials and deploy
Write-Host "`n[4/5] Deploying to Azure Web App..." -ForegroundColor Yellow
$creds = az webapp deployment list-publishing-credentials --name $AppName --resource-group $ResourceGroup --query "{user:publishingUserName,pwd:publishingPassword}" -o json | ConvertFrom-Json

if (-not $creds.user -or -not $creds.pwd) {
    throw "Failed to get publishing credentials. Run: az login"
}

$user = $creds.user
$pass = $creds.pwd
$kuduUrl = "https://$AppName.scm.azurewebsites.net/api/zipdeploy?isAsync=false"

Write-Host "  Uploading to Kudu..." -ForegroundColor Gray
$response = curl.exe -s -w "%{http_code}" -X POST -u "${user}:${pass}" `
    --data-binary "@$DeployZip" `
    -H "Content-Type: application/zip" `
    $kuduUrl 2>&1

$statusCode = $response[-3..-1] -join ""
if ($statusCode -eq "200") {
    Write-Host "  Deployment successful! (HTTP 200)" -ForegroundColor Green
} else {
    Write-Host "  Deployment response: $response" -ForegroundColor Yellow
    Write-Host "  Status code: $statusCode" -ForegroundColor Yellow
}

# Step 5: Verify
Write-Host "`n[5/5] Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
$appUrl = "https://tca-irr.azurewebsites.net"
$status = curl.exe -s -o NUL -w "%{http_code}" $appUrl
Write-Host "  App status: HTTP $status" -ForegroundColor $(if ($status -eq "200") { "Green" } else { "Yellow" })

# Optional: Update GitHub Secret
if ($UpdateGitHubSecret) {
    Write-Host "`n[BONUS] Updating GitHub Secret..." -ForegroundColor Cyan
    $publishProfile = az webapp deployment list-publishing-profiles --name $AppName --resource-group $ResourceGroup --xml
    Write-Host @"

To update GitHub secret manually:
1. Go to: https://github.com/sanazindustrial/TCA-IRR-simple/settings/secrets/actions
2. Click 'New repository secret' or update existing
3. Name: AZURE_WEBAPP_PUBLISH_PROFILE
4. Value: (paste the XML content from publish.xml)

Publish profile saved to: $ProjectRoot\publish.xml
"@ -ForegroundColor Yellow
    $publishProfile | Out-File -FilePath "$ProjectRoot\publish.xml" -Encoding utf8
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "  URL: $appUrl" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Cleanup
Remove-Item -Path $DeployPkg -Recurse -Force -ErrorAction SilentlyContinue
