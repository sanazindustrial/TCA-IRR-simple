$ErrorActionPreference = 'SilentlyContinue'

$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$kuduHeaders = @{ Authorization = "Basic $auth" }

$baseUrl = 'https://tca-irr.azurewebsites.net'
$backendUrl = 'https://tcairrapiccontainer.azurewebsites.net'

Write-Host "==========================================="
Write-Host "  TCA-IRR FULL DEPLOYMENT VERIFICATION"
Write-Host "  Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "==========================================="

# --------------------------------------------------
# 1. Check GitHub Actions latest deployment
# --------------------------------------------------
Write-Host ""
Write-Host "=== 1. Deployment Status ==="
$deployInfo = Invoke-RestMethod -Uri 'https://tca-irr.scm.azurewebsites.net/api/deployments' -Headers $kuduHeaders
$latest = $deployInfo | Sort-Object -Property start_time -Descending | Select-Object -First 1
Write-Host "Latest deployment: $($latest.id)"
Write-Host "Status: $($latest.status) ($($latest.status_text))"
Write-Host "Active: $($latest.active)"
Write-Host "Time: $($latest.start_time)"
Write-Host "Message: $($latest.message)"

# --------------------------------------------------
# 2. Check BUILD_ID on server
# --------------------------------------------------
Write-Host ""
Write-Host "=== 2. Build ID Check ==="
$buildCmd = @{ command = 'cat /home/site/wwwroot/.next/BUILD_ID 2>/dev/null || echo MISSING'; dir = '/' } | ConvertTo-Json
$buildResult = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $kuduHeaders -Body $buildCmd -ContentType 'application/json'
Write-Host "Server BUILD_ID: $($buildResult.Output.Trim())"

# Check key manifests
$manifestCmd = @{ command = 'ls -la /home/site/wwwroot/.next/*.json 2>/dev/null | awk "{print $6,$7,$8,$9}"'; dir = '/' } | ConvertTo-Json
$manifestResult = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $kuduHeaders -Body $manifestCmd -ContentType 'application/json'
Write-Host "Manifest timestamps:"
Write-Host $manifestResult.Output

# --------------------------------------------------
# 3. Check key new pages exist on server
# --------------------------------------------------
Write-Host ""
Write-Host "=== 3. Key New Pages on Server ==="
$pageChecks = @(
    'dashboard/reports/ssd/page.js',
    'dashboard/reports/triage',
    'dashboard/reports/due-diligence',
    'dashboard/configure'
)
foreach ($page in $pageChecks) {
    $cmd = @{ command = "ls /home/site/wwwroot/.next/server/app/$page* 2>/dev/null | head -3 | tr '\n' ' '"; dir = '/' } | ConvertTo-Json
    $r = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $kuduHeaders -Body $cmd -ContentType 'application/json'
    $found = if ($r.Output.Trim()) { "FOUND" } else { "MISSING" }
    Write-Host "  [$found] $page"
}

# --------------------------------------------------
# 4. Check SSD entry in app-build-manifest
# --------------------------------------------------
Write-Host ""
Write-Host "=== 4. SSD in app-build-manifest.json ==="
$ssdCmd = @{ command = "grep -c 'reports/ssd' /home/site/wwwroot/.next/app-build-manifest.json 2>/dev/null || echo 0"; dir = '/' } | ConvertTo-Json
$ssdResult = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $kuduHeaders -Body $ssdCmd -ContentType 'application/json'
$ssdCount = $ssdResult.Output.Trim()
Write-Host "SSD entries in manifest: $ssdCount"
if ([int]$ssdCount -gt 0) {
    Write-Host "  STATUS: SSD is registered in manifest"
} else {
    Write-Host "  STATUS: SSD is NOT in manifest - upload needed!"
}

# Check SSD static chunk
$chunkCmd = @{ command = "ls /home/site/wwwroot/_next/static/chunks/app/dashboard/reports/ssd/ 2>/dev/null || echo MISSING"; dir = '/' } | ConvertTo-Json
$chunkResult = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $kuduHeaders -Body $chunkCmd -ContentType 'application/json'
Write-Host "SSD static chunk: $($chunkResult.Output.Trim())"

# --------------------------------------------------
# 5. Live route verification (all 21 routes)
# --------------------------------------------------
Write-Host ""
Write-Host "=== 5. Live Route Verification ==="

