$local = 'C:\Users\Allot\Desktop\TCA-IRR-APP-main- simplify\TCA-IRR-simple\.next\server'

Write-Host "=== Local _document.js size ==="
(Get-Item "$local\pages\_document.js").Length

Write-Host "=== Local _document.js content ==="
Get-Content "$local\pages\_document.js"

Write-Host ""
Write-Host "=== Local webpack-runtime.js size ==="
(Get-Item "$local\webpack-runtime.js").Length

Write-Host "=== Local webpack-runtime.js first 300 chars ==="
$wpr = Get-Content "$local\webpack-runtime.js" -Raw
$wpr.Substring(0, [Math]::Min(300, $wpr.Length))

Write-Host ""
Write-Host "=== SSD page.js - first 500 chars ==="
$ssd = Get-Content "$local\app\dashboard\reports\ssd\page.js" -Raw
$ssd.Substring(0, [Math]::Min(500, $ssd.Length))

Write-Host ""
Write-Host "=== Does SSD page.js reference chunk 1798? ==="
if ($ssd -match '1798') { Write-Host "YES - found 1798 in page.js" } else { Write-Host "NO - 1798 not in page.js" }

# Search for all chunk references in SSD page.js
Write-Host ""
Write-Host "=== Chunk references in SSD page.js ==="
$matches2 = [regex]::Matches($ssd, '"(\d+)":"\d+\.js"')
foreach ($m in $matches2) { Write-Host $m.Value }
