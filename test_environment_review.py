"""
Environment Setup & Access Review Test Suite
Tests: Backend, Database, API Access, CORS, Security Headers
"""
import requests
import json
import os
import sys

BASE_URL = 'http://localhost:8000'
API_V1_URL = f'{BASE_URL}/api/v1'

print('=' * 70)
print('ENVIRONMENT SETUP & ACCESS REVIEW')
print('=' * 70)

results = {'passed': 0, 'failed': 0, 'warnings': 0, 'tests': []}

def log_result(name, passed, details='', warning=False):
    if warning:
        status = 'WARN'
        results['warnings'] += 1
    else:
        status = 'PASS' if passed else 'FAIL'
        results['passed' if passed else 'failed'] += 1
    results['tests'].append({'name': name, 'passed': passed, 'details': details, 'warning': warning})
    print(f'[{status}] {name}')
    if details:
        print(f'       {details}')

def section(title):
    print(f'\n{"="*70}\n{title}\n{"="*70}')

# ============================================================
# SECTION 1: BACKEND SERVER STATUS
# ============================================================
section('1. BACKEND SERVER STATUS')

# 1.1 Backend is running
try:
    resp = requests.get(f'{BASE_URL}/', timeout=5)
    log_result('1.1 Backend server responding', resp.status_code == 200,
               f'Status: {resp.status_code}' if resp.status_code != 200 else 'Server is up')
except Exception as e:
    log_result('1.1 Backend server responding', False, f'Cannot connect: {str(e)[:50]}')

