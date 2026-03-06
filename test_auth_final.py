"""
FINAL Authentication Security E2E Test Suite
Tests ALL auth flows: Register, Login, Logout, Forgot Password, Reset Password
"""
import requests
import json
import uuid
import time

BASE_URL = 'http://localhost:8000'
API_V1_URL = f'{BASE_URL}/api/v1'

print('=' * 70)
print('FINAL AUTHENTICATION SECURITY E2E TEST SUITE')
print('=' * 70)

# Generate unique test user
unique_id = uuid.uuid4().hex[:8]
test_user = {
    'username': f'final_{unique_id}',
    'email': f'final_{unique_id}@test.com',
    'password': 'SecureP@ss123!',
    'confirm_password': 'SecureP@ss123!'
}

results = {'passed': 0, 'failed': 0, 'tests': []}

def log_result(name, passed, details=''):
    status = 'PASS' if passed else 'FAIL'
    results['tests'].append({'name': name, 'passed': passed, 'details': details})
    results['passed' if passed else 'failed'] += 1
    print(f'[{status}] {name}')
    if details and not passed:
        print(f'       {details}')

def section(title):
    print(f'\n{"="*70}\n{title}\n{"="*70}')

# ============================================================
# SECTION 1: SIGNUP/REGISTRATION
# ============================================================
section('1. SIGNUP / REGISTRATION TESTS')

# 1.1 Register new user - success
try:
    resp = requests.post(f'{API_V1_URL}/auth/register', json=test_user, timeout=10)
    log_result('1.1 Register new user', resp.status_code == 201, 
               f'Status: {resp.status_code}' if resp.status_code != 201 else '')
except Exception as e:
    log_result('1.1 Register new user', False, str(e))

# 1.2 Reject duplicate username
try:
    resp = requests.post(f'{API_V1_URL}/auth/register', json=test_user, timeout=10)
    log_result('1.2 Reject duplicate username', resp.status_code == 400,
               f'Status: {resp.status_code}' if resp.status_code != 400 else '')
except Exception as e:
    log_result('1.2 Reject duplicate username', False, str(e))

# 1.3 Reject weak password (too short)
try:
    weak_user = {**test_user, 'username': f'weak1_{unique_id}', 'email': f'weak1_{unique_id}@test.com',
                 'password': '12345', 'confirm_password': '12345'}
    resp = requests.post(f'{API_V1_URL}/auth/register', json=weak_user, timeout=10)
    log_result('1.3 Reject weak password (too short)', resp.status_code == 422,
               f'Status: {resp.status_code}' if resp.status_code != 422 else '')
except Exception as e:
    log_result('1.3 Reject weak password (too short)', False, str(e))

# 1.4 Reject password mismatch
try:
    mismatch_user = {**test_user, 'username': f'mismatch_{unique_id}', 'email': f'mismatch_{unique_id}@test.com',
                     'password': 'SecureP@ss123!', 'confirm_password': 'DifferentP@ss123!'}
    resp = requests.post(f'{API_V1_URL}/auth/register', json=mismatch_user, timeout=10)
    log_result('1.4 Reject password mismatch', resp.status_code == 422,
               f'Status: {resp.status_code}' if resp.status_code != 422 else '')
except Exception as e:
    log_result('1.4 Reject password mismatch', False, str(e))

# 1.5 Reject invalid email format
try:
    invalid_email_user = {**test_user, 'username': f'invalidemail_{unique_id}', 'email': 'not-an-email',
                          'password': 'SecureP@ss123!', 'confirm_password': 'SecureP@ss123!'}
    resp = requests.post(f'{API_V1_URL}/auth/register', json=invalid_email_user, timeout=10)
    log_result('1.5 Reject invalid email format', resp.status_code == 422,
               f'Status: {resp.status_code}' if resp.status_code != 422 else '')
except Exception as e:
    log_result('1.5 Reject invalid email format', False, str(e))

# ============================================================
# SECTION 2: LOGIN TESTS
# ============================================================
section('2. LOGIN TESTS')

access_token = None

