$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$baseHeaders = @{ Authorization = "Basic $auth" }
$baseUrl = 'https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot'
$localRoot = 'C:\Users\Allot\Desktop\TCA-IRR-APP-main- simplify\TCA-IRR-simple'

function Upload-File($localPath, $remotePath) {
    $headers = $baseHeaders.Clone()
    $headers['If-Match'] = '*'
    $url = "$baseUrl/$remotePath"
    Write-Host "Uploading: $remotePath ..."
    try {
        Invoke-RestMethod -Method Put -Uri $url -Headers $headers -InFile $localPath -ContentType 'application/octet-stream' | Out-Null
        Write-Host "  OK" -ForegroundColor Green
    } catch {
        Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 1. Server-side SSD files (.html, .meta, .rsc)
$ssdServerFiles = @(
    @{ local = '.next\server\app\dashboard\reports\ssd.html'; remote = '.next/server/app/dashboard/reports/ssd.html' },
    @{ local = '.next\server\app\dashboard\reports\ssd.meta'; remote = '.next/server/app/dashboard/reports/ssd.meta' },
    @{ local = '.next\server\app\dashboard\reports\ssd.rsc';  remote = '.next/server/app/dashboard/reports/ssd.rsc'  }
)

Write-Host "=== Uploading SSD server-side files ===" -ForegroundColor Cyan
foreach ($f in $ssdServerFiles) {
    $lp = Join-Path $localRoot $f.local
    if (Test-Path $lp) {
        Upload-File $lp $f.remote
    } else {
        Write-Host "  SKIP (not found locally): $($f.local)" -ForegroundColor Yellow
    }
}

# 2. SSD page.js and related files in server/app/dashboard/reports/ssd/
Write-Host ""
Write-Host "=== Uploading SSD server directory files ===" -ForegroundColor Cyan
$ssdDir = Join-Path $localRoot '.next\server\app\dashboard\reports\ssd'
if (Test-Path $ssdDir) {
    Get-ChildItem $ssdDir -File | ForEach-Object {
        Upload-File $_.FullName ".next/server/app/dashboard/reports/ssd/$($_.Name)"
    }
} else {
    Write-Host "  SSD server dir not found locally" -ForegroundColor Yellow
}

# 3. Static client chunk for SSD
Write-Host ""
Write-Host "=== Uploading SSD static client chunk ===" -ForegroundColor Cyan
$ssdStaticDir = Join-Path $localRoot '.next\static\chunks\app\dashboard\reports\ssd'
if (Test-Path $ssdStaticDir) {
    Get-ChildItem $ssdStaticDir -File | ForEach-Object {
        # Ensure remote directory exists by just trying to upload
        Upload-File $_.FullName ".next/static/chunks/app/dashboard/reports/ssd/$($_.Name)"
    }
} else {
    Write-Host "  SSD static chunk dir not found locally" -ForegroundColor Yellow
}

# 4. Updated manifests
Write-Host ""
Write-Host "=== Uploading updated manifest files ===" -ForegroundColor Cyan
$manifests = @(
    @{ local = '.next\standalone\.next\app-build-manifest.json';      remote = '.next/app-build-manifest.json' },
    @{ local = '.next\standalone\.next\app-path-routes-manifest.json'; remote = '.next/app-path-routes-manifest.json' },
    @{ local = '.next\standalone\.next\BUILD_ID';                      remote = '.next/BUILD_ID' }
)
foreach ($f in $manifests) {
    $lp = Join-Path $localRoot $f.local
    if (Test-Path $lp) {
        Upload-File $lp $f.remote
    } else {
        Write-Host "  SKIP (not found locally): $($f.local)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Done! Waiting 5s for Azure to apply changes... ===" -ForegroundColor Cyan
Start-Sleep -Seconds 5

# 5. Verify SSD route is now accessible
Write-Host ""
Write-Host "=== Verifying SSD route ===" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri 'https://tca-irr.azurewebsites.net/dashboard/reports/ssd' -TimeoutSec 30 -MaximumRedirection 5
    Write-Host "  HTTP $($r.StatusCode) - $(if ($r.StatusCode -eq 200) {'SUCCESS!'} else {'Still failing'})" -ForegroundColor $(if ($r.StatusCode -eq 200) {'Green'} else {'Red'})
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "  HTTP $statusCode - $($_.Exception.Message)" -ForegroundColor Red
}
