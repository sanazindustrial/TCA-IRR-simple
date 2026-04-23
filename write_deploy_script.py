"""Write rebuild-and-deploy.ps1 with correct content."""
import os

dest = os.path.join(os.path.dirname(__file__), "rebuild-and-deploy.ps1")

script = r"""param(
    [string]$FrontendApp = "tca-irr",
    [string]$BackendApp = "tcairrapiccontainer",
    [string]$BackendRG = "tca-platform-rg",
    [string]$FrontendRG = "tca-platform-rg",
    [switch]$SkipLogin,
    [switch]$SkipFrontend,
    [switch]$SkipBackend,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root

function Write-Step([string]$msg) {
    Write-Host "`n[$(Get-Date -Format HH:mm:ss)] $msg" -ForegroundColor Cyan
}
function Write-OK([string]$msg)   { Write-Host "  OK  $msg"   -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "  WARN $msg"  -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "  FAIL $msg"  -ForegroundColor Red; exit 1 }

Write-Host "TCA-IRR - Rebuild and Redeploy to Azure" -ForegroundColor Magenta

# 1. Prerequisites
Write-Step "1/8  Prerequisites"
if (-not (Get-Command az   -ErrorAction SilentlyContinue)) { Write-Fail "Azure CLI not installed" }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Fail "Node.js not installed" }
if (-not (Get-Command npm  -ErrorAction SilentlyContinue)) { Write-Fail "npm not installed" }
Write-OK "Node $(node --version)"

# 2. Azure login
Write-Step "2/8  Azure authentication"
if (-not $SkipLogin) {
    $acct = az account show --query "user.name" -o tsv 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($acct)) {
        az login
        if ($LASTEXITCODE -ne 0) { Write-Fail "Azure login failed" }
        $acct = az account show --query "user.name" -o tsv
    }
    Write-OK "Logged in: $acct"
    Write-OK "Sub: $(az account show --query name -o tsv)"
} else { Write-Warn "SkipLogin set" }

# 3. Locate App Services
Write-Step "3/8  Locating App Services"
function Get-AppRG([string]$n) {
    return (az webapp list --query "[?name=='$n'].resourceGroup" -o tsv 2>$null)
}
if (-not $SkipBackend) {
    $rg = Get-AppRG $BackendApp
    if (-not [string]::IsNullOrEmpty($rg)) { $BackendRG = $rg }
    Write-OK "Backend '$BackendApp' in RG '$BackendRG'"
}
if (-not $SkipFrontend) {
    $rg2 = Get-AppRG $FrontendApp
    if (-not [string]::IsNullOrEmpty($rg2)) { $FrontendRG = $rg2 }
    Write-OK "Frontend '$FrontendApp' in RG '$FrontendRG'"
}

# 4. Build frontend
if (-not $SkipFrontend) {
    Write-Step "4/8  Building Next.js frontend"
    if (-not $SkipBuild) {
        npm ci --prefer-offline
        if ($LASTEXITCODE -ne 0) { Write-Fail "npm ci failed" }
        $env:NEXT_PUBLIC_API_URL    = "https://tcairrapiccontainer.azurewebsites.net"
        $env:NODE_ENV               = "production"
        $env:NEXT_TELEMETRY_DISABLED = "1"
        npm run build
        if ($LASTEXITCODE -ne 0) { Write-Fail "next build failed" }
        Write-OK "Build complete"
    } else {
        if (-not (Test-Path ".next\standalone")) { Write-Fail ".next/standalone missing - run without -SkipBuild" }
        Write-Warn "Using cached build"
    }

    # 5a. Package frontend
    Write-Step "5a/8 Packaging frontend"
    $fts    = Get-Date -Format "yyyyMMdd-HHmmss"
    $fzip   = "$Root\frontend-$fts.zip"
    $stage  = "$Root\_fstage"
    if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
    New-Item -ItemType Directory $stage | Out-Null
    Copy-Item ".next\standalone\*" $stage -Recurse -Force
    $sd = "$stage\.next\static"
    if (-not (Test-Path $sd)) { New-Item -ItemType Directory $sd | Out-Null }
    Copy-Item ".next\static\*" $sd -Recurse -Force
    if (Test-Path "public") { Copy-Item "public" "$stage\public" -Recurse -Force }
    Compress-Archive "$stage\*" $fzip -Force
    Remove-Item $stage -Recurse -Force
    $kb = [math]::Round((Get-Item $fzip).Length / 1KB)
    Write-OK "$(Split-Path $fzip -Leaf) ($kb KB)"

    # 5b. Deploy frontend
    Write-Step "5b/8 Deploying frontend"
    az webapp deploy `
        --resource-group $FrontendRG `
        --name $FrontendApp `
        --src-path $fzip `
        --type zip `
        --clean true `
        --restart true
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "az deploy failed - Kudu fallback"
        $ku  = "https://$FrontendApp.scm.azurewebsites.net/api/zipdeploy"
        $cr  = az webapp deployment list-publishing-credentials `
                 --name $FrontendApp --resource-group $FrontendRG `
                 --query "{u:publishingUserName,p:publishingPassword}" -o json 2>$null | ConvertFrom-Json
        if ($cr) {
            $tok = [Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("$($cr.u):$($cr.p)"))
            Invoke-RestMethod $ku -Method POST -Headers @{Authorization="Basic $tok"} `
                -ContentType "application/zip" -InFile $fzip | Out-Null
            Write-OK "Frontend deployed via Kudu"
        } else { Write-Fail "Frontend deploy failed" }
    } else { Write-OK "Frontend deployed" }
    if (Test-Path $fzip) { Remove-Item $fzip -Force }
} else { Write-Step "4/8  Skipping frontend (-SkipFrontend)" }

# 6. Package backend
if (-not $SkipBackend) {
    Write-Step "6/8  Packaging backend"
    $bdir = "$Root\backend"
    if (-not (Test-Path $bdir)) { Write-Fail "backend/ not found at $bdir" }
    $ssh = "$bdir\startup.sh"
    if (-not (Test-Path $ssh)) {
        "#!/bin/bash`nset -e`npip install -r requirements.txt --quiet`nexec gunicorn main:app --bind 0.0.0.0:8000 --workers 2 --worker-class uvicorn.workers.UvicornWorker --timeout 600" |
            Set-Content $ssh -Encoding UTF8
        Write-OK "Created startup.sh"
    }
    $bts  = Get-Date -Format "yyyyMMdd-HHmmss"
    $bzip = "$Root\backend-$bts.zip"
    Compress-Archive "$bdir\*" $bzip -Force
    $mb = [math]::Round((Get-Item $bzip).Length / 1MB, 1)
    Write-OK "$(Split-Path $bzip -Leaf) ($mb MB)"

    # 7. Deploy backend
    Write-Step "7/8  Deploying backend"
    az webapp config set `
        --resource-group $BackendRG `
        --name $BackendApp `
        --startup-file "startup.sh" 2>$null | Out-Null
    az webapp deploy `
        --resource-group $BackendRG `
        --name $BackendApp `
        --src-path $bzip `
        --type zip `
        --clean true `
        --restart true
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "az deploy failed - Kudu fallback"
        $ku2 = "https://$BackendApp.scm.azurewebsites.net/api/zipdeploy"
        $cr2 = az webapp deployment list-publishing-credentials `
                 --name $BackendApp --resource-group $BackendRG `
                 --query "{u:publishingUserName,p:publishingPassword}" -o json 2>$null | ConvertFrom-Json
        if ($cr2) {
            $tok2 = [Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("$($cr2.u):$($cr2.p)"))
            Invoke-RestMethod $ku2 -Method POST -Headers @{Authorization="Basic $tok2"} `
                -ContentType "application/zip" -InFile $bzip | Out-Null
            Write-OK "Backend deployed via Kudu"
        } else { Write-Fail "Backend deploy failed" }
    } else { Write-OK "Backend deployed" }
    if (Test-Path $bzip) { Remove-Item $bzip -Force }
} else { Write-Step "6/8  Skipping backend (-SkipBackend)" }

# 8. Health check
Write-Step "8/8  Health check (waiting 20s)"
Start-Sleep -Seconds 20

function Test-Endpoint([string]$url, [string]$label) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 25 -ErrorAction Stop
        if ($r.StatusCode -lt 400) { Write-OK "$label -> HTTP $($r.StatusCode)" }
        else { Write-Warn "$label -> HTTP $($r.StatusCode)" }
    } catch { Write-Warn "$label -> $($_.Exception.Message)" }
}

if (-not $SkipBackend)  { Test-Endpoint "https://$BackendApp.azurewebsites.net/health" "Backend /health" }
if (-not $SkipFrontend) { Test-Endpoint "https://$FrontendApp.azurewebsites.net/"      "Frontend /"     }

Write-Host "`nDeployment complete!" -ForegroundColor Green
Write-Host "Frontend : https://$FrontendApp.azurewebsites.net" -ForegroundColor Green
Write-Host "Backend  : https://$BackendApp.azurewebsites.net"  -ForegroundColor Green
"""

with open(dest, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(script)

lines = script.count("\n")
print(f"Written: {dest}  ({lines} lines)")
