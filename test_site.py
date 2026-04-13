import requests

r = requests.get('https://tca-irr.azurewebsites.net', timeout=30)
print(f'Status: {r.status_code}')
print(f'Content-Type: {r.headers.get("Content-Type", "unknown")}')
print(f'Content Length: {len(r.content)} bytes')
if '<html' in r.text.lower():
    print('Contains HTML: Yes')
    import re
    title = re.search(r'<title[^>]*>(.*?)</title>', r.text, re.I)
    if title:
        print(f'Title: {title.group(1)[:100]}')

# Check a few pages
pages = ['/login', '/dashboard', '/dashboard/users']
for page in pages:
    try:
        resp = requests.get(f'https://tca-irr.azurewebsites.net{page}', timeout=10, allow_redirects=True)
        print(f'{page}: {resp.status_code}')
    except Exception as e:
        print(f'{page}: Error - {e}')
