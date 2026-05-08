$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth }

Write-Host "=== Server .next/server/chunks/ ==="
$cmd = [ordered]@{ command = 'ls /home/site/wwwroot/.next/server/chunks/'; dir = '/home/site/wwwroot' }
$r = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body ($cmd|ConvertTo-Json) -ContentType 'application/json' -UseBasicParsing
Write-Host $r.Output

Write-Host ""
Write-Host "=== Server webpack-runtime.js timestamp ==="
$cmd2 = [ordered]@{ command = 'ls -la /home/site/wwwroot/.next/server/webpack-runtime.js'; dir = '/home/site/wwwroot' }
$r2 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body ($cmd2|ConvertTo-Json) -ContentType 'application/json' -UseBasicParsing
Write-Host $r2.Output
