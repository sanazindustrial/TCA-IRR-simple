$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth" }

Write-Host "Restarting the Azure App Service via Kudu process kill..."
try {
  $resp = Invoke-WebRequest -Uri "https://tca-irr.scm.azurewebsites.net/api/processes/0" -Method DELETE -Headers $headers -UseBasicParsing
  Write-Host "Process kill status: $($resp.StatusCode)"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Write-Host "Process kill HTTP $code (202 = accepted, expected)"
}

Write-Host "Waiting 15 seconds for app to restart..."
Start-Sleep 15

Write-Host "Testing site health..."
$attempts = 0
do {
  Start-Sleep 3
  $attempts++
  try {
    $health = Invoke-WebRequest "https://tca-irr.azurewebsites.net/" -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 10
    Write-Host "Homepage: HTTP $($health.StatusCode)"
    break
  } catch {
    Write-Host "Waiting... attempt $attempts"
  }
} while ($attempts -lt 10)

Write-Host "`nTesting SSD route..."
try {
  $ssd = Invoke-WebRequest "https://tca-irr.azurewebsites.net/dashboard/reports/ssd" -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 15
  Write-Host "SSD route: HTTP $($ssd.StatusCode) [OK]"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Write-Host "SSD route: HTTP $code [FAIL]"
}
