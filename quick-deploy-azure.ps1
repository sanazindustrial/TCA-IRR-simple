# Quick Deploy Script - Deploy directly to Azure Web App
# This uses ZIP deployment via SCM/Kudu - no Azure DevOps pipeline needed

param(
    [Parameter(Mandatory = $false)]
    [string]$BackendApp = "tcairrapiccontainer",
    
    [Parameter(Mandatory = $false)]
    [string]$FrontendApp = "tca-irr"
)

$ErrorActionPreference = "Stop"
$workspaceDir = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TCA-IRR Quick Deploy to Azure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check for deployment credentials
Write-Host "[1/6] Checking deployment configuration..." -ForegroundColor Yellow

$publishProfileBackend = "$workspaceDir\publishprofile-backend.xml"
$publishProfileFrontend = "$workspaceDir\publishprofile-frontend.xml"

$hasBackendProfile = Test-Path $publishProfileBackend
$hasFrontendProfile = Test-Path $publishProfileFrontend

if (-not $hasBackendProfile -and -not $hasFrontendProfile) {
    Write-Host ""
    Write-Host "Publish profiles not found. To get them:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For Backend (Python API):" -ForegroundColor White
    Write-Host "  1. Go to: https://portal.azure.com" -ForegroundColor Gray
    Write-Host "  2. Navigate to: App Services > $BackendApp > Deployment Center" -ForegroundColor Gray
    Write-Host "  3. Click 'Manage publish profile' > 'Download publish profile'" -ForegroundColor Gray
    Write-Host "  4. Save as: $publishProfileBackend" -ForegroundColor Gray
    Write-Host ""
    Write-Host "For Frontend (Next.js):" -ForegroundColor White
    Write-Host "  1. Go to: https://portal.azure.com" -ForegroundColor Gray
    Write-Host "  2. Navigate to: App Services > $FrontendApp > Deployment Center" -ForegroundColor Gray
    Write-Host "  3. Click 'Manage publish profile' > 'Download publish profile'" -ForegroundColor Gray
    Write-Host "  4. Save as: $publishProfileFrontend" -ForegroundColor Gray
    Write-Host ""
    
    # Open Azure Portal to the right pages
    Write-Host "Opening Azure Portal..." -ForegroundColor Yellow
    Start-Process "https://portal.azure.com/#@/resource/subscriptions/f8e74a42-3d3d-4a45-974f-77b7e48c77b4/resourceGroups/Default-Web-EastUS/providers/Microsoft.Web/sites/$BackendApp/vstscd"
    
    Write-Host ""
    Write-Host "Alternative: Use Azure DevOps Pipeline" -ForegroundColor Cyan
    Write-Host "  Run: .\setup-azure-pipeline.ps1" -ForegroundColor White
    Write-Host "  (Requires Azure DevOps PAT)" -ForegroundColor Gray
    Write-Host ""
    
    $continue = Read-Host "Press ENTER after downloading publish profiles, or 'skip' to exit"
    if ($continue -eq "skip") {
        exit 0
    }
    
    $hasBackendProfile = Test-Path $publishProfileBackend
    $hasFrontendProfile = Test-Path $publishProfileFrontend
}

# Function to extract credentials from publish profile
function Get-PublishCredentials {
    param([string]$ProfilePath)
    
    if (-not (Test-Path $ProfilePath)) {
        return $null
    }
    
    [xml]$profile = Get-Content $ProfilePath
    $publishData = $profile.publishData.publishProfile | Where-Object { $_.publishMethod -eq "ZipDeploy" -or $_.publishMethod -eq "MSDeploy" } | Select-Object -First 1
    
    if ($null -eq $publishData) {
        $publishData = $profile.publishData.publishProfile | Select-Object -First 1
    }
    
    return @{
        Url      = $publishData.publishUrl
        Username = $publishData.userName
        Password = $publishData.userPWD
        SiteName = $publishData.msdeploySite
    }
}

