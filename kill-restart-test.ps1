$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth" }

# Try to stop the main process via Kudu processes endpoint
Write-Host "=== Getting process list ==="
try {
    $procs = Invoke-RestMethod -Uri 'https://tca-irr.scm.azurewebsites.net/api/processes/' -Headers $headers
    $procs | ForEach-Object { Write-Host "PID $($_.id): $($_.name)" }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== Kill main process (PID 1) ==="
try {
    Invoke-RestMethod -Method Delete -Uri 'https://tca-irr.scm.azurewebsites.net/api/processes/1' -Headers $headers
    Write-Host "Killed PID 1"
} catch {
    Write-Host "Kill result: $($_.Exception.Response.StatusCode.value__) - $($_.Exception.Message)"
}

Write-Host "Waiting 20s for restart..."
Start-Sleep -Seconds 20

Write-Host ""
Write-Host "=== Testing SSD route ==="
for ($i = 1; $i -le 3; $i++) {
    try {
        $r = Invoke-WebRequest -Uri 'https://tca-irr.azurewebsites.net/dashboard/reports/ssd' -TimeoutSec 30 -MaximumRedirection 5
        Write-Host ("Attempt {0}: HTTP {1}" -f $i, $r.StatusCode)
        break
    } catch {
        $sc = $_.Exception.Response.StatusCode.value__
        Write-Host ("Attempt {0}: HTTP {1}" -f $i, $sc)
        if ($i -lt 3) { Start-Sleep -Seconds 5 }
    }
}
