# Read GitHub token from Windows Credential Manager and set the GitHub secret
$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CM {
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
  $pw = [CM]::Get($t)
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

# The publish profile XML content
$publishProfile = '<publishData><publishProfile profileName="TCA-IRR - Web Deploy" publishMethod="MSDeploy" publishUrl="tca-irr.scm.azurewebsites.net:443" msdeploySite="TCA-IRR" userName="$TCA-IRR" userPWD="DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ" destinationAppUrl="https://tca-irr.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="TCA-IRR - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-dm1-207.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="TCA-IRR\$TCA-IRR" userPWD="DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ" destinationAppUrl="https://tca-irr.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="TCA-IRR - Zip Deploy" publishMethod="ZipDeploy" publishUrl="tca-irr.scm.azurewebsites.net:443" userName="$TCA-IRR" userPWD="DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ" destinationAppUrl="https://tca-irr.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile></publishData>'

$owner = "sanazindustrial"
$repo  = "TCA-IRR-simple"
$secretName = "AZURE_WEBAPP_PUBLISH_PROFILE"

$headers = @{
  Authorization = "token $token"
  Accept        = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
}

# Step 1: Get repo public key
Write-Host "Getting repo public key..."
$keyResp = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/actions/secrets/public-key" -Headers $headers
$keyId   = $keyResp.key_id
$keyB64  = $keyResp.key
Write-Host "Got key_id: $keyId"

# Step 2: Encrypt secret using libsodium (via .NET NaCl)
# We'll use the Sodium.Core NuGet package approach via inline base64 key encryption
# Since we can't easily use libsodium directly, use PowerShell + .NET to do the encryption

# Load Sodium via a simple approach - check if Sodium.Core is available
# Alternative: use the GitHub CLI approach or direct API with proper encryption

# Try to use the GitHub API secret encryption with available .NET
# GitHub requires libsodium sealed box encryption (X25519 + XSalsa20-Poly1305)
# We'll install Sodium.Core via NuGet if not present

$sodiumPath = "$env:TEMP\Sodium.Core.dll"
if (-not (Test-Path $sodiumPath)) {
  Write-Host "Downloading Sodium.Core..."
  $nugetUrl = "https://www.nuget.org/api/v2/package/Sodium.Core/1.3.5"
  $nupkgPath = "$env:TEMP\sodium.nupkg"
  Invoke-WebRequest -Uri $nugetUrl -OutFile $nupkgPath -UseBasicParsing
  
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [System.IO.Compression.ZipFile]::OpenRead($nupkgPath)
  $entry = $zip.Entries | Where-Object { $_.FullName -match "lib.*net.*Sodium.Core.dll" } | Select-Object -Last 1
  if (-not $entry) { $entry = $zip.Entries | Where-Object { $_.Name -eq "Sodium.Core.dll" } | Select-Object -Last 1 }
  if ($entry) {
    $stream = $entry.Open()
    $fs = [System.IO.File]::Create($sodiumPath)
    $stream.CopyTo($fs); $fs.Close(); $stream.Close()
    Write-Host "Extracted Sodium.Core.dll"
  }
  $zip.Dispose()
}

# Actually - use a simpler approach: install gh CLI temporarily and use it
# OR use the raw Tweetnacl approach in pure PowerShell/JS

# Simpler: Use node.js which is already installed to do the encryption
$jsEncrypt = @"
const crypto = require('crypto');
const https = require('https');
const { execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Read values from environment variables and temp file
const token      = process.env.GH_TOKEN;
const keyId      = process.env.GH_KEY_ID;
const keyB64     = process.env.GH_KEY_B64;
const secretName = process.env.GH_SECRET_NAME;
const owner      = process.env.GH_OWNER;
const repo       = process.env.GH_REPO;
const secretValue = fs.readFileSync(path.join(os.tmpdir(), 'gh_pp.txt'), 'utf8');

const tmpDir = os.tmpdir();
const pkgDir = path.join(tmpDir, 'ghsecret_tmp2');
if (!fs.existsSync(pkgDir)) fs.mkdirSync(pkgDir);
fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'tmp', version: '1.0.0' }));

