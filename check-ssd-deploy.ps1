b$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth" }

# Check deployed SSD files
$url = "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/server/app/dashboard/reports/"
$r = Invoke-RestMethod $url -Headers $headers
Write-Host "=== Deployed /reports/ directory ==="
$r | ForEach-Object { Write-Host "$($_.name)  mtime=$($_.mtime)  size=$($_.size)" }

Write-Host ""

# Check SSD subdirectory
try {
    $r2 = Invoke-RestMethod "$url`ssd/" -Headers $headers
    Write-Host "=== Deployed /reports/ssd/ directory ==="
    $r2 | ForEach-Object { Write-Host "$($_.name)  mtime=$($_.mtime)  size=$($_.size)" }
} catch {
    Write-Host "ssd/ directory: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== routes-manifest.json staticRoutes with 'ssd' ==="
$rm = Invoke-RestMethod "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/routes-manifest.json" -Headers $headers
$rm.staticRoutes | Where-Object { $_.page -like "*ssd*" } | ForEach-Object { Write-Host $_.page }
