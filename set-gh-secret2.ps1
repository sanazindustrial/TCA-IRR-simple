# Read GitHub token from Windows Credential Manager and set the GitHub secret
$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CM3 {
  [DllImport("advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  private static extern bool CredRead(string t, int type, int flags, out IntPtr p);
  [DllImport("advapi32.dll")]
  private static extern void CredFree(IntPtr p);
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  private struct CRED {
    public int Flags, Type;
    public string TargetName, Comment;
    public long LastWritten;
    public int CredentialBlobSize;
    public IntPtr CredentialBlob;
    public int Persist, AttributeCount;
    public IntPtr Attributes;
    public string TargetAlias, UserName;
  }
  public static string Get(string target) {
    IntPtr p;
    if (!CredRead(target, 1, 0, out p)) return null;
    try {
      var c = Marshal.PtrToStructure<CRED>(p);
      if (c.CredentialBlob == IntPtr.Zero || c.CredentialBlobSize == 0) return null;
      byte[] bytes = new byte[c.CredentialBlobSize];
      Marshal.Copy(c.CredentialBlob, bytes, 0, c.CredentialBlobSize);
      return Encoding.Unicode.GetString(bytes);
    } finally { CredFree(p); }
  }
}
'@
Add-Type -TypeDefinition $code

$targets = @('git:https://github.com','git:https://sanazindustrial@github.com')
$token = $null
foreach ($t in $targets) {
  $pw = [CM3]::Get($t)
  if ($pw) {
    Write-Host "Found credential for: $t (length: $($pw.Length))"
    $token = $pw
    break
  }
}

if (-not $token) {
  Write-Error "No GitHub token found in Credential Manager. Please provide one."
  exit 1
}

$publishProfile = '<publishData><publishProfile profileName="TCA-IRR - Web Deploy" publishMethod="MSDeploy" publishUrl="tca-irr.scm.azurewebsites.net:443" msdeploySite="TCA-IRR" userName="$TCA-IRR" userPWD="DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ" destinationAppUrl="https://tca-irr.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="TCA-IRR - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-dm1-207.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="TCA-IRR\$TCA-IRR" userPWD="DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ" destinationAppUrl="https://tca-irr.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="TCA-IRR - Zip Deploy" publishMethod="ZipDeploy" publishUrl="tca-irr.scm.azurewebsites.net:443" userName="$TCA-IRR" userPWD="DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ" destinationAppUrl="https://tca-irr.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile></publishData>'

$owner = "sanazindustrial"
$repo  = "TCA-IRR-simple"
$secretName = "AZURE_WEBAPP_PUBLISH_PROFILE"

$headers = @{
  Authorization = "token $token"
  Accept        = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
}

Write-Host "Getting repo public key..."
$keyResp = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/actions/secrets/public-key" -Headers $headers
$keyId   = $keyResp.key_id
$keyB64  = $keyResp.key
Write-Host "Got key_id: $keyId"

# Write publish profile to temp file (UTF8 no BOM)
$enc = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText("$env:TEMP\gh_pp.txt", $publishProfile, $enc)

# Set env vars for node.js
$env:GH_TOKEN       = $token
$env:GH_KEY_ID      = $keyId
$env:GH_KEY_B64     = $keyB64
$env:GH_SECRET_NAME = $secretName
$env:GH_OWNER       = $owner
$env:GH_REPO        = $repo

$jsCode = @'
const https = require('https');
const { execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const token      = process.env.GH_TOKEN;
const keyId      = process.env.GH_KEY_ID;
const keyB64     = process.env.GH_KEY_B64;
const secretName = process.env.GH_SECRET_NAME;
const owner      = process.env.GH_OWNER;
const repo       = process.env.GH_REPO;
const secretValue = fs.readFileSync(path.join(os.tmpdir(), 'gh_pp.txt'), 'utf8');

const pkgDir = path.join(os.tmpdir(), 'ghsecret_sodium');
if (!fs.existsSync(pkgDir)) fs.mkdirSync(pkgDir);
fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'tmp', version: '1.0.0' }));

process.stdout.write('Installing libsodium-wrappers...\n');
try {
  execSync('npm install libsodium-wrappers --save', { cwd: pkgDir, stdio: 'pipe' });
} catch(e) {
  process.stderr.write('npm install failed: ' + e.message + '\n');
  process.exit(1);
}

const _sodium = require(path.join(pkgDir, 'node_modules', 'libsodium-wrappers'));

async function run() {
  await _sodium.ready;
  const sodium = _sodium;

  const publicKey = Buffer.from(keyB64, 'base64');
  const secretBytes = Buffer.from(secretValue, 'utf8');
  const encryptedBytes = sodium.crypto_box_seal(secretBytes, publicKey);
  const encryptedB64 = Buffer.from(encryptedBytes).toString('base64');

  const body = JSON.stringify({ encrypted_value: encryptedB64, key_id: keyId });
  const options = {
    hostname: 'api.github.com',
    path: '/repos/' + owner + '/' + repo + '/actions/secrets/' + secretName,
    method: 'PUT',
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'User-Agent': 'deploy-script'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        process.stdout.write('STATUS:' + res.statusCode + '\n');
        if (data) process.stdout.write('BODY:' + data + '\n');
        resolve(res.statusCode);
      });
    });
    req.on('error', e => { process.stderr.write('Error: ' + e.message + '\n'); reject(e); });
    req.write(body);
    req.end();
  });
}

run().catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
'@

$jsFile = "$env:TEMP\set_secret_v2.js"
[System.IO.File]::WriteAllText($jsFile, $jsCode, $enc)

Write-Host "Running encryption and secret upload..."
$result = & node $jsFile 2>&1
Write-Host $result

if ($result -match "STATUS:201" -or $result -match "STATUS:204") {
  Write-Host "`n[SUCCESS] Secret '$secretName' set successfully!" -ForegroundColor Green
} elseif ($result -match "STATUS:") {
  Write-Warning "Got unexpected status. Check output above."
} else {
  Write-Error "Script did not produce expected output."
}

# Cleanup
Remove-Item "$env:TEMP\gh_pp.txt" -Force -ErrorAction SilentlyContinue
Remove-Item $jsFile -Force -ErrorAction SilentlyContinue
$env:GH_TOKEN = $null
