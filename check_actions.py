import urllib.request, json, datetime

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    r = urllib.request.urlopen(req, timeout=15)
    return r.read().decode('utf-8', errors='replace')

def step_duration(s):
    try:
        fmt = '%Y-%m-%dT%H:%M:%SZ'
        start = datetime.datetime.strptime(s['started_at'], fmt)
        end = datetime.datetime.strptime(s['completed_at'], fmt)
        return int((end - start).total_seconds())
    except Exception:
        return '?'

# Get latest 3 runs
print("=== LATEST CI RUNS ===")
try:
    runs_data = json.loads(fetch('https://api.github.com/repos/sanazindustrial/TCA-IRR-simple/actions/runs?per_page=3'))
    for run in runs_data['workflow_runs']:
        print(f"Run {run['id']} sha={run['head_sha'][:8]} workflow={run['name']} conclusion={run['conclusion']} at={run['created_at']}")
except Exception as e:
    print("Error:", e)

print()
# Show ALL jobs and steps for the latest 2 runs
run_ids = [24883568089, 24883568075, 24881283848]
for run_id in run_ids:
    print(f"=== JOBS for run {run_id} ===")
    try:
        data = json.loads(fetch(f'https://api.github.com/repos/sanazindustrial/TCA-IRR-simple/actions/runs/{run_id}/jobs'))
        for j in data['jobs']:
            print(f"  JOB: {j['id']} '{j['name']}' conclusion={j['conclusion']}")
            for s in j['steps']:
                dur = step_duration(s)
                status = s['conclusion'] or s['status']
                print(f"    [{status}] ({dur}s) Step {s['number']}: {s['name']}")
    except Exception as e:
        print("  Error:", e)
    print()
