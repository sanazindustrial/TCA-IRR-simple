$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth" }

# Use Kudu command API to kill node
Write-Host "=== Killing node process via command API ==="
$body = @{ command = "pkill -f 'node server.js' || pkill node || kill -9 \$(pgrep -o node) 2>/dev/null; echo done"; dir = "/home/site/wwwroot" } | ConvertTo-Json
try {
    $r = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $headers -Body $body -ContentType 'application/json'
    Write-Host "Output: $($r.Output)"
    Write-Host "Error: $($r.Error)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== Checking running processes ==="
$body2 = @{ command = "ps aux | grep node | head -5"; dir = "/" } | ConvertTo-Json
try {
    $r2 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $headers -Body $body2 -ContentType 'application/json'
    Write-Host "Output: $($r2.Output)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
