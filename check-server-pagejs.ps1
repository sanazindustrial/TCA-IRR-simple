$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth }

# Download server page.js
$url = 'https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/server/app/dashboard/reports/ssd/page.js'
$resp = Invoke-WebRequest -Uri $url -Headers $h -UseBasicParsing
$content = $resp.Content

Write-Host "Server page.js size: $($content.Length) bytes"

Write-Host "=== Does server page.js reference .actual-ui? ==="
if ($content -match '\.actual-ui') { Write-Host "YES - references .actual-ui" } else { Write-Host "NO" }

Write-Host "=== Does server page.js reference TCA-IRR-simple? ==="
if ($content -match 'TCA-IRR-simple') { Write-Host "YES" } else { Write-Host "NO" }

Write-Host "=== First path reference in server page.js ==="
$m = [regex]::Match($content, 'C:\\\\Users\\\\[^"]+')
if ($m.Success) { Write-Host $m.Value } else { Write-Host "No Windows path found" }

Write-Host ""
Write-Host "=== Last 200 chars (chunk loading) ==="
$tail = $content.Substring([Math]::Max(0, $content.Length - 200))
Write-Host $tail
