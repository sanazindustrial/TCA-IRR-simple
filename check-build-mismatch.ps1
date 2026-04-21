$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth" }

# Check server.js mtime
Write-Host "=== server.js timestamp ==="
$r = Invoke-RestMethod "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/" -Headers $headers
$r | Where-Object { $_.name -like "server*" } | ForEach-Object { Write-Host "$($_.name)  mtime=$($_.mtime)  size=$($_.size)" }

# Check .next/BUILD_ID
Write-Host "`n=== BUILD_ID ==="
$bid = Invoke-RestMethod "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/BUILD_ID" -Headers $headers
Write-Host "Deployed BUILD_ID: $bid"

# Check .next/routes-manifest mtime
Write-Host "`n=== routes-manifest.json timestamp ==="
$r2 = Invoke-RestMethod "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/" -Headers $headers
$r2 | Where-Object { $_.name -like "routes*" } | ForEach-Object { Write-Host "$($_.name)  mtime=$($_.mtime)" }

# Check server.js first line (should show chunk references)
Write-Host "`n=== server.js webpack build hash (first 200 chars) ==="
$sjs = Invoke-WebRequest "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/server.js" -Headers $headers -UseBasicParsing
Write-Host $sjs.Content.Substring(0, 200)