# 2.1 Login with valid credentials
try:
    login_data = {'username': test_user['username'], 'password': test_user['password']}
    resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
    if resp.status_code == 200:
        token_data = resp.json()
        access_token = token_data.get('access_token')
        log_result('2.1 Login with valid credentials', True)
    else:
        log_result('2.1 Login with valid credentials', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('2.1 Login with valid credentials', False, str(e))

# 2.2 Reject wrong password
try:
    login_data = {'username': test_user['username'], 'password': 'WrongPassword123!'}
    resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
    log_result('2.2 Reject wrong password', resp.status_code == 401,
               f'Status: {resp.status_code}' if resp.status_code != 401 else '')
except Exception as e:
    log_result('2.2 Reject wrong password', False, str(e))

# 2.3 Reject non-existent user
try:
    login_data = {'username': 'nonexistent_xyz_999', 'password': 'AnyPassword123!'}
    resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
    log_result('2.3 Reject non-existent user', resp.status_code == 401,
               f'Status: {resp.status_code}' if resp.status_code != 401 else '')
except Exception as e:
    log_result('2.3 Reject non-existent user', False, str(e))

# 2.4 Token contains expected fields
try:
    login_data = {'username': test_user['username'], 'password': test_user['password']}
    resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        has_fields = all(k in data for k in ['access_token', 'token_type', 'expires_in'])
        log_result('2.4 Token response has required fields', has_fields,
                   f'Missing fields' if not has_fields else '')
        access_token = data.get('access_token')  # Update token
    else:
        log_result('2.4 Token response has required fields', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('2.4 Token response has required fields', False, str(e))

# ============================================================
# SECTION 3: PROTECTED ENDPOINTS (SECURITY)
# ============================================================
section('3. PROTECTED ENDPOINTS & SECURITY')

# 3.1 Access /me with valid token
try:
    headers = {'Authorization': f'Bearer {access_token}'}
    resp = requests.get(f'{API_V1_URL}/auth/me', headers=headers, timeout=10)
    log_result('3.1 Access /me with valid token', resp.status_code == 200,
               f'Status: {resp.status_code}' if resp.status_code != 200 else '')
except Exception as e:
    log_result('3.1 Access /me with valid token', False, str(e))

# 3.2 Reject /me without token
try:
    resp = requests.get(f'{API_V1_URL}/auth/me', timeout=10)
    log_result('3.2 Reject /me without token', resp.status_code == 403,
               f'Status: {resp.status_code}' if resp.status_code != 403 else '')
except Exception as e:
    log_result('3.2 Reject /me without token', False, str(e))

# 3.3 Reject /me with invalid token
try:
    headers = {'Authorization': 'Bearer invalid_token_xyz123'}
    resp = requests.get(f'{API_V1_URL}/auth/me', headers=headers, timeout=10)
    log_result('3.3 Reject /me with invalid token', resp.status_code == 401,
               f'Status: {resp.status_code}' if resp.status_code != 401 else '')
except Exception as e:
    log_result('3.3 Reject /me with invalid token', False, str(e))

# 3.4 Reject /me with malformed token
try:
    headers = {'Authorization': 'Bearer '}
    resp = requests.get(f'{API_V1_URL}/auth/me', headers=headers, timeout=10)
    log_result('3.4 Reject /me with empty token', resp.status_code in [401, 403],
               f'Status: {resp.status_code}' if resp.status_code not in [401, 403] else '')
except Exception as e:
    log_result('3.4 Reject /me with empty token', False, str(e))

# ============================================================
# SECTION 4: LOGOUT TESTS
# ============================================================
section('4. LOGOUT TESTS')

# 4.1 Logout with valid token
logout_token = access_token
try:
    headers = {'Authorization': f'Bearer {logout_token}'}
    resp = requests.post(f'{API_V1_URL}/auth/logout', headers=headers, timeout=10)
    log_result('4.1 Logout with valid token', resp.status_code == 200,
               f'Status: {resp.status_code}' if resp.status_code != 200 else '')
except Exception as e:
    log_result('4.1 Logout with valid token', False, str(e))

# 4.2 Token blacklisted after logout
try:
    headers = {'Authorization': f'Bearer {logout_token}'}
    resp = requests.get(f'{API_V1_URL}/auth/me', headers=headers, timeout=10)
    log_result('4.2 Token blacklisted after logout', resp.status_code == 401,
               f'Status: {resp.status_code} - Token should be rejected' if resp.status_code != 401 else '')
except Exception as e:
    log_result('4.2 Token blacklisted after logout', False, str(e))

# 4.3 Can login again after logout
try:
    login_data = {'username': test_user['username'], 'password': test_user['password']}
    resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
    if resp.status_code == 200:
        access_token = resp.json().get('access_token')
        log_result('4.3 Can login again after logout', True)
    else:
        log_result('4.3 Can login again after logout', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('4.3 Can login again after logout', False, str(e))

# ============================================================
# SECTION 5: FORGOT PASSWORD TESTS
# ============================================================
section('5. FORGOT PASSWORD TESTS')

# 5.1 Request reset for existing email
try:
    resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                        json={'email': test_user['email']}, timeout=10)
    log_result('5.1 Request reset for existing email', resp.status_code == 200,
               f'Status: {resp.status_code}' if resp.status_code != 200 else '')
except Exception as e:
    log_result('5.1 Request reset for existing email', False, str(e))

# 5.2 Same response for non-existent email (no enumeration)
try:
    resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                        json={'email': 'nonexistent_xyz@example.com'}, timeout=10)
    log_result('5.2 No email enumeration (same response)', resp.status_code == 200,
               f'Status: {resp.status_code} - Should return 200 for security' if resp.status_code != 200 else '')
except Exception as e:
    log_result('5.2 No email enumeration (same response)', False, str(e))

# 5.3 Reject invalid email format
try:
    resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                        json={'email': 'not-an-email'}, timeout=10)
    log_result('5.3 Reject invalid email format', resp.status_code == 422,
               f'Status: {resp.status_code}' if resp.status_code != 422 else '')
