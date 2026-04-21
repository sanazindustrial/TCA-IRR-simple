$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth }

$logUrl = 'https://tca-irr.scm.azurewebsites.net/api/vfs/LogFiles/2026_04_21_lw1mdlwk0001CL_default_docker.log'
Write-Host "Downloading app docker log..."
$r = Invoke-WebRequest -Uri $logUrl -Headers $h -UseBasicParsing
$content = [System.Text.Encoding]::UTF8.GetString($r.Content)
$lines = $content -split "`n"
Write-Host "Total lines: $($lines.Count)"
Write-Host ""
Write-Host "=== Lines matching ssd/error/500/module/Cannot ==="
$lines | Select-String -Pattern 'ssd|Error|error|500|Module|Cannot|exception|undefined|TypeError|ReferenceError' | Select-Object -Last 50 | ForEach-Object { Write-Host $_ }
Write-Host ""
Write-Host "=== Last 30 lines ==="
$lines | Select-Object -Last 30 | ForEach-Object { Write-Host $_ }
