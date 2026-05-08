$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth }

Write-Host "=== Check if 9989, 4317, 4773 chunks exist on server ==="
foreach ($chunk in @('9989', '4317', '4773', '4368', '4049', '6577')) {
    $url = "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/server/chunks/$chunk.js"
    try {
        $r = Invoke-WebRequest -Uri $url -Headers $h -UseBasicParsing -Method Head
        Write-Host "  $chunk.js EXISTS (status $($r.StatusCode))"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "  $chunk.js MISSING (status $code)"
    }
}

Write-Host ""
Write-Host "=== Download app layout.js from server - check for .actual-ui ==="
$layoutUrl = 'https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/server/app/layout.js'
try {
    $r2 = Invoke-WebRequest -Uri $layoutUrl -Headers $h -UseBasicParsing
    $c = $r2.Content
    Write-Host "layout.js size: $($c.Length)"
    if ($c -match '\.actual-ui') { Write-Host "  YES - references .actual-ui" } else { Write-Host "  NO .actual-ui in layout.js" }
    if ($c -match 'TCA-IRR-simple') { Write-Host "  YES - references TCA-IRR-simple" } else { Write-Host "  NO" }
    $m = [regex]::Match($c, 'C:[/\\][^"]+actual-ui[^"]+')
    if ($m.Success) { Write-Host "  Path: $($m.Value.Substring(0, [Math]::Min(100, $m.Value.Length)))" }
} catch {
    Write-Host "  Error: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== Download dashboard layout.js from server - check for .actual-ui ==="
$dashLayoutUrl = 'https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/server/app/dashboard/layout.js'
try {
    $r3 = Invoke-WebRequest -Uri $dashLayoutUrl -Headers $h -UseBasicParsing
    $c3 = $r3.Content
    Write-Host "dashboard/layout.js size: $($c3.Length)"
    if ($c3 -match '\.actual-ui') { Write-Host "  YES - references .actual-ui" } else { Write-Host "  NO .actual-ui in dashboard/layout.js" }
    if ($c3 -match 'TCA-IRR-simple') { Write-Host "  YES - references TCA-IRR-simple" } else { Write-Host "  NO" }
} catch {
    Write-Host "  Error: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== Download page_client-reference-manifest.js from server - check paths ==="
$manifestUrl = 'https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/server/app/dashboard/reports/ssd/page_client-reference-manifest.js'
try {
    $r4 = Invoke-WebRequest -Uri $manifestUrl -Headers $h -UseBasicParsing
    $c4 = $r4.Content
    Write-Host "manifest size: $($c4.Length)"
    if ($c4 -match '\.actual-ui') { Write-Host "  YES - manifest still has .actual-ui" } else { Write-Host "  NO .actual-ui in manifest" }
    if ($c4 -match 'TCA-IRR-simple') { Write-Host "  YES - manifest has TCA-IRR-simple" } else { Write-Host "  NO TCA-IRR-simple" }
    if ($c4 -match '/home/site/wwwroot') { Write-Host "  YES - manifest has Linux paths" } else { Write-Host "  NO Linux paths" }
    # Show first path key
    $m4 = [regex]::Match($c4, '"([^"]{10,}async-metadata[^"]+)"')
    if ($m4.Success) { Write-Host "  async-metadata key: $($m4.Groups[1].Value)" }
} catch {
    Write-Host "  Error: $($_.Exception.Message)"
}
