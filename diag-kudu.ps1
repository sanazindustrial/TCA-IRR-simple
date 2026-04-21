# Get app logs via Kudu log streaming API and diagnose SSD 500
$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth }

Write-Host "=== Testing Kudu auth ==="
try {
    $ping = Invoke-RestMethod -Method Get -Uri 'https://tca-irr.scm.azurewebsites.net/api/deployments' -Headers $h -UseBasicParsing
    Write-Host "Auth OK - deployments count: $($ping.Count)"
} catch {
    Write-Host "Auth FAILED: $_"
    exit 1
}

Write-Host ""
Write-Host "=== Listing wwwroot top-level ==="
$cmd = [ordered]@{ command = 'ls -la /home/site/wwwroot 2>&1'; dir = '/home/site/wwwroot' }
$body = $cmd | ConvertTo-Json
$r = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body $body -ContentType 'application/json' -UseBasicParsing
Write-Host "Exit: $($r.ExitCode)"
Write-Host $r.Output
Write-Host $r.Error

Write-Host ""
Write-Host "=== Check .next directory ==="
$cmd2 = [ordered]@{ command = 'ls -la /home/site/wwwroot/.next 2>&1'; dir = '/home/site/wwwroot' }
$body2 = $cmd2 | ConvertTo-Json
$r2 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body $body2 -ContentType 'application/json' -UseBasicParsing
Write-Host $r2.Output
Write-Host $r2.Error

Write-Host ""
Write-Host "=== Check .next/server/app/dashboard/reports ==="
$cmd3 = [ordered]@{ command = 'ls /home/site/wwwroot/.next/server/app/dashboard/reports 2>&1'; dir = '/home/site/wwwroot' }
$body3 = $cmd3 | ConvertTo-Json
$r3 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body $body3 -ContentType 'application/json' -UseBasicParsing
Write-Host $r3.Output
Write-Host $r3.Error

Write-Host ""
Write-Host "=== Latest app log (diagnostics) ==="
$cmd4 = [ordered]@{ command = 'ls /home/LogFiles/Application/ 2>&1 | tail -5'; dir = '/' }
$body4 = $cmd4 | ConvertTo-Json
$r4 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body $body4 -ContentType 'application/json' -UseBasicParsing
Write-Host $r4.Output
Write-Host $r4.Error

Write-Host ""
Write-Host "=== Try reading recent log ==="
$cmd5 = [ordered]@{ command = 'cat /home/LogFiles/Application/diagnostics-20260421.txt 2>/dev/null | tail -40 || echo NO_LOG_FILE'; dir = '/' }
$body5 = $cmd5 | ConvertTo-Json
$r5 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body $body5 -ContentType 'application/json' -UseBasicParsing
Write-Host $r5.Output
Write-Host $r5.Error

Write-Host ""
Write-Host "=== grep SSD from app-build-manifest ==="
$cmd6 = [ordered]@{ command = 'grep ssd /home/site/wwwroot/.next/app-build-manifest.json 2>&1 | head -5 || echo NOT_FOUND'; dir = '/' }
$body6 = $cmd6 | ConvertTo-Json
$r6 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body $body6 -ContentType 'application/json' -UseBasicParsing
Write-Host $r6.Output
Write-Host $r6.Error

Write-Host ""
Write-Host "=== routes-manifest for SSD ==="
$cmd7 = [ordered]@{ command = 'grep -i ssd /home/site/wwwroot/.next/routes-manifest.json 2>&1 | head -5 || echo NOT_FOUND'; dir = '/' }
$body7 = $cmd7 | ConvertTo-Json
$r7 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body $body7 -ContentType 'application/json' -UseBasicParsing
Write-Host $r7.Output
Write-Host $r7.Error
