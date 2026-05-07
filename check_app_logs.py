import requests
from requests.auth import HTTPBasicAuth

USER = "$TCA-IRR"
PASS = "DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ"
KUDU_URL = "https://tca-irr.scm.azurewebsites.net"
auth = HTTPBasicAuth(USER, PASS)

# Check if server.js exists in wwwroot
r = requests.get(f"{KUDU_URL}/api/vfs/site/wwwroot/", auth=auth, timeout=30)
print("=== WWWROOT FILES ===")
if r.status_code == 200:
    files = r.json()
    for f in files[:20]:
        print(f.get("name", ""), f.get("size", ""))
else:
    print("Status:", r.status_code, r.text[:200])

# Check startup command / web.config
print("\n=== WEB.CONFIG ===")
r2 = requests.get(f"{KUDU_URL}/api/vfs/site/wwwroot/web.config", auth=auth, timeout=30)
if r2.status_code == 200:
    print(r2.text[:500])
else:
    print("No web.config found, status:", r2.status_code)

# Check recent log entries
print("\n=== APPLICATION LOGS ===")
r3 = requests.get(f"{KUDU_URL}/api/logs/docker", auth=auth, timeout=30)
if r3.status_code == 200:
    print(r3.text[-2000:])
else:
    print("Status:", r3.status_code, r3.text[:300])
