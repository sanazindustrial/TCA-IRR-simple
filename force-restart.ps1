$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth"; "If-Match" = "*" }
$headersNoEtag = @{ Authorization = "Basic $auth" }

$offlineUrl = "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/app_offline.htm"

Write-Host "Step 1: Uploading app_offline.htm to force restart..."
$offlineContent = [System.Text.Encoding]::UTF8.GetBytes("<html><body>App restarting...</body></html>")
try {
  $resp = Invoke-WebRequest -Uri $offlineUrl -Method PUT -Headers $headers -Body $offlineContent -ContentType "text/html" -UseBasicParsing
  Write-Host "  Uploaded: HTTP $($resp.StatusCode)"
} catch {
  Write-Host "  Upload attempt: $($_.Exception.Response.StatusCode.value__)"
}

Write-Host "Waiting 5 seconds for app to go offline..."
Start-Sleep 5

Write-Host "`nStep 2: Deleting app_offline.htm to restart the app..."
try {
  $resp = Invoke-WebRequest -Uri $offlineUrl -Method DELETE -Headers $headers -UseBasicParsing
  Write-Host "  Deleted: HTTP $($resp.StatusCode)"
} catch {
  Write-Host "  Delete attempt: $($_.Exception.Response.StatusCode.value__)"
}

Write-Host "Waiting 20 seconds for app to start up..."
Start-Sleep 20

Write-Host "`nStep 3: Testing routes..."
$attempts = 0
do {
  Start-Sleep 3
  $attempts++
  try {
    $health = Invoke-WebRequest "https://tca-irr.azurewebsites.net/" -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 10
    Write-Host "Homepage: HTTP $($health.StatusCode) - App is up!"
    break
  } catch {
    Write-Host "  Waiting for app... attempt $attempts"
  }
} while ($attempts -lt 10)

Write-Host "`nTesting SSD route..."
try {
  $ssd = Invoke-WebRequest "https://tca-irr.azurewebsites.net/dashboard/reports/ssd" -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 15
  Write-Host "SSD route: HTTP $($ssd.StatusCode) [SUCCESS]"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Write-Host "SSD route: HTTP $code [FAIL]"
}
