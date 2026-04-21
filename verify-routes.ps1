$routes = @(
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/dashboard",
  "/dashboard/cost",
  "/dashboard/settings",
  "/dashboard/profile",
  "/dashboard/evaluation",
  "/dashboard/evaluation/modules",
  "/dashboard/analyst",
  "/dashboard/my-requests",
  "/dashboard/user-requests",
  "/dashboard/system-health",
  "/dashboard/reports",
  "/dashboard/reports/triage",
  "/dashboard/reports/due-diligence",
  "/dashboard/reports/ssd",
  "/analysis/run",
  "/analysis/result",
  "/analysis/tca"
)

$base = "https://tca-irr.azurewebsites.net"
$results = @()

foreach ($r in $routes) {
  $url = "$base$r"
  try {
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 15 -ErrorAction Stop
    $status = $resp.StatusCode
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    if (-not $status) { $status = "ERR" }
  }
  $icon = if ($status -eq 200) { "[OK ]" } elseif ($status -eq 307 -or $status -eq 302 -or $status -eq 301) { "[RDR]" } else { "[!!!]" }
  $results += "$icon $status  $r"
  Write-Host "$icon $status  $r"
}

Write-Host "`n=== SUMMARY ==="
$ok = ($results | Where-Object { $_ -like "*[OK ]*" }).Count
$fail = ($results | Where-Object { $_ -like "*[!!!]*" }).Count
Write-Host "OK: $ok / $($results.Count)   Failures: $fail"
