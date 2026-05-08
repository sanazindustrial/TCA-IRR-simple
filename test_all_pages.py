import requests

base_url = 'https://tca-irr.azurewebsites.net'

# All dashboard pages to test
pages = [
    '/dashboard',
    '/dashboard/users',
    '/dashboard/user-requests',
    '/dashboard/my-requests',
    '/dashboard/analyst',
    '/dashboard/evaluation',
    '/dashboard/reports',
    '/dashboard/cost',
    '/dashboard/ssd-audit',
    '/dashboard/system-health',
    '/dashboard/database',
    '/dashboard/database-integration',
    '/dashboard/remote',
    '/dashboard/backup',
    '/dashboard/ai-training',
    '/dashboard/module-settings',
    '/dashboard/system-config',
    '/dashboard/settings',
    '/dashboard/help',
]

print(f"Testing {len(pages)} pages...\n")

# First verify CSS loads
print("=== Checking CSS ===")
r = requests.get(base_url, timeout=30)
import re

css_match = re.search(r'href="(/_next/static/css/[^"]+\.css)"', r.text)
if css_match:
    css_url = base_url + css_match.group(1)
    css_resp = requests.get(css_url, timeout=10)
    print(f"CSS file: {css_match.group(1)}")
    print(f"CSS Status: {css_resp.status_code}")
    print(f"CSS Size: {len(css_resp.content)} bytes\n")
else:
    print("ERROR: No CSS file found!\n")

print("=== Testing Pages ===")
for page in pages:
    try:
        resp = requests.get(f'{base_url}{page}',
                            timeout=15,
                            allow_redirects=True)
        status = "OK" if resp.status_code == 200 else f"ERROR {resp.status_code}"
        print(f"{page}: {status}")
    except Exception as e:
        print(f"{page}: TIMEOUT/ERROR")
