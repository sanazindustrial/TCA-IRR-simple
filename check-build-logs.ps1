$token = (cmdkey /list 2>&1 | Out-String)
# Get token from credential store
Add-Type -AssemblyName System.Security
try {
  $creds = [System.Net.CredentialCache]::DefaultNetworkCredentials
} catch {}

# Try Windows credential manager
$wc = cmdkey /list:git:https://github.com 2>&1
Write-Host "Credential check: $wc"

# Read from previously saved file if it exists
$tokenFile = Join-Path $PSScriptRoot "gh_token.txt"
if (Test-Path $tokenFile) {
  $token = (Get-Content $tokenFile).Trim()
  Write-Host "Token from file, length: $($token.Length)"
} else {
  Write-Host "No token file found at $tokenFile"
  exit 1
}

$headers = @{
  Authorization = "Bearer $token"
  Accept = "application/vnd.github.v3+json"
}

$runs = Invoke-RestMethod "https://api.github.com/repos/sanazindustrial/TCA-IRR-simple/actions/runs?per_page=5" -Headers $headers
$run = $runs.workflow_runs[0]
Write-Host "Latest run: ID=$($run.id), status=$($run.status), conclusion=$($run.conclusion), created=$($run.created_at)"

# Get jobs for the latest run
$jobs = Invoke-RestMethod "https://api.github.com/repos/sanazindustrial/TCA-IRR-simple/actions/runs/$($run.id)/jobs" -Headers $headers
foreach ($job in $jobs.jobs) {
  Write-Host "`nJob: $($job.name) - $($job.conclusion)"
  foreach ($step in $job.steps) {
    $icon = if ($step.conclusion -eq "success") { "[OK]" } elseif ($step.conclusion -eq "failure") { "[FAIL]" } else { "[--]" }
    Write-Host "  $icon $($step.name): $($step.conclusion)"
  }
}
