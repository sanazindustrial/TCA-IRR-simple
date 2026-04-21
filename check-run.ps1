# Check the status of the latest GitHub Actions run
$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CM6 {
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

$token = [CM6]::Get('git:https://github.com')
$headers = @{
  Authorization = "token $token"
  Accept = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
  "User-Agent" = "deploy-script"
}

$runs = Invoke-RestMethod -Uri "https://api.github.com/repos/sanazindustrial/TCA-IRR-simple/actions/runs?per_page=3" -Headers $headers
foreach ($r in $runs.workflow_runs) {
  Write-Host "#$($r.run_number) | $($r.status) | $($r.conclusion) | $($r.created_at)"
  Write-Host "  URL: $($r.html_url)"
}
