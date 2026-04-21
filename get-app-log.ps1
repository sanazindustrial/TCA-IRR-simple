$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth }

# Get the default docker log (app errors)
$url = 'https://tca-irr.scm.azurewebsites.net/api/vfs/LogFiles/2026_04_21_lw1mdlwk0001CL_default_docker.log'
$content = Invoke-WebRequest -Uri $url -Headers $h -UseBasicParsing
$lines = $content.Content -split "`n"

Write-Host "Total lines: $($lines.Count)"
Write-Host ""
Write-Host "=== Last 50 lines ==="
$lines | Select-Object -Last 50 | ForEach-Object { Write-Host $_ }
