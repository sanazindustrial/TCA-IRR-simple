$local = 'C:\Users\Allot\Desktop\TCA-IRR-APP-main- simplify\TCA-IRR-simple\.next\server'
$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth }

# Get server _document.js content
Write-Host "=== SERVER _document.js content ==="
$r = Invoke-WebRequest -Method Get -Uri 'https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/server/pages/_document.js' -Headers $h -UseBasicParsing
Write-Host $r.Content

Write-Host ""
Write-Host "=== Find 1798 in SSD page.js (context) ==="
$ssd = Get-Content "$local\app\dashboard\reports\ssd\page.js" -Raw
# Find position of 1798
$pos = $ssd.IndexOf('1798')
if ($pos -ge 0) {
    $start = [Math]::Max(0, $pos - 100)
    $end = [Math]::Min($ssd.Length, $pos + 200)
    Write-Host "Found at position $pos"
    Write-Host $ssd.Substring($start, $end - $start)
} else {
    Write-Host "1798 NOT found in page.js"
}

# Check if chunks/8548.js has 1798
Write-Host ""
Write-Host "=== Does local chunks/8548.js reference 1798? ==="
$c8548 = Get-Content "$local\chunks\8548.js" -Raw
if ($c8548 -match '1798') { Write-Host "YES - found 1798 in chunks/8548.js" } else { Write-Host "NO" }
