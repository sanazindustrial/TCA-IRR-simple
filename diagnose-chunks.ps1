$kuduUser = '$TCA-IRR'
$kuduPass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$authBytes = [Text.Encoding]::ASCII.GetBytes($kuduUser + ':' + $kuduPass)
$auth = [Convert]::ToBase64String($authBytes)
$h = @{ Authorization = 'Basic ' + $auth }

Write-Host "=== Server .next/server/pages/ timestamps ==="
$cmd = [ordered]@{ command = 'ls -la /home/site/wwwroot/.next/server/pages/'; dir = '/home/site/wwwroot' }
$r = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body ($cmd|ConvertTo-Json) -ContentType 'application/json' -UseBasicParsing
Write-Host $r.Output

Write-Host ""
Write-Host "=== Server .next/server/ top-level file timestamps ==="
$cmd2 = [ordered]@{ command = 'ls -la /home/site/wwwroot/.next/server/'; dir = '/home/site/wwwroot' }
$r2 = Invoke-RestMethod -Method Post -Uri 'https://tca-irr.scm.azurewebsites.net/api/command' -Headers $h -Body ($cmd2|ConvertTo-Json) -ContentType 'application/json' -UseBasicParsing
Write-Host $r2.Output

# Now check which chunks are in LOCAL but NOT on server
$localChunks = @(1365, 1798, 1855, 1867, 2531, 2945, 3636, 3787, 381, 4049, 4165, 4368, 4424, 4447, 4682, 4851, 5149, 5498, 5564, 5751, 580, 5876, 6058, 6236, 6348, 6415, 6577, 672, 7636, 8008, 8010, 8034, 8167, 8297, 8353, 8450, 8548, 8586, 8943, 9499, 9647, 9826)
$serverChunks = @(1188, 1365, 1855, 1867, 1982, 2229, 2287, 2945, 3, 3090, 3304, 3348, 381, 4165, 4405, 4424, 4447, 4609, 4759, 4966, 505, 5138, 5149, 5564, 5779, 580, 5876, 6429, 6437, 672, 7115, 735, 7636, 8008, 8010, 814, 8167, 8248, 8353, 843, 8548, 8892, 8943, 9089, 9364, 9499, 9647, 9826)

$missingFromServer = $localChunks | Where-Object { $_ -notin $serverChunks }
$missingFromLocal = $serverChunks | Where-Object { $_ -notin $localChunks }

Write-Host ""
Write-Host "=== Chunks in LOCAL but NOT on server (need to upload) ==="
$missingFromServer | ForEach-Object { Write-Host "$_.js" }

Write-Host ""
Write-Host "=== Chunks on server but NOT in local (old chunks) ==="
$missingFromLocal | ForEach-Object { Write-Host "$_.js" }
