$user = '$TCA-IRR'
$pass = 'DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ'
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$headers = @{ Authorization = "Basic $auth" }

# Also check app-paths-manifest, pages-manifest, required-server-files
$manifests = @("routes-manifest.json", "app-paths-manifest.json", "pages-manifest.json", "required-server-files.json")
foreach ($m in $manifests) {
  try {
    $content = Invoke-RestMethod "https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/.next/$m" -Headers $headers
    $hasSSd = ($content | ConvertTo-Json -Depth 10) -like "*ssd*"
    Write-Host "$m : has_ssd=$hasSSd"
  } catch {
    Write-Host "$m : ERROR - $($_.Exception.Message)"
  }
}
