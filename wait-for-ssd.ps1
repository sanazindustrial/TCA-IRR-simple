$url = "https://tca-irr.azurewebsites.net/dashboard/reports/ssd"
$maxWait = 600  # 10 minutes
$elapsed = 0
$interval = 20

Write-Host "Waiting for SSD route to come online..."
Write-Host "(Polling every ${interval}s, max ${maxWait}s)"

while ($elapsed -lt $maxWait) {
    Start-Sleep -Seconds $interval
    $elapsed += $interval
    try {
        $r = Invoke-WebRequest $url -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 10
        if ($r.StatusCode -eq 200) {
            Write-Host "`n[SUCCESS] /dashboard/reports/ssd is HTTP 200 after ${elapsed}s!"
            exit 0
        } else {
            Write-Host "[${elapsed}s] HTTP $($r.StatusCode)"
        }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "[${elapsed}s] HTTP $code (still waiting...)"
    }
}
Write-Host "`n[TIMEOUT] SSD route still not up after ${maxWait}s"
