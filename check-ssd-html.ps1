$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth" }

# Download ssd.html
$r = Invoke-WebRequest "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/server/app/dashboard/reports/ssd.html" -Headers $headers
Write-Host "=== ssd.html first 3000 chars ==="
Write-Host $r.Content.Substring(0, [Math]::Min(3000, $r.Content.Length))

Write-Host ""
Write-Host "=== Does ssd.html contain '404' or 'not-found'? ==="
if ($r.Content -like "*404*") { Write-Host "YES - contains '404'" } else { Write-Host "NO - no 404 text" }
if ($r.Content -like "*not-found*") { Write-Host "YES - contains 'not-found'" } else { Write-Host "NO - no not-found text" }
if ($r.Content -like "*Page Not Found*") { Write-Host "YES - contains 'Page Not Found'" } else { Write-Host "NO" }
