$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{
    Authorization = 'Basic ' + $auth
    'If-Match' = '*'
}

$localBase = 'C:\Users\Allot\Desktop\TCA-IRR-APP-main- simplify\TCA-IRR-simple\.next\server\app\dashboard\reports\ssd'
$remoteBase = 'https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/server/app/dashboard/reports/ssd'

$files = @(
    'page_client-reference-manifest.js',
    'page.js.nft.json'
)

foreach ($f in $files) {
    $local = Join-Path $localBase $f
    $remote = "$remoteBase/$f"
    Write-Host "Uploading $f ..."
    $bytes = [System.IO.File]::ReadAllBytes($local)
    $r = Invoke-WebRequest -Method Put -Uri $remote -Headers $h -Body $bytes -ContentType 'application/octet-stream' -UseBasicParsing
    Write-Host "  -> HTTP $($r.StatusCode)"
}

Write-Host ""
Write-Host "Verifying files on server..."
$kuduHeaders = @{ Authorization = 'Basic ' + $auth }
$cmd = [ordered]@{ command = 'ls -la /home/site/wwwroot/.next/server/app/dashboard/reports/ssd/'; dir = '/home/site/wwwroot' }
$r2 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $kuduHeaders -Body ($cmd|ConvertTo-Json) -ContentType 'application/json' -UseBasicParsing
Write-Host $r2.Output

Write-Host ""
Write-Host "Testing SSD route..."
Start-Sleep -Seconds 3
try {
    $ssd = Invoke-WebRequest -Uri 'https://tca-irr.azurewebsites.net/dashboard/reports/ssd' -TimeoutSec 25 -UseBasicParsing -MaximumRedirection 5
    Write-Host "SSD HTTP: $($ssd.StatusCode)"
    if ($ssd.StatusCode -eq 200) {
        Write-Host "SUCCESS - SSD page is now live!"
    }
} catch {
    Write-Host "SSD HTTP: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Still failing - may need a process restart"
}
