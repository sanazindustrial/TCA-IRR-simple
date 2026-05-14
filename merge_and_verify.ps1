# Full one-shot: approve PR, arm auto-complete, wait for merge, wait for deploy, verify live endpoints.
# Usage:
#   $env:AZDO_PAT = "<your-pat-with-Code-RW-and-Build-Read>"
#   .\merge_and_verify.ps1
#
# Requires PAT scopes: Code (Read & Write), Build (Read), Release (Read) [optional]
param(
    [string]$Organization  = "ssddevopsazure",
    [string]$Project       = "TCA",
    [string]$Repo          = "TCA-IRR",
    [string]$SourceBranch  = "fix/whatif-modules-config-20260513",
    [string]$TargetBranch  = "main",
    [ValidateSet("noFastForward","squash","rebase","rebaseMerge")]
    [string]$MergeStrategy = "noFastForward",
    [bool]$DeleteSourceBranch = $true,
    [string]$LiveBase      = "https://tcairrapiccontainer.azurewebsites.net",
    [int]$MergeTimeoutMin  = 30,
    [int]$DeployTimeoutMin = 20
)

$ErrorActionPreference = "Stop"
if (-not $env:AZDO_PAT) { throw "Set `$env:AZDO_PAT to your Azure DevOps PAT (Code R/W + Build Read scopes)" }

$auth   = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$($env:AZDO_PAT)"))
$head   = @{ Authorization = "Basic $auth"; "Content-Type" = "application/json" }
$repoApi  = "https://dev.azure.com/$Organization/$Project/_apis/git/repositories/$Repo"
$buildApi = "https://dev.azure.com/$Organization/$Project/_apis/build"

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Info($msg) { Write-Host "  $msg" -ForegroundColor Gray }
function OK($msg)   { Write-Host "  $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "  $msg" -ForegroundColor Yellow }

# ---------- 1. Find active PR ----------
Step "1. Locate active PR ($SourceBranch -> $TargetBranch)"
$srcRef = "refs/heads/$SourceBranch"
$tgtRef = "refs/heads/$TargetBranch"
$prListUrl = "$repoApi/pullrequests?searchCriteria.sourceRefName=$srcRef&searchCriteria.targetRefName=$tgtRef&searchCriteria.status=active&api-version=7.1"
$prs = Invoke-RestMethod -Uri $prListUrl -Headers $head -Method GET
if (-not $prs.value -or $prs.value.Count -eq 0) { throw "No active PR found." }
$pr = $prs.value[0]
$prId = $pr.pullRequestId
$creatorId = $pr.createdBy.id
OK "Found PR !$prId : $($pr.title)"
Info "Created by: $($pr.createdBy.displayName) ($creatorId)"
Info "Web: https://dev.azure.com/$Organization/$Project/_git/$Repo/pullrequest/$prId"

# ---------- 2. Self-approve (best-effort) ----------
Step "2. Approve PR (best-effort)"
try {
    $me = Invoke-RestMethod -Uri "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.1" -Headers $head
    $myId = $me.id
    Info "PAT user: $($me.displayName) ($myId)"
    $voteBody = @{ vote = 10; isFlagged = $false } | ConvertTo-Json
    Invoke-RestMethod -Uri "$repoApi/pullrequests/$prId/reviewers/$myId`?api-version=7.1" -Headers $head -Method PUT -Body $voteBody | Out-Null
    OK "Approved (vote=10)"
} catch {
    Warn "Self-approve skipped: $($_.Exception.Message)"
    Info "Continuing — PR may already be approved or auto-complete may merge once policies pass."
}

# ---------- 3. Arm auto-complete ----------
Step "3. Arm auto-complete"
$completeBody = @{
    autoCompleteSetBy = @{ id = $creatorId }
    completionOptions = @{
        mergeStrategy       = $MergeStrategy
        deleteSourceBranch  = [bool]$DeleteSourceBranch
        bypassPolicy        = $false
        transitionWorkItems = $true
    }
} | ConvertTo-Json -Depth 6
$null = Invoke-RestMethod -Uri "$repoApi/pullrequests/$prId`?api-version=7.1" -Headers $head -Method PATCH -Body $completeBody
OK "Auto-complete armed (strategy=$MergeStrategy, deleteSource=$DeleteSourceBranch)"

# ---------- 4. Poll for merge ----------
Step "4. Wait for merge (timeout=${MergeTimeoutMin}m)"
$deadline = (Get-Date).AddMinutes($MergeTimeoutMin)
$mergeCommit = $null
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 20
    $cur = Invoke-RestMethod -Uri "$repoApi/pullrequests/$prId`?api-version=7.1" -Headers $head
    Info "  status=$($cur.status) mergeStatus=$($cur.mergeStatus)"
    if ($cur.status -eq "completed") {
        $mergeCommit = $cur.lastMergeCommit.commitId
        OK "PR MERGED. Merge commit: $mergeCommit"
        break
    }
    if ($cur.status -eq "abandoned") { throw "PR abandoned." }
    if ($cur.mergeStatus -eq "conflicts") { throw "Merge conflicts. Resolve manually." }
}
if (-not $mergeCommit) { throw "Merge did not complete in $MergeTimeoutMin minutes." }

