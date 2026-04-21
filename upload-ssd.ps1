$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$base = "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot"
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth" }

$localBase = "C:\Users\Allot\Desktop\TCA-IRR-APP-main- simplify\TCA-IRR-simple\.next\server\app\dashboard\reports"

$files = @(
  @{ local = "$localBase\ssd.html"; remote = "$base/.next/server/app/dashboard/reports/ssd.html" }
  @{ local = "$localBase\ssd.meta"; remote = "$base/.next/server/app/dashboard/reports/ssd.meta" }
  @{ local = "$localBase\ssd.rsc";  remote = "$base/.next/server/app/dashboard/reports/ssd.rsc" }
  @{ local = "$localBase\ssd\page.js";                      remote = "$base/.next/server/app/dashboard/reports/ssd/page.js" }
  @{ local = "$localBase\ssd\page.js.nft.json";             remote = "$base/.next/server/app/dashboard/reports/ssd/page.js.nft.json" }
  @{ local = "$localBase\ssd\page_client-reference-manifest.js"; remote = "$base/.next/server/app/dashboard/reports/ssd/page_client-reference-manifest.js" }
)

foreach ($f in $files) {
  Write-Host "Uploading: $($f.local.Split('\')[-1]) ..."
  $bytes = [System.IO.File]::ReadAllBytes($f.local)
  try {
    $resp = Invoke-WebRequest -Uri $f.remote -Method PUT -Headers $headers -Body $bytes -ContentType "application/octet-stream" -UseBasicParsing
    Write-Host "  [OK] HTTP $($resp.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "  [FAIL] HTTP $code - $($_.Exception.Message)"
  }
}

Write-Host "`nDone! Testing route..."
try {
  $test = Invoke-WebRequest "https://tca-irr.azurewebsites.net/dashboard/reports/ssd" -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 15
  Write-Host "Route status: $($test.StatusCode)"
} catch {
  Write-Host "Route error: $($_.Exception.Message)"
}
