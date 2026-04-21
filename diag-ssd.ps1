$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth }

Write-Host "=== SSD server dir timestamps ==="
$c1 = [ordered]@{ command = 'ls -la /home/site/wwwroot/.next/server/app/dashboard/reports/ssd/'; dir = '/home/site/wwwroot' }
$r1 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body ($c1|ConvertTo-Json) -ContentType 'application/json' -UseBasicParsing
Write-Host $r1.Output; Write-Host $r1.Error

Write-Host "=== Static SSD chunk ==="
$c2 = [ordered]@{ command = 'ls -la /home/site/wwwroot/.next/static/chunks/app/dashboard/reports/ssd/ 2>/dev/null'; dir = '/home/site/wwwroot' }
$r2 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body ($c2|ConvertTo-Json) -ContentType 'application/json' -UseBasicParsing
Write-Host $r2.Output; Write-Host $r2.Error

Write-Host "=== CHECK: standalone .next in server dir ==="
$c3 = [ordered]@{ command = 'ls -la /home/site/wwwroot/.next/server/app/dashboard/reports/'; dir = '/home/site/wwwroot' }
$r3 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body ($c3|ConvertTo-Json) -ContentType 'application/json' -UseBasicParsing
Write-Host $r3.Output; Write-Host $r3.Error

Write-Host "=== BUILD_ID inside standalone ==="
$c4 = [ordered]@{ command = 'cat /home/site/wwwroot/.next/BUILD_ID'; dir = '/home/site/wwwroot' }
$r4 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body ($c4|ConvertTo-Json) -ContentType 'application/json' -UseBasicParsing
Write-Host "BUILD_ID: $($r4.Output.Trim())"

Write-Host "=== server.js first 5 lines ==="
$c5 = [ordered]@{ command = 'head -5 /home/site/wwwroot/server.js'; dir = '/home/site/wwwroot' }
$r5 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body ($c5|ConvertTo-Json) -ContentType 'application/json' -UseBasicParsing
Write-Host $r5.Output

Write-Host "=== Check required-server-files ==="
$c6 = [ordered]@{ command = 'head -5 /home/site/wwwroot/.next/required-server-files.json'; dir = '/home/site/wwwroot' }
$r6 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body ($c6|ConvertTo-Json) -ContentType 'application/json' -UseBasicParsing
Write-Host $r6.Output

Write-Host "=== SSD page.js first 3 lines ==="
$c7 = [ordered]@{ command = 'head -3 /home/site/wwwroot/.next/server/app/dashboard/reports/ssd/page.js'; dir = '/home/site/wwwroot' }
$r7 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body ($c7|ConvertTo-Json) -ContentType 'application/json' -UseBasicParsing
Write-Host $r7.Output; Write-Host $r7.Error