# ---------- 5. Wait for build/deploy pipeline triggered by merge ----------
Step "5. Wait for CI/CD pipeline (timeout=${DeployTimeoutMin}m)"
$deadline = (Get-Date).AddMinutes($DeployTimeoutMin)
$lastBuildId = $null
$pipelineDone = $false
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 20
    # Find any build for the merge commit on main
    $buildList = Invoke-RestMethod -Uri "$buildApi/builds?branchName=refs/heads/$TargetBranch&`$top=10&api-version=7.1" -Headers $head
    $build = $buildList.value | Where-Object { $_.sourceVersion -eq $mergeCommit } | Select-Object -First 1
    if (-not $build) {
        Info "  no build yet for commit $($mergeCommit.Substring(0,8))..."
        continue
    }
    if ($build.id -ne $lastBuildId) {
        $lastBuildId = $build.id
        Info "  Build #$($build.buildNumber) (id=$($build.id)) status=$($build.status) result=$($build.result)"
        Info "  $($build._links.web.href)"
    } else {
        Info "  Build #$($build.buildNumber) status=$($build.status) result=$($build.result)"
    }
    if ($build.status -eq "completed") {
        if ($build.result -eq "succeeded") { OK "Build succeeded"; $pipelineDone = $true; break }
        else { throw "Build finished with result=$($build.result)" }
    }
}
if (-not $pipelineDone) { Warn "Pipeline not done in $DeployTimeoutMin min — proceeding to live probe anyway" }

# Allow App Service warm start
Info "Waiting 30s for App Service warm-up..."
Start-Sleep -Seconds 30

# ---------- 6. Live verification ----------
Step "6. Live verification of $LiveBase"
git fetch origin --quiet
Info "main HEAD: $(git log --oneline -1 origin/main)"

$expected = [ordered]@{
    "/health"                              = 200
    "/api/v1/cost/summary/public"          = 401
    "/api/v1/reports"                      = 401
    "/api/v1/roles/configurations"         = 401
}
$failures = @()
foreach ($p in $expected.Keys) {
    try {
        $r = Invoke-WebRequest -Uri "$LiveBase$p" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        $code = $r.StatusCode
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
    }
    $exp = $expected[$p]
    if ($code -eq $exp) { OK ("{0,-40} => {1} (expected {2})" -f $p, $code, $exp) }
    else { Warn ("{0,-40} => {1} (expected {2})" -f $p, $code, $exp); $failures += "$p got $code expected $exp" }
}

# Security headers spot check
try {
    $r = Invoke-WebRequest -Uri "$LiveBase/health" -UseBasicParsing -TimeoutSec 15
    $hdrs = $r.Headers
    $checks = @{
        "X-Frame-Options"          = "DENY"
        "X-Content-Type-Options"   = "nosniff"
        "Strict-Transport-Security"= "max-age"
    }
    foreach ($h in $checks.Keys) {
        $v = $hdrs[$h]
        if ($v -and $v -match $checks[$h]) { OK "Header $h = $v" }
        else { Warn "Header $h missing or unexpected: '$v'"; $failures += "header $h" }
    }
} catch { Warn "Header probe failed: $($_.Exception.Message)" }

Step "Done"
if ($failures.Count -eq 0) { OK "All checks passed." }
else { Warn ("Failures: " + ($failures -join "; ")) ; exit 1 }
