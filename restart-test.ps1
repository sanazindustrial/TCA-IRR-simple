$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth }

# Try to restart by killing the Node.js process
Write-Host 'Attempting process restart via Kudu...'
try {
    $r = Invoke-WebRequest -Method Delete -Uri 'https://tca-irr.scm.azurewebsites.net/api/processes/1' -Headers $h -UseBasicParsing
    Write-Host ('Process kill HTTP: ' + $r.StatusCode)
} catch {
    Write-Host ('Process kill response: ' + $_.Exception.Response.StatusCode.value__)
}

Write-Host 'Waiting 10 seconds for restart...'
Start-Sleep -Seconds 10

Write-Host 'Testing SSD...'
try {
    $ssd = Invoke-WebRequest -Uri 'https://tca-irr.azurewebsites.net/dashboard/reports/ssd' -TimeoutSec 30 -UseBasicParsing -MaximumRedirection 5
    Write-Host ('SSD HTTP: ' + $ssd.StatusCode)
    if ($ssd.StatusCode -eq 200) { Write-Host 'SUCCESS!' }
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host ('SSD HTTP: ' + $code)
}
