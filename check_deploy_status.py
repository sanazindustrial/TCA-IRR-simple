import requests
import json

# Kudu credentials
username = "$TCA-IRR"
password = "QNNcFyBbHiDzBqWFYSJAglhpQTpYBK1n1k2SaZknFt2a6NbELDFZEJPFpJBQ"
kudu_url = "https://tca-irr.scm.azurewebsites.net"

# Check wwwroot contents
print("=== Checking wwwroot contents ===")
resp = requests.post(f"{kudu_url}/api/command",
                     auth=(username, password),
                     json={
                         "command": "ls -la /home/site/wwwroot",
                         "dir": "/"
                     })
if resp.ok:
    data = resp.json()
    print(data.get("Output", "No output"))
    if data.get("Error"):
        print("Error:", data.get("Error"))
else:
    print(f"Error: {resp.status_code}")

# Check node_modules
print("\n=== Checking node_modules ===")
resp = requests.post(
    f"{kudu_url}/api/command",
    auth=(username, password),
    json={
        "command":
        "ls /home/site/wwwroot/node_modules 2>/dev/null | head -5 || echo 'node_modules not found'",
        "dir": "/"
    })
if resp.ok:
    data = resp.json()
    print(data.get("Output", "No output"))

# Check if site is running
print("\n=== Checking site ===")
try:
    resp = requests.get("https://tca-irr.azurewebsites.net", timeout=30)
    print(f"HTTP Status: {resp.status_code}")
except Exception as e:
    print(f"Error: {e}")

# Get latest deployment
print("\n=== Latest deployment ===")
resp = requests.get(f"{kudu_url}/api/deployments", auth=(username, password))
if resp.ok:
    deps = resp.json()
    if deps:
        latest = deps[0]
        print(f"ID: {latest.get('id')}")
        print(f"Status: {latest.get('status')} (4=success, 3=failed)")
        print(f"Message: {latest.get('message')}")
        print(f"Complete: {latest.get('complete')}")
    else:
        print("No deployments found")
