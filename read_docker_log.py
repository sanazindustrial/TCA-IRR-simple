import requests
from requests.auth import HTTPBasicAuth

USER = "$TCA-IRR"
PASS = "DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ"
auth = HTTPBasicAuth(USER, PASS)

log_url = "https://tca-irr.scm.azurewebsites.net/api/vfs/LogFiles/2026_05_04_lw1mdlwk0001DT_docker.log"
r = requests.get(log_url, auth=auth, timeout=30)
# Print last 3000 chars
text = r.text
print(text[-3000:])