process.stdout.write('Installing libsodium-wrappers...\n');
try {
  execSync('npm install libsodium-wrappers --save', { cwd: pkgDir, stdio: 'pipe' });
} catch(e) {
  process.stderr.write('npm install failed: ' + e.message + '\n');
  process.exit(1);
}
process.stdout.write('Done.\n');

const _sodium = require(path.join(pkgDir, 'node_modules', 'libsodium-wrappers'));

async function run() {
  await _sodium.ready;
  const sodium = _sodium;

  const publicKey = Buffer.from(keyB64, 'base64');
  const secretBytes = Buffer.from(secretValue, 'utf8');

  // Use libsodium's crypto_box_seal - correct implementation
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
"@

// Decode the public key
const publicKey = Buffer.from(keyB64, 'base64');

// Generate ephemeral keypair
const ephemeralKeypair = nacl.box.keyPair();

// Encrypt using sealed box (X25519 + XSalsa20-Poly1305)
const secretBytes = naclUtil.decodeUTF8(secretValue);
const nonce = nacl.randomBytes(nacl.box.nonceLength);
const encrypted = nacl.box(secretBytes, nonce, publicKey, ephemeralKeypair.secretKey);

// Sealed box = ephemeral public key + nonce + ciphertext... 
// Actually GitHub uses libsodium's crypto_box_seal which is different
// crypto_box_seal creates ephemeral key, uses ECDH to derive shared key, encrypts with no nonce stored separately

// Let's implement crypto_box_seal manually:
// 1. Generate ephemeral X25519 keypair
// 2. Compute nonce = first 24 bytes of SHA512(ephemeral_pk || recipient_pk)  
// 3. Encrypt: crypto_box(msg, nonce, recipient_pk, ephemeral_sk)
// 4. Output: ephemeral_pk || ciphertext

function crypto_box_seal(msg, recipientPk) {
  const ephKp = nacl.box.keyPair();
  const nonceInput = Buffer.concat([Buffer.from(ephKp.publicKey), Buffer.from(recipientPk)]);
  const hash = require('crypto').createHash('sha512').update(nonceInput).digest();
  const nonce = hash.slice(0, 24);
  const msgBytes = Buffer.isBuffer(msg) ? msg : Buffer.from(msg);
  const encrypted = nacl.box(new Uint8Array(msgBytes), new Uint8Array(nonce), new Uint8Array(recipientPk), ephKp.secretKey);
  return Buffer.concat([Buffer.from(ephKp.publicKey), Buffer.from(encrypted)]);
}

const encryptedBytes = crypto_box_seal(Buffer.from(secretValue, 'utf8'), publicKey);
const encryptedB64 = encryptedBytes.toString('base64');

// Set the secret via GitHub API
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

const req = https.request(options, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    process.stdout.write('STATUS:' + res.statusCode + '\n');
    if (data) process.stdout.write('BODY:' + data + '\n');
  });
});
req.on('error', e => { process.stderr.write('Error: ' + e.message + '\n'); process.exit(1); });
req.write(body);
req.end();
"@

# Pass data as environment variables (avoids encoding issues)
$env:GH_TOKEN       = $token
$env:GH_KEY_ID      = $keyId
$env:GH_KEY_B64     = $keyB64
$env:GH_SECRET_NAME = $secretName
$env:GH_OWNER       = $owner
$env:GH_REPO        = $repo

# Write publish profile to temp file using UTF8 without BOM
$enc = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText("$env:TEMP\gh_pp.txt", $publishProfile, $enc)

$jsFile = "$env:TEMP\set_gh_secret.js"
[System.IO.File]::WriteAllText($jsFile, $jsEncrypt, $enc)

Write-Host "Running encryption and API call..."
$result = node $jsFile 2>&1
Write-Host $result

if ($result -match "STATUS:201" -or $result -match "STATUS:204") {
  Write-Host "`n[SUCCESS] Secret '$secretName' set successfully!" -ForegroundColor Green
} elseif ($result -match "STATUS:") {
  Write-Warning "Unexpected status. Check output above."
} else {
  Write-Error "Failed to set secret."
}

# Cleanup sensitive files
Remove-Item "$env:TEMP\gh_pp.txt" -Force -ErrorAction SilentlyContinue
Remove-Item $jsFile -Force -ErrorAction SilentlyContinue
$env:GH_TOKEN = $null
