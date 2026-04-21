$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth }

# Get app log files list
$cmd = @{ command = 'ls /home/LogFiles/Application/ 2>/dev/null; echo "---"; ls /home/site/wwwroot/ 2>/dev/null | head -20'; dir = '/' } | ConvertTo-Json
$r = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body $cmd -ContentType 'application/json' -UseBasicParsing
Write-Host "=== Log files / wwwroot ==="
Write-Host $r.Output

# Check recent diagnostics
$cmd2 = @{ command = 'ls /home/LogFiles/Application/ 2>/dev/null | tail -3'; dir = '/' } | ConvertTo-Json
$r2 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body $cmd2 -ContentType 'application/json' -UseBasicParsing
$logFiles = $r2.Output.Trim() -split "`n" | Where-Object { $_ -match '\.txt' }
foreach ($lf in $logFiles) {
    $lf = $lf.Trim()
    if ($lf) {
        $cmd3 = @{ command = "tail -30 /home/LogFiles/Application/$lf 2>/dev/null"; dir = '/' } | ConvertTo-Json
        $r3 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body $cmd3 -ContentType 'application/json' -UseBasicParsing
        Write-Host "=== Last 30 lines of $lf ==="
        Write-Host $r3.Output
    }
}

# Check server.js file size and if it looks right
$cmd4 = @{ command = 'wc -c /home/site/wwwroot/server.js 2>/dev/null; head -3 /home/site/wwwroot/server.js 2>/dev/null'; dir = '/' } | ConvertTo-Json
$r4 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body $cmd4 -ContentType 'application/json' -UseBasicParsing
Write-Host "=== server.js ==="
Write-Host $r4.Output

# Check SSD server page
$cmd5 = @{ command = 'find /home/site/wwwroot -name "*.js" -path "*/ssd*" 2>/dev/null | head -5'; dir = '/' } | ConvertTo-Json
$r5 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body $cmd5 -ContentType 'application/json' -UseBasicParsing
Write-Host "=== SSD JS files on server ==="
Write-Host $r5.Output

# Check app-build-manifest directly
$cmd6 = @{ command = 'cat /home/site/wwwroot/.next/app-build-manifest.json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); k=[x for x in d[\"pages\"].keys() if \"ssd\" in x.lower()]; print(k if k else \"NO SSD IN MANIFEST\")" 2>/dev/null || grep -i ssd /home/site/wwwroot/.next/app-build-manifest.json 2>/dev/null | head -5 || echo "Could not check manifest"'; dir = '/' } | ConvertTo-Json
$r6 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body $cmd6 -ContentType 'application/json' -UseBasicParsing
Write-Host "=== SSD in manifest ==="
Write-Host $r6.Output
