$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$ROOT = Join-Path $PSScriptRoot '.next\standalone'
$ZIP  = Join-Path $PSScriptRoot 'deploy-now.zip'

# Ensure .next/static and public are inside standalone (server.js needs them)
$staticSrc = Join-Path $PSScriptRoot '.next\static'
$staticDst = Join-Path $ROOT '.next\static'
if (Test-Path $staticSrc) {
    if (-not (Test-Path $staticDst)) { New-Item -ItemType Directory -Path $staticDst -Force | Out-Null }
    Copy-Item -Path (Join-Path $staticSrc '*') -Destination $staticDst -Recurse -Force
    Write-Host "[OK] Copied .next/static"
}
$publicSrc = Join-Path $PSScriptRoot 'public'
$publicDst = Join-Path $ROOT 'public'
if (Test-Path $publicSrc) {
    if (-not (Test-Path $publicDst)) { New-Item -ItemType Directory -Path $publicDst -Force | Out-Null }
    Copy-Item -Path (Join-Path $publicSrc '*') -Destination $publicDst -Recurse -Force
    Write-Host "[OK] Copied public/"
}

# Patch package.json
$pkgPath = Join-Path $ROOT 'package.json'
if (Test-Path $pkgPath) {
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    if (-not $pkg.scripts) { $pkg | Add-Member -MemberType NoteProperty -Name scripts -Value @{} }
    $pkg.scripts.start = 'node server.js'
    $pkg | ConvertTo-Json -Depth 20 | Set-Content -Path $pkgPath -Encoding UTF8
    Write-Host "[OK] Patched package.json"
}

if (Test-Path $ZIP) { Remove-Item $ZIP -Force }
Write-Host "[..] Creating zip via .NET ZipFile from $ROOT"
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($ROOT, $ZIP, [System.IO.Compression.CompressionLevel]::Optimal, $false)
$zipMB = [math]::Round((Get-Item $ZIP).Length / 1MB, 2)
Write-Host "[OK] Created deploy-now.zip ($zipMB MB)"

# Upload to Kudu
$KUDU_USER  = '$TCA-IRR'
$KUDU_PASS  = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$DEPLOY_URL = 'https://tca-irr.scm.azurewebsites.net/api/publish?type=zip'
$b64 = [Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("${KUDU_USER}:${KUDU_PASS}"))

Write-Host "[..] Uploading $zipMB MB to $DEPLOY_URL"
try {
    $resp = Invoke-WebRequest -Uri $DEPLOY_URL -Method POST -InFile $ZIP -Headers @{ Authorization = "Basic $b64"; 'Content-Type' = 'application/zip' } -TimeoutSec 600 -UseBasicParsing
    Write-Host "[OK] Deployment HTTP $($resp.StatusCode)"
    if ($resp.Content) { Write-Host ("Body: " + $resp.Content.Substring(0, [Math]::Min(500, $resp.Content.Length))) }
} catch {
    $code = $null
    try { $code = $_.Exception.Response.StatusCode.value__ } catch {}
    Write-Host "[FAIL] $($_.Exception.Message) HTTP=$code"
    if ($_.Exception.Response) {
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
            Write-Host ("ErrorBody: " + $body.Substring(0, [Math]::Min(800, $body.Length)))
        } catch {}
    }
    exit 1
}
Write-Host "[DONE]"
