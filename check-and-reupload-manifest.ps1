$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth" }

# Download the server app-build-manifest.json
Write-Host "=== Downloading app-build-manifest.json from server ==="
$content = Invoke-RestMethod -Uri 'https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/app-build-manifest.json' -Headers $headers
$json = $content | ConvertTo-Json -Depth 5
# Check for SSD
if ($json -match 'reports/ssd') {
    Write-Host "FOUND 'reports/ssd' in server manifest"
} else {
    Write-Host "NOT FOUND 'reports/ssd' in server manifest"
    # Show pages list
    Write-Host ""
    Write-Host "Pages in server manifest (first 20 dashboard routes):"
    $content.pages.PSObject.Properties | Where-Object { $_.Name -match 'dashboard' } | ForEach-Object { Write-Host "  $($_.Name)" }
}

Write-Host ""
Write-Host "=== Comparing sizes ==="
$localFile = 'C:\Users\Allot\Desktop\TCA-IRR-APP-main- simplify\TCA-IRR-simple\.next\standalone\.next\app-build-manifest.json'
$localContent = Get-Content $localFile -Raw
Write-Host "Local size: $($localContent.Length) bytes"
Write-Host "Local has SSD: $(if ($localContent -match 'reports/ssd') { 'YES' } else { 'NO' })"

# Upload with explicit content
Write-Host ""
Write-Host "=== Re-uploading app-build-manifest.json with explicit binary content ==="
$bytes = [System.IO.File]::ReadAllBytes($localFile)
Write-Host "Uploading $($bytes.Length) bytes..."
$uploadHeaders = @{ 
    Authorization = "Basic $auth"
    "If-Match" = "*"
    "Content-Type" = "application/json"
}
try {
    $ir = Invoke-WebRequest -Method Put `
        -Uri 'https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/app-build-manifest.json' `
        -Headers $uploadHeaders `
        -Body $bytes
    Write-Host "Upload status: $($ir.StatusCode)"
} catch {
    Write-Host "Upload error: $($_.Exception.Response.StatusCode.value__) - $($_.Exception.Message)"
}

# Verify by re-downloading
Start-Sleep -Seconds 2
Write-Host ""
Write-Host "=== Verifying upload ==="
$body2 = @{ command = "grep -c 'reports/ssd' /home/site/wwwroot/.next/app-build-manifest.json 2>&1"; dir = "/" } | ConvertTo-Json
$r2 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $headers -Body $body2 -ContentType 'application/json'
Write-Host "SSD count in manifest: $($r2.Output.Trim())"
$body3 = @{ command = 'wc -c /home/site/wwwroot/.next/app-build-manifest.json'; dir = '/' } | ConvertTo-Json
$r3 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $headers -Body $body3 -ContentType 'application/json'
Write-Host "Byte count on server: $($r3.Output.Trim())"
