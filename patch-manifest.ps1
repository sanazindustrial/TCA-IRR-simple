$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth; 'If-Match' = '*' }
$hGet = @{ Authorization = 'Basic ' + $auth }

$manifestUrl = 'https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/server/app/dashboard/reports/ssd/page_client-reference-manifest.js'

# Download current manifest
Write-Host "Downloading page_client-reference-manifest.js..."
$resp = Invoke-WebRequest -Uri $manifestUrl -Headers $hGet -UseBasicParsing
$content = $resp.Content
Write-Host "Downloaded: $($content.Length) chars"

# Show first 300 chars to understand the format
Write-Host "=== First 300 chars ==="
Write-Host $content.Substring(0, [Math]::Min(300, $content.Length))

# Replace Windows path prefix with Linux path prefix
# The server's wwwroot is /home/site/wwwroot/
# My local path: C:\Users\Allot\Desktop\TCA-IRR-APP-main- simplify\.actual-ui\
$winPrefix = 'C:\\Users\\Allot\\Desktop\\TCA-IRR-APP-main- simplify\\.actual-ui\\'
$linPrefix = '/home/site/wwwroot/'

# Also handle the non-double-escaped version (in JSON strings it might be single backslash)
$fixed = $content
$fixed = $fixed.Replace($winPrefix, $linPrefix)

# If the manifest uses forward slashes already (some tools normalize)
$winPrefixFwd = 'C:/Users/Allot/Desktop/TCA-IRR-APP-main- simplify/.actual-ui/'
$fixed = $fixed.Replace($winPrefixFwd, $linPrefix)

# Also handle TCA-IRR-simple directory paths 
$winPrefix2 = 'C:\\Users\\Allot\\Desktop\\TCA-IRR-APP-main- simplify\\TCA-IRR-simple\\'
$fixed = $fixed.Replace($winPrefix2, $linPrefix)
$winPrefix2Fwd = 'C:/Users/Allot/Desktop/TCA-IRR-APP-main- simplify/TCA-IRR-simple/'
$fixed = $fixed.Replace($winPrefix2Fwd, $linPrefix)

# Count replacements
$count = ($content.Length - $fixed.Length)
Write-Host "Replaced $count chars worth of Windows paths"

# Show first 300 chars of fixed version
Write-Host "=== Fixed first 300 chars ==="
Write-Host $fixed.Substring(0, [Math]::Min(300, $fixed.Length))

# Upload fixed manifest
Write-Host "Uploading fixed manifest..."
$bytes = [System.Text.Encoding]::UTF8.GetBytes($fixed)
$r = Invoke-WebRequest -Method Put -Uri $manifestUrl -Headers $h -Body $bytes -ContentType 'application/octet-stream' -UseBasicParsing
Write-Host "HTTP: $($r.StatusCode)"

# Test SSD
Write-Host ""
Write-Host "Testing SSD..."
Start-Sleep -Seconds 2
try {
    $ssd = Invoke-WebRequest -Uri 'https://tca-irr.azurewebsites.net/dashboard/reports/ssd' -UseBasicParsing -TimeoutSec 30
    Write-Host "SSD HTTP: $($ssd.StatusCode)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "SSD HTTP: $code"
}
