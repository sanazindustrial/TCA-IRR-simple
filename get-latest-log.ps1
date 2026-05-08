$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth }

# Get latest docker logs
$logs = Invoke-RestMethod -Uri 'https://tca-irr.scm.azurewebsites.net/api/logs/docker' -Headers $h -UseBasicParsing
Write-Host "=== Docker log files ==="
$logs | ForEach-Object { Write-Host $_.href }

# Get the latest docker log
$latestLog = ($logs | Sort-Object { $_.href } -Descending | Select-Object -First 1).href
Write-Host ""
Write-Host "=== Latest log: $latestLog ==="
$content = Invoke-WebRequest -Uri $latestLog -Headers $h -UseBasicParsing
$lines = $content.Content -split "`n"
# Get last 40 lines
$last40 = $lines | Select-Object -Last 40
$last40 | ForEach-Object { Write-Host $_ }