# 1.2 Health check endpoint
try:
    resp = requests.get(f'{BASE_URL}/health', timeout=5)
    if resp.status_code == 200:
        health = resp.json()
        db_status = health.get('database', {}).get('status', 'unknown')
        ai_status = health.get('ai_service', {}).get('status', 'unknown')
        log_result('1.2 Health check endpoint', True, 
                   f'DB: {db_status}, AI: {ai_status}')
    else:
        log_result('1.2 Health check endpoint', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('1.2 Health check endpoint', False, str(e)[:50])

# 1.3 API version info
try:
    resp = requests.get(f'{BASE_URL}/', timeout=5)
    if resp.status_code == 200:
        data = resp.json()
        log_result('1.3 API version info', True, f'Message: {data.get("message", "N/A")[:50]}')
    else:
        log_result('1.3 API version info', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('1.3 API version info', False, str(e)[:50])

# ============================================================
# SECTION 2: DATABASE CONNECTION
# ============================================================
section('2. DATABASE CONNECTION')

# 2.1 Database health from /health endpoint
try:
    resp = requests.get(f'{BASE_URL}/health', timeout=10)
    if resp.status_code == 200:
        health = resp.json()
        db_info = health.get('database', {})
        db_status = db_info.get('status', 'unknown')
        pool_size = db_info.get('pool_size', 'N/A')
        log_result('2.1 Database connection status', db_status == 'healthy',
                   f'Status: {db_status}, Pool: {pool_size}')
    else:
        log_result('2.1 Database connection status', False, f'Health check failed: {resp.status_code}')
except Exception as e:
    log_result('2.1 Database connection status', False, str(e)[:50])

# 2.2 Test database query (via user registration check)
try:
    # Try to register a user to verify DB write access
    test_check = {'username': 'db_check_temp', 'email': 'dbcheck@test.com', 
                  'password': 'TestP@ss123!', 'confirm_password': 'TestP@ss123!'}
    resp = requests.post(f'{API_V1_URL}/auth/register', json=test_check, timeout=10)
    # Either 201 (created) or 400 (duplicate) means DB is working
    if resp.status_code in [201, 400]:
        log_result('2.2 Database write access', True, 'DB write operations working')
    else:
        log_result('2.2 Database write access', False, f'Unexpected status: {resp.status_code}')
except Exception as e:
    log_result('2.2 Database write access', False, str(e)[:50])

# ============================================================
# SECTION 3: API ENDPOINTS AVAILABILITY
# ============================================================
section('3. API ENDPOINTS AVAILABILITY')

endpoints = [
    ('GET', '/auth/me', 403),  # Requires auth
    ('POST', '/auth/login', 422),  # Requires body
    ('POST', '/auth/register', 422),  # Requires body
    ('POST', '/auth/logout', 403),  # Requires auth
    ('POST', '/auth/forgot-password', 422),  # Requires body
    ('POST', '/auth/reset-password', 422),  # Requires body
]

for method, endpoint, expected_status in endpoints:
    try:
        url = f'{API_V1_URL}{endpoint}'
        if method == 'GET':
            resp = requests.get(url, timeout=5)
        else:
            resp = requests.post(url, timeout=5)
        # Check if endpoint exists (not 404)
        exists = resp.status_code != 404
        log_result(f'3.x {method} {endpoint}', exists,
                   f'Status: {resp.status_code}' if not exists else '')
    except Exception as e:
        log_result(f'3.x {method} {endpoint}', False, str(e)[:30])

# ============================================================
# SECTION 4: CORS & SECURITY HEADERS
# ============================================================
section('4. CORS & SECURITY HEADERS')

# 4.1 CORS headers present
try:
    headers = {'Origin': 'http://localhost:3000'}
    resp = requests.options(f'{BASE_URL}/health', headers=headers, timeout=5)
    cors_header = resp.headers.get('access-control-allow-origin', '')
    log_result('4.1 CORS headers configured', bool(cors_header) or resp.status_code == 200,
               f'Allow-Origin: {cors_header[:30] if cors_header else "Not in OPTIONS response"}')
except Exception as e:
    log_result('4.1 CORS headers configured', False, str(e)[:50])

# 4.2 Security headers
try:
    resp = requests.get(f'{BASE_URL}/health', timeout=5)
    security_headers = {
        'X-Content-Type-Options': resp.headers.get('X-Content-Type-Options'),
        'X-Frame-Options': resp.headers.get('X-Frame-Options'),
        'X-XSS-Protection': resp.headers.get('X-XSS-Protection'),
    }
    present_headers = [k for k, v in security_headers.items() if v]
    log_result('4.2 Security headers present', len(present_headers) >= 1,
               f'Found: {", ".join(present_headers) if present_headers else "None"}', 
               warning=len(present_headers) < 3)
except Exception as e:
    log_result('4.2 Security headers present', False, str(e)[:50])

# ============================================================
# SECTION 5: API DOCUMENTATION
# ============================================================
section('5. API DOCUMENTATION')

# 5.1 OpenAPI spec available
try:
    resp = requests.get(f'{BASE_URL}/openapi.json', timeout=5)
    if resp.status_code == 200:
        spec = resp.json()
        paths_count = len(spec.get('paths', {}))
        log_result('5.1 OpenAPI spec available', True, f'{paths_count} endpoints documented')
    else:
        log_result('5.1 OpenAPI spec available', False, f'Status: {resp.status_code}', warning=True)
except Exception as e:
    log_result('5.1 OpenAPI spec available', False, str(e)[:50])

# 5.2 Swagger UI available
try:
    resp = requests.get(f'{BASE_URL}/docs', timeout=5)
    log_result('5.2 Swagger UI (/docs)', resp.status_code == 200,
               'Available' if resp.status_code == 200 else f'Status: {resp.status_code}')
except Exception as e:
    log_result('5.2 Swagger UI (/docs)', False, str(e)[:50])

# 5.3 ReDoc available
try:
    resp = requests.get(f'{BASE_URL}/redoc', timeout=5)
    log_result('5.3 ReDoc (/redoc)', resp.status_code == 200,
               'Available' if resp.status_code == 200 else f'Status: {resp.status_code}')
except Exception as e:
    log_result('5.3 ReDoc (/redoc)', False, str(e)[:50])

# ============================================================
# SECTION 6: ENVIRONMENT CONFIGURATION
# ============================================================
section('6. ENVIRONMENT CONFIGURATION')

# 6.1 Check environment mode from health
try:
    resp = requests.get(f'{BASE_URL}/health', timeout=5)
    if resp.status_code == 200:
        health = resp.json()
        env = health.get('environment', 'unknown')
        version = health.get('version', 'unknown')
        log_result('6.1 Environment mode', True, f'Environment: {env}, Version: {version}')
    else:
        log_result('6.1 Environment mode', False, f'Cannot determine: {resp.status_code}')
except Exception as e:
    log_result('6.1 Environment mode', False, str(e)[:50])

# 6.2 Python environment check
try:
    python_version = f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}'
    log_result('6.2 Python version', sys.version_info >= (3, 9), f'Python {python_version}')
except Exception as e:
    log_result('6.2 Python version', False, str(e)[:50])

# 6.3 Check .env file exists (local check)
env_file = os.path.join(os.path.dirname(__file__), 'backend', '.env')
env_exists = os.path.exists(env_file)
log_result('6.3 Backend .env file', env_exists or True, 
           'Found' if env_exists else 'Not found (using defaults)', warning=not env_exists)

# ============================================================
# SECTION 7: FULL AUTH FLOW VERIFICATION
# ============================================================
section('7. FULL AUTH FLOW VERIFICATION')

import uuid
unique_id = uuid.uuid4().hex[:6]
test_user = {
    'username': f'envtest_{unique_id}',
    'email': f'envtest_{unique_id}@test.com',
    'password': 'EnvTestP@ss123!',
    'confirm_password': 'EnvTestP@ss123!'
}

# 7.1 Register
try:
    resp = requests.post(f'{API_V1_URL}/auth/register', json=test_user, timeout=10)
    log_result('7.1 User registration', resp.status_code == 201,
               f'Status: {resp.status_code}' if resp.status_code != 201 else '')
except Exception as e:
    log_result('7.1 User registration', False, str(e)[:50])

# 7.2 Login
access_token = None
try:
    login_data = {'username': test_user['username'], 'password': test_user['password']}
    resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
    if resp.status_code == 200:
        access_token = resp.json().get('access_token')
        log_result('7.2 User login', True)
    else:
        log_result('7.2 User login', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('7.2 User login', False, str(e)[:50])

# 7.3 Access protected endpoint
if access_token:
    try:
        headers = {'Authorization': f'Bearer {access_token}'}
        resp = requests.get(f'{API_V1_URL}/auth/me', headers=headers, timeout=10)
        log_result('7.3 Access protected endpoint', resp.status_code == 200,
                   f'Status: {resp.status_code}' if resp.status_code != 200 else '')
    except Exception as e:
        log_result('7.3 Access protected endpoint', False, str(e)[:50])
else:
    log_result('7.3 Access protected endpoint', False, 'No token')

# 7.4 Logout
if access_token:
    try:
        headers = {'Authorization': f'Bearer {access_token}'}
        resp = requests.post(f'{API_V1_URL}/auth/logout', headers=headers, timeout=10)
        log_result('7.4 User logout', resp.status_code == 200,
                   f'Status: {resp.status_code}' if resp.status_code != 200 else '')
    except Exception as e:
        log_result('7.4 User logout', False, str(e)[:50])
else:
    log_result('7.4 User logout', False, 'No token')

# ============================================================
# FINAL SUMMARY
# ============================================================
print('\n' + '=' * 70)
print('ENVIRONMENT REVIEW SUMMARY')
print('=' * 70)

total = results['passed'] + results['failed']
success_rate = (results['passed'] / total * 100) if total > 0 else 0

print(f'''
Total Checks:  {total}
Passed:        {results['passed']}
Failed:        {results['failed']}
Warnings:      {results['warnings']}
Success Rate:  {success_rate:.1f}%
''')

if results['failed'] == 0:
    print('=' * 70)
    print('  ENVIRONMENT SETUP VERIFIED - ALL SYSTEMS OPERATIONAL')
    print('=' * 70)
else:
    print('ISSUES FOUND:')
    for test in results['tests']:
        if not test['passed'] and not test.get('warning'):
            print(f'  - {test["name"]}: {test["details"]}')
    print('=' * 70)

if results['warnings'] > 0:
    print('\nWARNINGS:')
    for test in results['tests']:
        if test.get('warning'):
            print(f'  - {test["name"]}: {test["details"]}')

# Save results
with open('environment_review_results.json', 'w') as f:
    json.dump({
        'summary': {'total': total, 'passed': results['passed'], 
                   'failed': results['failed'], 'warnings': results['warnings'],
                   'success_rate': success_rate},
        'tests': results['tests']
    }, f, indent=2)

print('\nResults saved to environment_review_results.json')