$routes = @(
    # Public
    @{ path = '/'; name = 'Homepage' },
    @{ path = '/login'; name = 'Login' },
    @{ path = '/signup'; name = 'Signup' },
    @{ path = '/forgot-password'; name = 'Forgot Password' },
    # Dashboard
    @{ path = '/dashboard'; name = 'Dashboard Home' },
    @{ path = '/dashboard/profile'; name = 'Profile' },
    @{ path = '/dashboard/settings'; name = 'Settings' },
    @{ path = '/dashboard/request'; name = 'New Request' },
    @{ path = '/dashboard/my-requests'; name = 'My Requests' },
    @{ path = '/dashboard/cost'; name = 'Cost' },
    # Reports
    @{ path = '/dashboard/reports/triage'; name = 'Triage Report' },
    @{ path = '/dashboard/reports/due-diligence'; name = 'Due Diligence' },
    @{ path = '/dashboard/reports/ssd'; name = 'SSD Report [KEY]' },
    @{ path = '/dashboard/reports/configure'; name = 'Configure Report' },
    # Analysis
    @{ path = '/dashboard/configure'; name = 'Configure Page' },
    # Admin
    @{ path = '/dashboard/user-requests'; name = 'User Requests (Admin)' },
    @{ path = '/dashboard/analyst'; name = 'Analyst' },
    @{ path = '/dashboard/system-health'; name = 'System Health' },
    # SSD Audit
    @{ path = '/dashboard/ssd-audit'; name = 'SSD Audit' },
    # Analysis modules
    @{ path = '/dashboard/analysis'; name = 'Analysis' },
    # Backend
    @{ path = $backendUrl + '/health'; name = 'Backend Health' }
)

$pass_count = 0
$fail_count = 0
$results = @()

foreach ($route in $routes) {
    $url = if ($route.path.StartsWith('http')) { $route.path } else { $baseUrl + $route.path }
    try {
        $r = Invoke-WebRequest -Uri $url -TimeoutSec 20 -MaximumRedirection 5 -UseBasicParsing
        $status = $r.StatusCode
        $icon = if ($status -eq 200) { "[PASS]" } else { "[WARN $status]" }
        if ($status -eq 200) { $pass_count++ } else { $fail_count++ }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if (-not $status) { $status = "ERR" }
        $icon = "[FAIL $status]"
        $fail_count++
    }
    $results += [PSCustomObject]@{ Icon = $icon; Name = $route.name; Path = $route.path; Status = $status }
    Write-Host ("  {0,-12} {1,-30} {2}" -f $icon, $route.name, $route.path)
}

# --------------------------------------------------
# 6. Check key code features are live
# --------------------------------------------------
Write-Host ""
Write-Host "=== 6. Key Feature Verification ==="

# Check if settings API endpoint exists
$settingsCmd = @{ command = "ls /home/site/wwwroot/.next/server/app/api/settings* 2>/dev/null | head -5"; dir = '/' } | ConvertTo-Json
$settingsR = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $kuduHeaders -Body $settingsCmd -ContentType 'application/json'
Write-Host "Settings API routes: $(if ($settingsR.Output.Trim()) { 'PRESENT' } else { 'MISSING' })"

# Check middleware.ts compiled
$mwCmd = @{ command = "ls /home/site/wwwroot/.next/server/middleware.js 2>/dev/null && echo FOUND || echo MISSING"; dir = '/' } | ConvertTo-Json
$mwR = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $kuduHeaders -Body $mwCmd -ContentType 'application/json'
Write-Host "Middleware compiled: $($mwR.Output.Trim())"

# Check profile API
$profCmd = @{ command = "ls /home/site/wwwroot/.next/server/app/api/profile* 2>/dev/null | head -5"; dir = '/' } | ConvertTo-Json
$profR = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $kuduHeaders -Body $profCmd -ContentType 'application/json'
Write-Host "Profile API routes: $(if ($profR.Output.Trim()) { 'PRESENT' } else { 'MISSING' })"

# Check SSD connection-test API
$ssdApiCmd = @{ command = "ls /home/site/wwwroot/.next/server/app/api/ssd* 2>/dev/null | head -3"; dir = '/' } | ConvertTo-Json
$ssdApiR = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $kuduHeaders -Body $ssdApiCmd -ContentType 'application/json'
Write-Host "SSD API routes: $(if ($ssdApiR.Output.Trim()) { 'PRESENT' } else { 'MISSING' })"

# --------------------------------------------------
# Summary
# --------------------------------------------------
Write-Host ""
Write-Host "==========================================="
Write-Host "  SUMMARY"
Write-Host "==========================================="
Write-Host "Routes PASS: $pass_count / $($routes.Count)"
Write-Host "Routes FAIL: $fail_count / $($routes.Count)"
if ($fail_count -eq 0) {
    Write-Host "  ALL ROUTES LIVE - DEPLOYMENT COMPLETE"
} else {
    Write-Host ""
    Write-Host "  FAILING ROUTES:"
    $results | Where-Object { $_.Icon -notmatch 'PASS' } | ForEach-Object { Write-Host "    $($_.Icon) $($_.Name): $($_.Path)" }
}
Write-Host "==========================================="
