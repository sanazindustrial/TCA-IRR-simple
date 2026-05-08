# Direct Deploy to Azure using Publish Profile
# Downloads and deploys backend code to Azure Web App

param(
    [Parameter(Mandatory = $false)]
    [string]$PublishProfilePath = "",
    
    [Parameter(Mandatory = $false)]
    [string]$AppName = "tcairrapiccontainer"
)

$ErrorActionPreference = "Stop"
$workspaceDir = Split-Path -Parent $PSCommandPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Direct Deploy to Azure Web App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get publish profile
if ([string]::IsNullOrEmpty($PublishProfilePath)) {
    $defaultPath = Join-Path $workspaceDir "$AppName.PublishSettings"
    
    if (Test-Path $defaultPath) {
        $PublishProfilePath = $defaultPath
        Write-Host "Found publish profile: $defaultPath" -ForegroundColor Green
    }
    else {
        Write-Host "Download publish profile from Azure Portal:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Go to: https://portal.azure.com" -ForegroundColor White
        Write-Host "2. App Services > $AppName > Deployment Center" -ForegroundColor White
        Write-Host "3. Click 'Manage publish profile' > 'Download publish profile'" -ForegroundColor White
        Write-Host "4. Save to: $workspaceDir" -ForegroundColor White
        Write-Host ""
        
        # Open portal
        Start-Process "https://portal.azure.com/#blade/WebsitesExtension/FreeTrialExtensionBlade/id/$AppName/resourceType/Microsoft.Web%2Fsites"
        
        $PublishProfilePath = Read-Host "Enter path to publish profile (or press Enter after downloading to $defaultPath)"
        
        if ([string]::IsNullOrEmpty($PublishProfilePath)) {
            # Check for downloaded files
            $possibleFiles = Get-ChildItem -Path $workspaceDir -Filter "*.PublishSettings" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            
            if ($null -ne $possibleFiles) {
                $PublishProfilePath = $possibleFiles.FullName
                Write-Host "Using: $PublishProfilePath" -ForegroundColor Green
            }
            else {
                Write-Host "Error: No publish profile found" -ForegroundColor Red
                exit 1
            }
        }
    }
}

if (-not (Test-Path $PublishProfilePath)) {
    Write-Host "Error: File not found: $PublishProfilePath" -ForegroundColor Red
    exit 1
}

# Parse publish profile
Write-Host "Parsing publish profile..." -ForegroundColor Yellow

[xml]$profile = Get-Content $PublishProfilePath
$publishData = $profile.publishData.publishProfile | Where-Object { $_.publishMethod -eq "ZipDeploy" -or $_.publishMethod -eq "MSDeploy" } | Select-Object -First 1

if ($null -eq $publishData) {
    $publishData = $profile.publishData.publishProfile | Select-Object -First 1
}

$userName = $publishData.userName
$password = $publishData.userPWD
$siteName = $publishData.msdeploySite

if ([string]::IsNullOrEmpty($siteName)) {
    $siteName = $AppName
}

Write-Host "Site: $siteName" -ForegroundColor Cyan
Write-Host "User: $userName" -ForegroundColor Cyan

# Create deployment package
Write-Host ""
Write-Host "Creating deployment package..." -ForegroundColor Yellow

$zipPath = Join-Path $env:TEMP "backend-deploy.zip"

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Files to include in backend deployment
$includePatterns = @(
    "*.py",
    "requirements.txt",
    "startup.sh"
)

$excludePatterns = @(
    ".venv",
    "__pycache__",
    "node_modules",
    ".next",
    ".git",
    "*.zip",
    "*.PublishSettings"
)

# Create zip
Push-Location $workspaceDir

$filesToZip = Get-ChildItem -Path . -Recurse -File | Where-Object {
    $include = $false
    foreach ($pattern in $includePatterns) {
        if ($_.Name -like $pattern) { $include = $true; break }
    }
    
    $exclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($_.FullName -like "*$pattern*") { $exclude = $true; break }
    }
    
    $include -and (-not $exclude)
}

# Also include specific folders
$additionalFiles = Get-ChildItem -Path . -File | Where-Object { 
    $_.Name -in @("main.py", "requirements.txt", "startup.sh", "ai_integration.py", "database_config.py", "ssd_tirr_report_config.py")
}

$allFiles = ($filesToZip + $additionalFiles) | Select-Object -Unique

Write-Host "Including $($allFiles.Count) files in deployment" -ForegroundColor Gray

Compress-Archive -Path $allFiles.FullName -DestinationPath $zipPath -Force

Pop-Location

$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "Package size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Gray

# Deploy
Write-Host ""
Write-Host "Deploying to $siteName..." -ForegroundColor Yellow

$kuduUrl = "https://$siteName.scm.azurewebsites.net/api/zipdeploy"

$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${userName}:${password}"))

$headers = @{
    "Authorization" = "Basic $base64Auth"
    "Content-Type"  = "application/zip"
}

try {
    $response = Invoke-RestMethod -Uri $kuduUrl -Method Post -InFile $zipPath -Headers $headers -TimeoutSec 300
    Write-Host "Deployment successful!" -ForegroundColor Green
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    
    if ($statusCode -eq 200 -or $statusCode -eq 202) {
        Write-Host "Deployment successful!" -ForegroundColor Green
    }
    else {
        Write-Host "Deployment error: $statusCode" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

# Cleanup
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue

# Verify
Write-Host ""
Write-Host "Waiting for app to restart (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "Verifying deployment..." -ForegroundColor Yellow

$endpoints = @(
    @{Name = "Health Check"; Url = "https://$siteName.azurewebsites.net/api/health" },
    @{Name = "SSD Stats"; Url = "https://$siteName.azurewebsites.net/api/ssd/audit/stats" }
)

foreach ($ep in $endpoints) {
    try {
        $r = Invoke-WebRequest -Uri $ep.Url -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
        Write-Host "  $($ep.Name): $($r.StatusCode) OK" -ForegroundColor Green
    }
    catch {
        $code = $_.Exception.Response.StatusCode.Value__
        if ($code) {
            Write-Host "  $($ep.Name): $code" -ForegroundColor $(if ($code -eq 404) { "Red" } else { "Yellow" })
        }
        else {
            Write-Host "  $($ep.Name): Error - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend URL: https://$siteName.azurewebsites.net" -ForegroundColor Cyan
