"""
Comprehensive Reset Password E2E Test
Tests the complete password reset flow including:
- Requesting password reset
- Validating reset tokens
- Resetting password with valid token
- Login with new password
- Edge cases and security validations
"""
import requests
import json
import uuid
import time

BASE_URL = 'http://localhost:8000'
API_V1_URL = f'{BASE_URL}/api/v1'

print('=' * 70)
print('RESET PASSWORD E2E TEST - Complete Flow')
print('=' * 70)

# Generate unique test user
unique_id = uuid.uuid4().hex[:8]
test_user = {
    'username': f'resetpwd_{unique_id}',
    'email': f'resetpwd_{unique_id}@test.com',
    'password': 'OldPassword123!',
    'confirm_password': 'OldPassword123!'
}
new_password = 'NewPassword456!'

results = {'passed': 0, 'failed': 0, 'tests': []}

def log_result(name, passed, details=''):
    status = 'PASSED' if passed else 'FAILED'
    results['tests'].append({'name': name, 'passed': passed, 'details': details})
    results['passed' if passed else 'failed'] += 1
    print(f'{status}: {name}')
    if details:
        print(f'   Details: {details}')

# =======================
# SETUP: Create test user
# =======================
print('\n[SETUP] Creating test user for password reset testing...')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/register', json=test_user, timeout=10)
    if resp.status_code == 201:
        print(f'Test user created: {test_user["username"]} ({test_user["email"]})')
    else:
        print(f'Setup warning: {resp.status_code} - {resp.text[:100]}')
except Exception as e:
    print(f'Setup error: {e}')

# =======================
# SECTION 1: REQUEST PASSWORD RESET
# =======================
print('\n' + '=' * 70)
print('SECTION 1: REQUEST PASSWORD RESET')
print('=' * 70)

