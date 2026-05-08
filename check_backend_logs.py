"""Fetch the default_docker log for Python application errors"""
import requests

backend_scm = "https://tcairrapiccontainer.scm.azurewebsites.net"
creds = ("$tcairrapiccontainer", "4dyqdt2neKnPiMWys4Bwjm78fvEpeiEwq9fNjwPXPue2Z5sW4yDvzAzb9szz")

# Fetch the default docker log (contains Python stdout/stderr)
for log_name in [
    "2026_04_18_lw1sdlwk0007OB_default_docker.log",
    "2026_04_17_lw1sdlwk0007OB_default_docker.log",
]:
    url = f"{backend_scm}/api/vfs/LogFiles/{log_name}"
    r = requests.get(url, auth=creds, timeout=30, headers={"Range": "bytes=-20000"})
    if r.status_code == 200:
        print(f"\n=== {log_name} (last 20KB) ===")
        text = r.text
        lines = text.splitlines()
        # Find lines with error keywords
        relevant = [l for l in lines if any(k in l for k in [
            'error', 'Error', 'ERROR', 'Exception', 'Traceback',
            'users', 'ValidationError', '500', 'failed', 'Failed'
        ])]
        print(f"Total relevant lines: {len(relevant)}")
        print('\n'.join(relevant[-80:]))
    else:
        print(f"{log_name}: {r.status_code}")





