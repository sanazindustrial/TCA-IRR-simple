$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth; 'If-Match' = '*' }

$localChunks = 'C:\Users\Allot\Desktop\TCA-IRR-APP-main- simplify\TCA-IRR-simple\.next\server\chunks'
$baseUrl = 'https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/server/chunks'

# The 4 chunks needed by SSD page.js that are MISSING from the server
$missingChunks = @('1798', '4368', '4049', '6577')

foreach ($chunk in $missingChunks) {
    $file = "$localChunks\$chunk.js"
    $url  = "$baseUrl/$chunk.js"
    Write-Host "Uploading $chunk.js ($((Get-Item $file).Length) bytes)..."
    $bytes = [System.IO.File]::ReadAllBytes($file)
    try {
        $r = Invoke-WebRequest -Method Put -Uri $url -Headers $h -Body $bytes -ContentType 'application/octet-stream' -UseBasicParsing
        Write-Host "  -> HTTP $($r.StatusCode) OK"
    } catch {
        Write-Host "  -> ERROR: $_"
    }
}

Write-Host ""
Write-Host "=== Verifying chunks on server ==="
$kuduUser2 = '$TCA-IRR'
$authBytes2 = [Text.Encoding]::ASCII.GetBytes($kuduUser2 + ':' + $kuduPass)
$auth2 = [Convert]::ToBase64String($authBytes2)
$h2 = @{ Authorization = 'Basic ' + $auth2 }
$cmd = [ordered]@{ command = 'ls /home/site/wwwroot/.next/server/chunks/ | grep -E "^(1798|4368|4049|6577)"'; dir = '/home/site/wwwroot' }
$rv = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h2 -Body ($cmd|ConvertTo-Json) -ContentType 'application/json' -UseBasicParsing
Write-Host $rv.Output

Write-Host ""
Write-Host "=== Testing SSD page ==="
try {
    $ssd = Invoke-WebRequest -Uri 'https://tca-irr.azurewebsites.net/dashboard/reports/ssd' -UseBasicParsing -TimeoutSec 30
    Write-Host "SSD HTTP: $($ssd.StatusCode)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "SSD HTTP: $code (FAILED)"
}
