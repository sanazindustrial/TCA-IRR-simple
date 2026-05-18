# Auto-merge an Azure DevOps PR via REST API
# Usage: $env:AZDO_PAT="<token>"; .\merge_pr.ps1 -SourceBranch "fix/whatif-modules-config-20260513"
param(
    [string]$Organization = "ssddevopsazure",
    [string]$Project      = "TCA",
    [string]$Repo         = "TCA-IRR",
    [string]$SourceBranch = "fix/whatif-modules-config-20260513",
    [string]$TargetBranch = "main",
    [ValidateSet("noFastForward","squash","rebase","rebaseMerge")]
    [string]$MergeStrategy = "noFastForward",
    [switch]$DeleteSourceBranch = $true,
    [switch]$Wait = $true
)

$ErrorActionPreference = "Stop"
if (-not $env:AZDO_PAT) { throw "Set `$env:AZDO_PAT to your Azure DevOps PAT (Code R/W scope)" }

$auth   = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$($env:AZDO_PAT)"))
$head   = @{ Authorization = "Basic $auth"; "Content-Type" = "application/json" }
$apiBase = "https://dev.azure.com/$Organization/$Project/_apis/git/repositories/$Repo"

# 1. Find active PR for this source branch
Write-Host "Looking for active PR: $SourceBranch -> $TargetBranch ..."
$srcRef = "refs/heads/$SourceBranch"
$tgtRef = "refs/heads/$TargetBranch"
$prListUrl = "$apiBase/pullrequests?searchCriteria.sourceRefName=$srcRef&searchCriteria.targetRefName=$tgtRef&searchCriteria.status=active&api-version=7.1"
$prs = Invoke-RestMethod -Uri $prListUrl -Headers $head -Method GET
if (-not $prs.value -or $prs.value.Count -eq 0) { throw "No active PR found for $SourceBranch -> $TargetBranch" }
$pr = $prs.value[0]
$prId = $pr.pullRequestId
Write-Host "Found PR !$prId : $($pr.title)"

# 2. Set auto-complete (merges as soon as policies pass)
$lastMergeSourceCommit = $pr.lastMergeSourceCommit.commitId
$body = @{
    autoCompleteSetBy = @{ id = $pr.createdBy.id }
    completionOptions = @{
        mergeStrategy           = $MergeStrategy
        deleteSourceBranch      = [bool]$DeleteSourceBranch
        bypassPolicy            = $false
        transitionWorkItems     = $true
    }
} | ConvertTo-Json -Depth 6
$patchUrl = "$apiBase/pullrequests/$prId" + "?api-version=7.1"
Write-Host "Arming auto-complete (strategy=$MergeStrategy, deleteSource=$DeleteSourceBranch)..."
$updated = Invoke-RestMethod -Uri $patchUrl -Headers $head -Method PATCH -Body $body
Write-Host "Auto-complete set. Status: $($updated.status)  AutoCompleteBy: $($updated.autoCompleteSetBy.displayName)"

if (-not $Wait) { return }

# 3. Poll until completed/abandoned
Write-Host "`nWaiting for merge to complete..."
while ($true) {
    Start-Sleep -Seconds 15
    $cur = Invoke-RestMethod -Uri "$apiBase/pullrequests/$prId" + "?api-version=7.1" -Headers $head
    Write-Host "  status=$($cur.status) mergeStatus=$($cur.mergeStatus)"
    if ($cur.status -eq "completed")  { Write-Host "PR !$prId MERGED. Merge commit: $($cur.lastMergeCommit.commitId)"; break }
    if ($cur.status -eq "abandoned")  { throw "PR was abandoned." }
    if ($cur.mergeStatus -eq "conflicts") { throw "Merge conflicts. Resolve manually." }
}

# 4. Show new main HEAD
Write-Host "`nFetching latest main..."
git fetch origin --quiet
git log --oneline -1 origin/main
