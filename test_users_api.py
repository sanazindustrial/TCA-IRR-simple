import requests, json

login = requests.post(
    'https://tcairrapiccontainer.azurewebsites.net/api/v1/auth/login',
    json={'email': 'admin@tca.com', 'password': 'admin123'},
    timeout=15
)
tok = login.json().get('access_token', '')
print('Login:', login.status_code)

# Check backend logs / diagnostics
r = requests.get(
    'https://tcairrapiccontainer.azurewebsites.net/api/v1/users/?size=5',
    headers={'Authorization': f'Bearer {tok}'},
    timeout=15
)
print(f'Status: {r.status_code}')
print(r.text[:1000])
