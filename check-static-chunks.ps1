$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth" }

# Check what webpack hash is in the deployed static chunks
Write-Host "=== Static chunks - webpack files ==="
$r = Invoke-RestMethod "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/static/chunks/" -Headers $headers
$r | Where-Object { $_.name -like "webpack*" } | ForEach-Object { Write-Host "$($_.name)  mtime=$($_.mtime)" }

Write-Host ""
Write-Host "=== Static app/dashboard/reports chunk files ==="
try {
    $r2 = Invoke-RestMethod "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/static/chunks/app/dashboard/reports/" -Headers $headers
    $r2 | ForEach-Object { Write-Host "$($_.name)  mtime=$($_.mtime)" }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== Check if SSD chunk exists in static/chunks/app/dashboard/reports/ ==="
try {
    $r3 = Invoke-RestMethod "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/static/chunks/app/dashboard/reports/ssd/" -Headers $headers
    $r3 | ForEach-Object { Write-Host "SSD chunk: $($_.name)  mtime=$($_.mtime)" }
} catch {
    Write-Host "SSD static chunk directory NOT FOUND (this is the problem!)"
}

Write-Host ""
Write-Host "=== Deploy timestamp of .next/ files ==="
$r4 = Invoke-RestMethod "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/" -Headers $headers
$r4 | ForEach-Object { Write-Host "$($_.name)  mtime=$($_.mtime)" }
