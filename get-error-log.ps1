$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth }

Write-Host "=== Listing Application LogFiles ==="
$logList = Invoke-RestMethod -Uri 'https://tca-irr.scm.azurewebsites.net/api/vfs/LogFiles/Application/' -Headers $h -UseBasicParsing
$logList | ForEach-Object { Write-Host $_.name, $_.mtime, $_.size }

Write-Host ""
Write-Host "=== Downloading latest log ==="
# Try today's log (Apr 21 2026)
$logDates = @('diagnostics-20260421.txt', 'diagnostics-20260420.txt', 'diagnostics-20260419.txt')
foreach ($logFile in $logDates) {
    try {
        $bytes = Invoke-WebRequest -Uri "https://tca-irr.scm.azurewebsites.net/api/vfs/LogFiles/Application/$logFile" -Headers $h -UseBasicParsing
        if ($bytes.Content.Length -gt 100) {
            Write-Host "Found: $logFile ($($bytes.Content.Length) bytes)"
            $content = [System.Text.Encoding]::UTF8.GetString($bytes.Content)
            # Show last 100 lines
            $lines = $content -split "`n"
            Write-Host "Total lines: $($lines.Count)"
            Write-Host "--- Last 40 lines (or lines with 'ssd','error','Error','500') ---"
            $lines | Select-String -Pattern 'ssd|error|Error|500|exception|Exception|Cannot find|MODULE' | Select-Object -Last 30 | ForEach-Object { Write-Host $_ }
            Write-Host "--- Last 20 lines ---"
            $lines | Select-Object -Last 20 | ForEach-Object { Write-Host $_ }
            break
        }
    } catch {
        Write-Host "Not found: $logFile"
    }
}

Write-Host ""
Write-Host "=== Checking Docker container logs ==="
try {
    $dockerLogs = Invoke-WebRequest -Uri 'https://tca-irr.scm.azurewebsites.net/api/logs/docker' -Headers $h -UseBasicParsing
    $dockerContent = [System.Text.Encoding]::UTF8.GetString($dockerLogs.Content)
    Write-Host $dockerContent | Select-Object -First 50
} catch {
    Write-Host "Docker logs error: $_"
}