# Test 1.1: Request password reset for test user
print('\n[TEST 1.1] Request Password Reset')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                        json={'email': test_user['email']}, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 200:
        data = resp.json()
        log_result('Request Password Reset', True, f'Message: {data.get("message", "")[:50]}')
    else:
        log_result('Request Password Reset', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Request Password Reset', False, f'Exception: {str(e)}')

# =======================
# SECTION 2: GET RESET TOKEN (Test Endpoint)
# =======================
print('\n' + '=' * 70)
print('SECTION 2: GET RESET TOKEN')
print('=' * 70)

reset_token = None

# Test 2.1: Get reset token from test endpoint
print('\n[TEST 2.1] Get Reset Token (Test Endpoint)')
print('-' * 50)
try:
    resp = requests.get(f'{API_V1_URL}/auth/test/reset-token/{test_user["email"]}', timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 200:
        token_data = resp.json()
        reset_token = token_data.get('token')
        log_result('Get Reset Token', True, f'Token received (length: {len(reset_token) if reset_token else 0})')
    else:
        log_result('Get Reset Token', False, f'Status: {resp.status_code}, Response: {resp.text[:200]}')
except Exception as e:
    log_result('Get Reset Token', False, f'Exception: {str(e)}')

# =======================
# SECTION 3: VALIDATE RESET TOKEN
# =======================
print('\n' + '=' * 70)
print('SECTION 3: VALIDATE RESET TOKEN')
print('=' * 70)

# Test 3.1: Validate the reset token
print('\n[TEST 3.1] Validate Reset Token')
print('-' * 50)
if reset_token:
    try:
        resp = requests.get(f'{API_V1_URL}/auth/reset-password/validate/{reset_token}', timeout=10)
        print(f'Status: {resp.status_code}')
        if resp.status_code == 200:
            data = resp.json()
            log_result('Validate Reset Token', True, f'Valid: {data.get("valid")}, Expires in: {data.get("expires_in_minutes")} min')
        else:
            log_result('Validate Reset Token', False, f'Status: {resp.status_code}')
    except Exception as e:
        log_result('Validate Reset Token', False, f'Exception: {str(e)}')
else:
    log_result('Validate Reset Token', False, 'No token available')

# Test 3.2: Validate invalid token
print('\n[TEST 3.2] Reject Invalid Token')
print('-' * 50)
try:
    resp = requests.get(f'{API_V1_URL}/auth/reset-password/validate/invalid_token_xyz', timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 400:
        log_result('Reject Invalid Token', True, 'Correctly rejected invalid token')
    else:
        log_result('Reject Invalid Token', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Reject Invalid Token', False, f'Exception: {str(e)}')

# =======================
# SECTION 4: RESET PASSWORD VALIDATION
# =======================
print('\n' + '=' * 70)
print('SECTION 4: RESET PASSWORD VALIDATION')
print('=' * 70)

# Test 4.1: Reset with invalid token
print('\n[TEST 4.1] Reset with Invalid Token')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                        json={
                            'token': 'invalid_token_xyz',
                            'new_password': 'NewPassword123!',
                            'confirm_password': 'NewPassword123!'
                        }, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 400:
        log_result('Reject Invalid Reset Token', True, 'Correctly rejected invalid token')
    else:
        log_result('Reject Invalid Reset Token', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Reject Invalid Reset Token', False, f'Exception: {str(e)}')

# Test 4.2: Reset with password mismatch
print('\n[TEST 4.2] Reset with Password Mismatch')
print('-' * 50)
if reset_token:
    try:
        resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                            json={
                                'token': reset_token,
                                'new_password': 'NewPassword123!',
                                'confirm_password': 'DifferentPassword123!'
                            }, timeout=10)
        print(f'Status: {resp.status_code}')
        if resp.status_code == 422:
            log_result('Reject Password Mismatch', True, 'Correctly validated password match')
        else:
            log_result('Reject Password Mismatch', False, f'Status: {resp.status_code}')
    except Exception as e:
        log_result('Reject Password Mismatch', False, f'Exception: {str(e)}')
else:
    log_result('Reject Password Mismatch', False, 'No token available')

# Test 4.3: Reset with weak password
print('\n[TEST 4.3] Reset with Weak Password')
print('-' * 50)
if reset_token:
    try:
        resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                            json={
                                'token': reset_token,
                                'new_password': '12345',
                                'confirm_password': '12345'
                            }, timeout=10)
        print(f'Status: {resp.status_code}')
        if resp.status_code == 422:
            log_result('Reject Weak Password', True, 'Password strength validation working')
        else:
            log_result('Reject Weak Password', False, f'Status: {resp.status_code}')
    except Exception as e:
        log_result('Reject Weak Password', False, f'Exception: {str(e)}')
else:
    log_result('Reject Weak Password', False, 'No token available')

# =======================
# SECTION 5: SUCCESSFUL PASSWORD RESET
# =======================
print('\n' + '=' * 70)
print('SECTION 5: SUCCESSFUL PASSWORD RESET')
print('=' * 70)

# Test 5.1: Reset password with valid token
print('\n[TEST 5.1] Reset Password with Valid Token')
print('-' * 50)
if reset_token:
    try:
        resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                            json={
                                'token': reset_token,
                                'new_password': new_password,
                                'confirm_password': new_password
                            }, timeout=10)
        print(f'Status: {resp.status_code}')
        if resp.status_code == 200:
            data = resp.json()
            log_result('Reset Password Success', True, f'Message: {data.get("message", "")[:50]}')
        else:
            log_result('Reset Password Success', False, f'Status: {resp.status_code}, Response: {resp.text[:200]}')
    except Exception as e:
        log_result('Reset Password Success', False, f'Exception: {str(e)}')
else:
    log_result('Reset Password Success', False, 'No token available')

# Test 5.2: Token should be invalidated after use
print('\n[TEST 5.2] Token Invalidated After Use')
print('-' * 50)
if reset_token:
    try:
        resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                            json={
                                'token': reset_token,
                                'new_password': 'AnotherPassword123!',
                                'confirm_password': 'AnotherPassword123!'
                            }, timeout=10)
        print(f'Status: {resp.status_code}')
        if resp.status_code == 400:
            log_result('Token Invalidated After Use', True, 'Token correctly rejected after use')
        else:
            log_result('Token Invalidated After Use', False, f'Status: {resp.status_code} - Token should have been invalidated')
    except Exception as e:
        log_result('Token Invalidated After Use', False, f'Exception: {str(e)}')
else:
    log_result('Token Invalidated After Use', False, 'No token available')

# =======================
# SECTION 6: VERIFY NEW PASSWORD WORKS
# =======================
print('\n' + '=' * 70)
print('SECTION 6: VERIFY NEW PASSWORD WORKS')
print('=' * 70)

# Test 6.1: Login with old password should fail
print('\n[TEST 6.1] Old Password Should Fail')
print('-' * 50)
try:
    login_data = {
        'username': test_user['username'],
        'password': test_user['password']  # Old password
    }
    resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 401:
        log_result('Old Password Rejected', True, 'Old password correctly rejected')
    else:
        log_result('Old Password Rejected', False, f'Status: {resp.status_code} - Old password should not work')
except Exception as e:
    log_result('Old Password Rejected', False, f'Exception: {str(e)}')

# Test 6.2: Login with new password should succeed
print('\n[TEST 6.2] New Password Should Work')
print('-' * 50)
try:
    login_data = {
        'username': test_user['username'],
        'password': new_password
    }
    resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 200:
        token_data = resp.json()
        log_result('New Password Works', True, f'Successfully logged in with new password')
        
        # Verify token works
        headers = {'Authorization': f'Bearer {token_data.get("access_token")}'}
        resp2 = requests.get(f'{API_V1_URL}/auth/me', headers=headers, timeout=10)
        if resp2.status_code == 200:
            print(f'   Token verified - user: {resp2.json().get("username")}')
    else:
        log_result('New Password Works', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('New Password Works', False, f'Exception: {str(e)}')

# =======================
# SECTION 7: EDGE CASES
# =======================
print('\n' + '=' * 70)
print('SECTION 7: EDGE CASES')
print('=' * 70)

# Test 7.1: Request reset for non-existent email (no enumeration)
print('\n[TEST 7.1] Non-Existent Email (No Enumeration)')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                        json={'email': 'nonexistent_xyz_999@test.com'}, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 200:
        log_result('No Email Enumeration', True, 'Same response for unknown emails - secure')
    else:
        log_result('No Email Enumeration', False, f'Status: {resp.status_code} - May leak user existence')
except Exception as e:
    log_result('No Email Enumeration', False, f'Exception: {str(e)}')

# Test 7.2: Invalid email format
print('\n[TEST 7.2] Invalid Email Format')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                        json={'email': 'not-a-valid-email'}, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 422:
        log_result('Reject Invalid Email', True, 'Email format validation working')
    else:
        log_result('Reject Invalid Email', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Reject Invalid Email', False, f'Exception: {str(e)}')

# Test 7.3: Missing token in reset request
print('\n[TEST 7.3] Missing Token in Reset Request')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                        json={
                            'new_password': 'NewPassword123!',
                            'confirm_password': 'NewPassword123!'
                        }, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 422:
        log_result('Reject Missing Token', True, 'Correctly requires token')
    else:
        log_result('Reject Missing Token', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Reject Missing Token', False, f'Exception: {str(e)}')

# =======================
# SUMMARY
# =======================
print('\n' + '=' * 70)
print('TEST SUMMARY')
print('=' * 70)
total = results['passed'] + results['failed']
print(f'Total Tests: {total}')
print(f'Passed: {results["passed"]}')
print(f'Failed: {results["failed"]}')
if total > 0:
    print(f'Success Rate: {(results["passed"]/total)*100:.1f}%')
print('=' * 70)

if results['failed'] == 0:
    print('\nALL TESTS PASSED! Reset password flow is working correctly.')
else:
    print(f'\n{results["failed"]} TEST(S) FAILED:')
    for test in results['tests']:
        if not test['passed']:
            print(f'  - {test["name"]}: {test["details"]}')
print('=' * 70)

# Export results
with open('reset_password_e2e_results.json', 'w') as f:
    json.dump({
        'summary': {
            'total': total,
            'passed': results['passed'],
            'failed': results['failed'],
            'success_rate': (results['passed']/total)*100 if total > 0 else 0
        },
        'tests': results['tests']
    }, f, indent=2)
print('\nResults saved to reset_password_e2e_results.json')
