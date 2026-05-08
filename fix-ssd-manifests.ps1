$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth"; "If-Match" = "*" }

$localNextDir = "C:\Users\Allot\Desktop\TCA-IRR-APP-main- simplify\TCA-IRR-simple\.next"
$remoteBase = "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next"

# Upload key manifest files that need SSD entries
$manifestFiles = @(
  "routes-manifest.json",
  "required-server-files.json",
  "server/app-paths-manifest.json",
  "server/pages-manifest.json"
)

foreach ($f in $manifestFiles) {
  $localPath = Join-Path $localNextDir $f.Replace("/", "\")
  if (-not (Test-Path $localPath)) {
    Write-Host "SKIP (not found locally): $f"
    continue
  }

  $localContent = Get-Content $localPath -Raw
  $hasSSd = $localContent -like "*ssd*"
  Write-Host "Uploading $f (has_ssd=$hasSSd) ..."

  $bytes = [System.IO.File]::ReadAllBytes($localPath)
  $remoteUrl = "$remoteBase/$f"
  try {
    $resp = Invoke-WebRequest -Uri $remoteUrl -Method PUT -Headers $headers -Body $bytes -ContentType "application/octet-stream" -UseBasicParsing
    Write-Host "  [OK] HTTP $($resp.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "  [FAIL] HTTP $code - $($_.Exception.Message)"
  }
}

Write-Host "`nWaiting 5 seconds for Azure to apply changes..."
Start-Sleep 5

Write-Host "Testing /dashboard/reports/ssd ..."
try {
  $resp = Invoke-WebRequest "https://tca-irr.azurewebsites.net/dashboard/reports/ssd" -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 15
  Write-Host "Route status: $($resp.StatusCode) [OK]"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Write-Host "Route status: $code [FAIL]"
}
