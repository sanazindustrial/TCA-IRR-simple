<#
.SYNOPSIS
    Auto-deploy TCA-IRR frontend to Azure App Service via Kudu OneDeploy.
.DESCRIPTION
    Builds the Next.js app (standalone mode), packages it into a zip, and pushes
    directly to Azure using the Kudu publish API. Does NOT require az CLI, GitHub
    Actions, or a GitHub PAT.

    NOTE: api/zipdeploy is BLOCKED (HTTP 400) because ScmType=GitHubAction.
          This script uses api/publish?type=zip (OneDeploy) which works correctly.

.PARAMETER SkipBuild
    Skip the npm build step and use existing .next/standalone output.

.PARAMETER ZipOnly
    Create the deploy zip but do not upload it.

.EXAMPLE
    .\auto-deploy.ps1
    .\auto-deploy.ps1 -SkipBuild
    .\auto-deploy.ps1 -ZipOnly
#>
param(
    [switch]$SkipBuild,
    [switch]$ZipOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Configuration ─────────────────────────────────────────────────────────────
$KUDU_USER  = '$TCA-IRR'
$KUDU_PASS  = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$DEPLOY_URL = 'https://tca-irr.scm.azurewebsites.net/api/publish?type=zip'
$SITE_URL   = 'https://tca-irr.azurewebsites.net'
$API_URL    = 'https://tcairrapiccontainer.azurewebsites.net'
$ProjectRoot = $PSScriptRoot
$ZIP_PATH   = Join-Path $ProjectRoot 'deploy-now.zip'
$STANDALONE = Join-Path $ProjectRoot '.next\standalone'
$STANDALONE_NESTED = Join-Path $ProjectRoot '.next\standalone\.actual-ui'
$STANDALONE_ROOT = $null
# ─────────────────────────────────────────────────────────────────────────────

function Write-Step([string]$msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-OK([string]$msg)   { Write-Host "[OK] $msg"   -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  TCA-IRR Auto Deploy Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# ── Step 1: Build ─────────────────────────────────────────────────────────────
if (-not $SkipBuild) {
    Write-Step "1/5 - Building Next.js app"
    Push-Location $ProjectRoot
    try {
        $env:NEXT_PUBLIC_API_URL = $API_URL
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed (exit $LASTEXITCODE)" }
        Write-OK "Build complete"
    } finally {
        Pop-Location
    }
} else {
    Write-Warn "1/5 - Skipping build (using existing .next/standalone)"
}

# ── Step 2: Verify standalone output ─────────────────────────────────────────
Write-Step "2/5 - Verifying build output"
if (-not (Test-Path $STANDALONE)) { throw "Standalone dir not found: $STANDALONE" }
if (Test-Path (Join-Path $STANDALONE 'server.js')) {
    $STANDALONE_ROOT = $STANDALONE
} elseif (Test-Path (Join-Path $STANDALONE_NESTED 'server.js')) {
    $STANDALONE_ROOT = $STANDALONE_NESTED
} else {
    throw "server.js missing from standalone output (checked: $STANDALONE and $STANDALONE_NESTED)"
}
Write-OK "Standalone output verified"

# ── Step 3: Package ───────────────────────────────────────────────────────────
Write-Step "3/5 - Creating deployment package"

# Ensure .next/static is inside standalone
$staticSrc = Join-Path $ProjectRoot '.next\static'
$staticDst = Join-Path $STANDALONE_ROOT '.next\static'
if (Test-Path $staticSrc) {
    if (-not (Test-Path $staticDst)) { New-Item -ItemType Directory -Path $staticDst -Force | Out-Null }
    Copy-Item "$staticSrc\*" -Destination $staticDst -Recurse -Force
    Write-OK "Copied .next/static"
}

# Ensure public/ is inside standalone
$publicSrc = Join-Path $ProjectRoot 'public'
$publicDst = Join-Path $STANDALONE_ROOT 'public'
if (Test-Path $publicSrc) {
    if (-not (Test-Path $publicDst)) { New-Item -ItemType Directory -Path $publicDst -Force | Out-Null }
    Copy-Item "$publicSrc\*" -Destination $publicDst -Recurse -Force
    Write-OK "Copied public/"
}

if (Test-Path $ZIP_PATH) { Remove-Item $ZIP_PATH -Force }

Push-Location $STANDALONE_ROOT
try {
    Compress-Archive -Path ".\*" -DestinationPath $ZIP_PATH -Force
} finally {
    Pop-Location
}

$zipMB = [math]::Round((Get-Item $ZIP_PATH).Length / 1MB, 2)
Write-OK "Created deploy-now.zip ($zipMB MB)"

if ($ZipOnly) {
    Write-Warn "Zip-only mode. Deploy skipped."
    Write-Host "Zip: $ZIP_PATH"
    exit 0
}

# ── Step 4: Deploy ────────────────────────────────────────────────────────────
Write-Step "4/5 - Deploying to Azure"
Write-Host "  URL : $DEPLOY_URL"
Write-Host "  File: $zipMB MB"

$credBytes = [System.Text.Encoding]::ASCII.GetBytes("${KUDU_USER}:${KUDU_PASS}")
$b64       = [Convert]::ToBase64String($credBytes)

try {
    $resp = Invoke-WebRequest `
        -Uri     $DEPLOY_URL `
        -Method  POST `
        -InFile  $ZIP_PATH `
        -Headers @{ Authorization = "Basic $b64"; "Content-Type" = "application/zip" } `
        -TimeoutSec 300 `
        -UseBasicParsing

    $code = $resp.StatusCode
    if ($code -in 200, 202, 204) {
        Write-OK "Deployment accepted (HTTP $code)"
    } else {
        Write-Fail "Unexpected HTTP $code"
        Write-Host $resp.Content
        exit 1
    }
} catch {
    $code = $_.Exception.Response?.StatusCode.value__
    Write-Fail "Request failed: $_"
    if ($code) { Write-Host "HTTP: $code" }
    exit 1
}

# ── Step 5: Verify ────────────────────────────────────────────────────────────
Write-Step "5/5 - Verifying live site"
Write-Host "Waiting 20s for app to restart..."
Start-Sleep -Seconds 20

$maxWait = 120; $elapsed = 0
while ($elapsed -lt $maxWait) {
    try {
        $check = Invoke-WebRequest -Uri $SITE_URL -TimeoutSec 15 -UseBasicParsing
        if ($check.StatusCode -eq 200) { Write-OK "Site is live (HTTP 200)"; break }
    } catch { }
    Write-Warn "Still waiting... (${elapsed}s / ${maxWait}s)"
    Start-Sleep -Seconds 10
    $elapsed += 10
}
if ($elapsed -ge $maxWait) { Write-Warn "Timed out waiting. Check $SITE_URL manually." }

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Done!  $SITE_URL" -ForegroundColor Green
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "======================================" -ForegroundColor Cyan
