$ssd = Get-Content 'C:\Users\Allot\Desktop\TCA-IRR-APP-main- simplify\TCA-IRR-simple\.next\server\app\dashboard\reports\ssd\page.js' -Raw

Write-Host "=== Does page.js reference .actual-ui? ==="
if ($ssd -match '\.actual-ui') { Write-Host "YES - references .actual-ui" } else { Write-Host "NO - does NOT reference .actual-ui" }

Write-Host "=== Does page.js reference TCA-IRR-simple? ==="
if ($ssd -match 'TCA-IRR-simple') { Write-Host "YES - references TCA-IRR-simple" } else { Write-Host "NO" }

Write-Host "=== Any path references in page.js (first 5) ==="
$matches2 = [regex]::Matches($ssd, 'C:\\\\Users\\\\[^"]+')
$i = 0
foreach ($m in $matches2) {
    if ($i -ge 5) { break }
    Write-Host $m.Value
    $i++
}

Write-Host ""
Write-Host "=== page_client-reference-manifest.js from local build (TCA-IRR-simple) - any .actual-ui? ==="
$manifest = Get-Content 'C:\Users\Allot\Desktop\TCA-IRR-APP-main- simplify\TCA-IRR-simple\.next\server\app\dashboard\reports\ssd\page_client-reference-manifest.js' -Raw
if ($manifest -match '\.actual-ui') { Write-Host "YES - manifest references .actual-ui" } else { Write-Host "NO - manifest does NOT reference .actual-ui" }
if ($manifest -match 'TCA-IRR-simple') { Write-Host "YES - manifest references TCA-IRR-simple" } else { Write-Host "NO" }

# Check what directory is in the manifest paths
$pathMatches = [regex]::Matches($manifest, 'C:\\\\Users\\\\[^"#]+')
if ($pathMatches.Count -gt 0) {
    Write-Host ""
    Write-Host "=== First path in manifest ==="
    Write-Host $pathMatches[0].Value
}
