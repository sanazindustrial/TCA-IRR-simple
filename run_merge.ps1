# Loads PAT from .secrets.local.ps1 then runs the merge+verify script.
# Usage: .\run_merge.ps1
$ErrorActionPreference = "Stop"

$secrets = Join-Path $PSScriptRoot ".secrets.local.ps1"
if (-not (Test-Path $secrets)) {
    Write-Host "Missing .secrets.local.ps1 — create it from the template." -ForegroundColor Red
    exit 1
}
. $secrets

if (-not $env:AZDO_PAT -or $env:AZDO_PAT -eq "PASTE_YOUR_NEW_PAT_HERE") {
    Write-Host "Edit .secrets.local.ps1 and paste your real PAT." -ForegroundColor Red
    exit 1
}

& (Join-Path $PSScriptRoot "merge_and_verify.ps1")
