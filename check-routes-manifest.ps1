$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth" }

# Get the deployed routes-manifest
$manifest = Invoke-RestMethod "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/routes-manifest.json" -Headers $headers
Write-Host "staticRoutes containing 'reports':"
$manifest.staticRoutes | Where-Object { $_.page -like "*reports*" } | ForEach-Object { Write-Host "  $($_.page)" }
Write-Host ""
Write-Host "SSD in staticRoutes: $(($manifest.staticRoutes | Where-Object { $_.page -like '*ssd*' }).Count -gt 0)"

# Also check local routes-manifest
$localManifest = Get-Content "C:\Users\Allot\Desktop\TCA-IRR-APP-main- simplify\TCA-IRR-simple\.next\routes-manifest.json" | ConvertFrom-Json
Write-Host ""
Write-Host "LOCAL staticRoutes containing 'reports':"
$localManifest.staticRoutes | Where-Object { $_.page -like "*reports*" } | ForEach-Object { Write-Host "  $($_.page)" }
Write-Host ""
Write-Host "LOCAL SSD in staticRoutes: $(($localManifest.staticRoutes | Where-Object { $_.page -like '*ssd*' }).Count -gt 0)"
