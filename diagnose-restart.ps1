$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth" }

# Check environment
Write-Host "=== Environment check ==="
$body = @{ command = "which node && node --version && echo PATH_OK"; dir = "/" } | ConvertTo-Json
try {
    $r = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $headers -Body $body -ContentType 'application/json'
    Write-Host "Output: $($r.Output)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

# Check if app-build-manifest on server was updated
Write-Host ""
Write-Host "=== Check app-build-manifest.json timestamp ==="
$r2 = Invoke-RestMethod "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/" -Headers $headers
$r2 | Where-Object { $_.name -match 'manifest|BUILD_ID' } | ForEach-Object { Write-Host "$($_.name)  mtime=$($_.mtime)" }

# Try to get the content of app-build-manifest to verify SSD is there
Write-Host ""
Write-Host "=== Check if app-build-manifest.json contains ssd ==="
$body3 = @{ command = "grep -c 'reports/ssd' /home/site/wwwroot/.next/app-build-manifest.json 2>&1 || echo 'not found'"; dir = "/" } | ConvertTo-Json
try {
    $r3 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $headers -Body $body3 -ContentType 'application/json'
    Write-Host "SSD matches in app-build-manifest: $($r3.Output.Trim())"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

# Try touching server.js to trigger a restart
Write-Host ""
Write-Host "=== Touch server.js to trigger restart ==="
$body4 = @{ command = "touch /home/site/wwwroot/server.js && echo touched"; dir = "/" } | ConvertTo-Json
try {
    $r4 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $headers -Body $body4 -ContentType 'application/json'
    Write-Host "Touch result: $($r4.Output.Trim())"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

Start-Sleep -Seconds 15

Write-Host ""
Write-Host "=== Testing SSD route ==="
try {
    $r5 = Invoke-WebRequest -Uri 'https://tca-irr.azurewebsites.net/dashboard/reports/ssd' -TimeoutSec 30 -MaximumRedirection 5
    Write-Host ("HTTP {0}" -f $r5.StatusCode)
} catch {
    Write-Host ("HTTP {0}" -f $_.Exception.Response.StatusCode.value__)
}
