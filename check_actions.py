import urllib.request, json

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    r = urllib.request.urlopen(req)
    return r.read().decode('utf-8', errors='replace')

# Frontend build job logs
print("=== FRONTEND BUILD LOG (last 4000 chars) ===")
try:
    log = fetch('https://api.github.com/repos/sanazindustrial/TCA-IRR-simple/actions/jobs/72857842110/logs')
    print(log[-4000:])
except Exception as e:
    print("Error:", e)

print()
print("=== BACKEND DEPLOY JOB IDS ===")
try:
    data = json.loads(fetch('https://api.github.com/repos/sanazindustrial/TCA-IRR-simple/actions/runs/24883568089/jobs'))
    for j in data['jobs']:
        print(j['id'], j['name'], j['conclusion'])
        for s in j['steps']:
            if s['conclusion'] != 'success':
                print("   STEP:", s['name'], s['conclusion'])
except Exception as e:
    print("Error:", e)
