$base = "https://tca-irr.azurewebsites.net"
$routes = @(
  '/', '/login', '/signup', '/forgot-password',
  '/dashboard', '/dashboard/cost', '/dashboard/settings', '/dashboard/profile',
  '/dashboard/evaluation', '/dashboard/evaluation/modules',
  '/dashboard/analyst', '/dashboard/my-requests', '/dashboard/user-requests',
  '/dashboard/system-health',
  '/dashboard/reports', '/dashboard/reports/triage', '/dashboard/reports/due-diligence',
  '/dashboard/reports/ssd',
  '/analysis/run', '/analysis/result', '/analysis/tca'
)

$pass = 0
$fail = 0

foreach ($r in $routes) {
  try {
    $res = Invoke-WebRequest "$base$r" -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 15
    Write-Host "[HTTP $($res.StatusCode)] $r"
    $pass++
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "[HTTP $code] $r  <-- FAIL"
    $fail++
  }
}

Write-Host ""
Write-Host "RESULT: $pass passed, $fail failed out of $($routes.Count) routes"