# Deploy Backend
if ($hasBackendProfile) {
    Write-Host "[2/6] Deploying Backend API..." -ForegroundColor Yellow
    
    $creds = Get-PublishCredentials -ProfilePath $publishProfileBackend
    
    if ($null -eq $creds) {
        Write-Host "  Error: Could not parse publish profile" -ForegroundColor Red
    }
    else {
        # Create deployment package
        Write-Host "  Creating deployment package..." -ForegroundColor Gray
        
        $backendFiles = @(
            "main.py",
            "requirements.txt",
            "startup.sh",
            "ai_integration.py",
            "database_config.py",
            "ssd_tirr_report_config.py"
        )
        
        $zipPath = "$workspaceDir\backend-deploy.zip"
        
        if (Test-Path $zipPath) {
            Remove-Item $zipPath -Force
        }
        
        # Create zip with backend files
        $filesToZip = $backendFiles | Where-Object { Test-Path "$workspaceDir\$_" } | ForEach-Object { "$workspaceDir\$_" }
        
        Compress-Archive -Path $filesToZip -DestinationPath $zipPath -Force
        
        Write-Host "  Uploading to Azure..." -ForegroundColor Gray
        
        $kuduUrl = "https://$BackendApp.scm.azurewebsites.net/api/zipdeploy"
        $base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$($creds.Username):$($creds.Password)"))
        
        try {
            $response = Invoke-RestMethod -Uri $kuduUrl -Method Post -InFile $zipPath -ContentType "application/zip" -Headers @{Authorization = "Basic $base64Auth" }
            Write-Host "  Backend deployed successfully!" -ForegroundColor Green
        }
        catch {
            Write-Host "  Deployment error: $_" -ForegroundColor Red
        }
        
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    }
}
else {
    Write-Host "[2/6] Skipping backend - no publish profile" -ForegroundColor Gray
}

# Deploy Frontend
if ($hasFrontendProfile) {
    Write-Host "[3/6] Building Frontend..." -ForegroundColor Yellow
    
    Push-Location $workspaceDir
    
    # Build Next.js
    if (Test-Path "package.json") {
        npm run build 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Build successful" -ForegroundColor Green
            
            Write-Host "[4/6] Creating frontend deployment package..." -ForegroundColor Yellow
            
            $creds = Get-PublishCredentials -ProfilePath $publishProfileFrontend
            
            if ($null -ne $creds) {
                $zipPath = "$workspaceDir\frontend-deploy.zip"
                
                # Create standalone deployment
                if (Test-Path ".next\standalone") {
                    Compress-Archive -Path ".next\standalone\*" -DestinationPath $zipPath -Force
                }
                else {
                    # Fallback to .next folder
                    Compress-Archive -Path @(".next", "public", "package.json") -DestinationPath $zipPath -Force
                }
                
                Write-Host "[5/6] Uploading frontend to Azure..." -ForegroundColor Yellow
                
                $kuduUrl = "https://$FrontendApp.scm.azurewebsites.net/api/zipdeploy"
                $base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$($creds.Username):$($creds.Password)"))
                
                try {
                    $response = Invoke-RestMethod -Uri $kuduUrl -Method Post -InFile $zipPath -ContentType "application/zip" -Headers @{Authorization = "Basic $base64Auth" }
                    Write-Host "  Frontend deployed successfully!" -ForegroundColor Green
                }
                catch {
                    Write-Host "  Deployment error: $_" -ForegroundColor Red
                }
                
                Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
            }
        }
        else {
            Write-Host "  Build failed" -ForegroundColor Red
        }
    }
    
    Pop-Location
}
else {
    Write-Host "[3-5/6] Skipping frontend - no publish profile" -ForegroundColor Gray
}

Write-Host "[6/6] Verifying deployment..." -ForegroundColor Yellow

$endpoints = @(
    @{ Name = "Backend Health"; Url = "https://$BackendApp.azurewebsites.net/api/health" },
    @{ Name = "SSD Stats"; Url = "https://$BackendApp.azurewebsites.net/api/ssd/audit/stats" },
    @{ Name = "Frontend"; Url = "https://$FrontendApp.azurewebsites.net" }
)

Write-Host ""
foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -Method Get -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
        $status = $response.StatusCode
        if ($status -eq 200) {
            Write-Host "  $($endpoint.Name): OK (200)" -ForegroundColor Green
        }
        else {
            Write-Host "  $($endpoint.Name): $status" -ForegroundColor Yellow
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode) {
            Write-Host "  $($endpoint.Name): $statusCode" -ForegroundColor Red
        }
        else {
            Write-Host "  $($endpoint.Name): Error - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