except Exception as e:
    log_result('5.3 Reject invalid email format', False, str(e))

# ============================================================
# SECTION 6: RESET PASSWORD TESTS
# ============================================================
section('6. RESET PASSWORD TESTS')

# 6.1 Reject invalid reset token
try:
    resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                        json={'token': 'invalid_token', 'new_password': 'NewSecureP@ss123!', 
                              'confirm_password': 'NewSecureP@ss123!'}, timeout=10)
    log_result('6.1 Reject invalid reset token', resp.status_code == 400,
               f'Status: {resp.status_code}' if resp.status_code != 400 else '')
except Exception as e:
    log_result('6.1 Reject invalid reset token', False, str(e))

# 6.2 Reject password mismatch in reset
try:
    resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                        json={'token': 'any_token', 'new_password': 'NewSecureP@ss123!', 
                              'confirm_password': 'DifferentP@ss123!'}, timeout=10)
    log_result('6.2 Reject password mismatch in reset', resp.status_code == 422,
               f'Status: {resp.status_code}' if resp.status_code != 422 else '')
except Exception as e:
    log_result('6.2 Reject password mismatch in reset', False, str(e))

# 6.3 Reject weak password in reset
try:
    resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                        json={'token': 'any_token', 'new_password': '12345', 
                              'confirm_password': '12345'}, timeout=10)
    log_result('6.3 Reject weak password in reset', resp.status_code == 422,
               f'Status: {resp.status_code}' if resp.status_code != 422 else '')
except Exception as e:
    log_result('6.3 Reject weak password in reset', False, str(e))

# 6.4 Validate reset token endpoint
try:
    resp = requests.get(f'{API_V1_URL}/auth/reset-password/validate/invalid_token', timeout=10)
    log_result('6.4 Validate reset token rejects invalid', resp.status_code in [400, 404],
               f'Status: {resp.status_code}' if resp.status_code not in [400, 404] else '')
except Exception as e:
    log_result('6.4 Validate reset token rejects invalid', False, str(e))

# ============================================================
# SECTION 7: ADDITIONAL SECURITY TESTS
# ============================================================
section('7. ADDITIONAL SECURITY TESTS')

# 7.1 API docs available (development mode)
try:
    resp = requests.get(f'{BASE_URL}/openapi.json', timeout=10)
    log_result('7.1 OpenAPI spec available', resp.status_code == 200,
               f'Status: {resp.status_code}' if resp.status_code != 200 else '')
except Exception as e:
    log_result('7.1 OpenAPI spec available', False, str(e))

# 7.2 Health check endpoint works
try:
    resp = requests.get(f'{BASE_URL}/health', timeout=10)
    log_result('7.2 Health check endpoint', resp.status_code == 200,
               f'Status: {resp.status_code}' if resp.status_code != 200 else '')
except Exception as e:
    log_result('7.2 Health check endpoint', False, str(e))

# 7.3 Auth endpoints in API spec
try:
    resp = requests.get(f'{BASE_URL}/openapi.json', timeout=10)
    if resp.status_code == 200:
        spec = resp.json()
        paths = spec.get('paths', {})
        required = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/logout',
                   '/api/v1/auth/forgot-password', '/api/v1/auth/reset-password']
        all_present = all(p in paths for p in required)
        log_result('7.3 All auth endpoints documented', all_present,
                   f'Missing endpoints' if not all_present else '')
    else:
        log_result('7.3 All auth endpoints documented', False, 'Could not fetch spec')
except Exception as e:
    log_result('7.3 All auth endpoints documented', False, str(e))

# ============================================================
# FINAL SUMMARY
# ============================================================
print('\n' + '=' * 70)
print('FINAL TEST SUMMARY')
print('=' * 70)
total = results['passed'] + results['failed']
success_rate = (results['passed'] / total * 100) if total > 0 else 0

print(f'''
Total Tests:  {total}
Passed:       {results['passed']}
Failed:       {results['failed']}
Success Rate: {success_rate:.1f}%
''')

if results['failed'] == 0:
    print('=' * 70)
    print('  ALL TESTS PASSED - AUTHENTICATION SYSTEM FULLY OPERATIONAL')
    print('=' * 70)
else:
    print('FAILED TESTS:')
    for test in results['tests']:
        if not test['passed']:
            print(f'  - {test["name"]}: {test["details"]}')
    print('=' * 70)

# Save results
with open('auth_final_test_results.json', 'w') as f:
    json.dump({
        'summary': {'total': total, 'passed': results['passed'], 
                   'failed': results['failed'], 'success_rate': success_rate},
        'tests': results['tests']
    }, f, indent=2)

print('\nResults saved to auth_final_test_results.json')
