"""
Comprehensive Authentication E2E Test Suite
Tests: Register, Login, Logout, Forgot Password, Reset Password
"""
import requests
import json
import uuid
import time

BASE_URL = 'http://localhost:8000'
API_V1_URL = f'{BASE_URL}/api/v1'

print('=' * 70)
print('COMPREHENSIVE AUTHENTICATION E2E TEST SUITE')
print('=' * 70)

# Generate unique test user
unique_id = uuid.uuid4().hex[:8]
test_user = {
    'username': f'fulltest_{unique_id}',
    'email': f'fulltest_{unique_id}@test.com',
    'password': 'TestPassword123!',
    'confirm_password': 'TestPassword123!'
}

results = {'passed': 0, 'failed': 0, 'tests': []}

def log_result(name, passed, details=''):
    status = 'PASSED' if passed else 'FAILED'
    results['tests'].append({'name': name, 'passed': passed, 'details': details})
    results['passed' if passed else 'failed'] += 1
    print(f'{status}: {name}')
    if details:
        print(f'   Details: {details}')

# =======================
# SECTION 1: REGISTRATION
# =======================
print('\n' + '=' * 70)
print('SECTION 1: USER REGISTRATION')
print('=' * 70)

# Test 1.1: Register new user
print('\n[TEST 1.1] Register New User')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/register', json=test_user, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 201:
        user_data = resp.json()
        log_result('Register New User', True, f'User ID: {user_data.get("id")}, Username: {user_data.get("username")}')
    else:
        log_result('Register New User', False, f'Status: {resp.status_code}, Response: {resp.text[:200]}')
except Exception as e:
    log_result('Register New User', False, f'Exception: {str(e)}')

# Test 1.2: Reject duplicate registration
print('\n[TEST 1.2] Reject Duplicate Registration')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/register', json=test_user, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 400:
        log_result('Reject Duplicate User', True, 'Correctly rejected duplicate registration')
    else:
        log_result('Reject Duplicate User', False, f'Status: {resp.status_code} - Should have been 400')
except Exception as e:
    log_result('Reject Duplicate User', False, f'Exception: {str(e)}')

# Test 1.3: Reject weak password
print('\n[TEST 1.3] Reject Weak Password Registration')
print('-' * 50)
try:
    weak_user = {
        'username': f'weak_{unique_id}',
        'email': f'weak_{unique_id}@test.com',
        'password': '12345',
        'confirm_password': '12345'
    }
    resp = requests.post(f'{API_V1_URL}/auth/register', json=weak_user, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 422:
        log_result('Reject Weak Password', True, 'Password validation working')
    else:
        log_result('Reject Weak Password', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Reject Weak Password', False, f'Exception: {str(e)}')

# Test 1.4: Reject password mismatch
print('\n[TEST 1.4] Reject Password Mismatch')
print('-' * 50)
try:
    mismatch_user = {
        'username': f'mismatch_{unique_id}',
        'email': f'mismatch_{unique_id}@test.com',
        'password': 'TestPassword123!',
        'confirm_password': 'DifferentPassword123!'
    }
    resp = requests.post(f'{API_V1_URL}/auth/register', json=mismatch_user, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 422:
        log_result('Reject Password Mismatch', True, 'Password mismatch detected')
    else:
        log_result('Reject Password Mismatch', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Reject Password Mismatch', False, f'Exception: {str(e)}')

# =======================
# SECTION 2: LOGIN
# =======================
print('\n' + '=' * 70)
print('SECTION 2: USER LOGIN')
print('=' * 70)

access_token = None

# Test 2.1: Login with valid credentials
print('\n[TEST 2.1] Login with Valid Credentials')
print('-' * 50)
try:
    login_data = {
        'username': test_user['username'],
        'password': test_user['password']
    }
    resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 200:
        token_data = resp.json()
        access_token = token_data.get('access_token')
        log_result('Login with Valid Credentials', True, f'Token Type: {token_data.get("token_type")}')
    else:
        log_result('Login with Valid Credentials', False, f'Status: {resp.status_code}, Response: {resp.text[:200]}')
except Exception as e:
    log_result('Login with Valid Credentials', False, f'Exception: {str(e)}')

# Test 2.2: Reject invalid password
print('\n[TEST 2.2] Reject Invalid Password')
print('-' * 50)
try:
    login_data = {
        'username': test_user['username'],
        'password': 'WrongPassword123!'
    }
    resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 401:
        log_result('Reject Invalid Password', True, 'Correctly rejected wrong password')
    else:
        log_result('Reject Invalid Password', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Reject Invalid Password', False, f'Exception: {str(e)}')

# Test 2.3: Reject non-existent user
print('\n[TEST 2.3] Reject Non-Existent User')
print('-' * 50)
try:
    login_data = {
        'username': 'nonexistent_user_xyz_999',
        'password': 'AnyPassword123!'
    }
    resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 401:
        log_result('Reject Non-Existent User', True, 'Correctly rejected unknown user')
    else:
        log_result('Reject Non-Existent User', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Reject Non-Existent User', False, f'Exception: {str(e)}')

# =======================
# SECTION 3: PROTECTED ENDPOINTS
# =======================
print('\n' + '=' * 70)
print('SECTION 3: PROTECTED ENDPOINTS')
print('=' * 70)

# Test 3.1: Access /me with valid token
print('\n[TEST 3.1] Access /me with Valid Token')
print('-' * 50)
if access_token:
    try:
        headers = {'Authorization': f'Bearer {access_token}'}
        resp = requests.get(f'{API_V1_URL}/auth/me', headers=headers, timeout=10)
        print(f'Status: {resp.status_code}')
        if resp.status_code == 200:
            user_info = resp.json()
            log_result('Access /me with Token', True, f'Username: {user_info.get("username")}')
        else:
            log_result('Access /me with Token', False, f'Status: {resp.status_code}')
    except Exception as e:
        log_result('Access /me with Token', False, f'Exception: {str(e)}')
else:
    log_result('Access /me with Token', False, 'No token available from login')

# Test 3.2: Reject access without token
print('\n[TEST 3.2] Reject Access Without Token')
print('-' * 50)
try:
    resp = requests.get(f'{API_V1_URL}/auth/me', timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 403:
        log_result('Reject Access Without Token', True, 'Correctly rejected unauthenticated request')
    else:
        log_result('Reject Access Without Token', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Reject Access Without Token', False, f'Exception: {str(e)}')

# Test 3.3: Reject invalid token
print('\n[TEST 3.3] Reject Invalid Token')
print('-' * 50)
try:
    headers = {'Authorization': 'Bearer invalid_token_xyz'}
    resp = requests.get(f'{API_V1_URL}/auth/me', headers=headers, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 401:
        log_result('Reject Invalid Token', True, 'Correctly rejected invalid token')
    else:
        log_result('Reject Invalid Token', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Reject Invalid Token', False, f'Exception: {str(e)}')

# =======================
# SECTION 4: LOGOUT
# =======================
print('\n' + '=' * 70)
print('SECTION 4: LOGOUT')
print('=' * 70)

# Test 4.1: Logout with valid token
print('\n[TEST 4.1] Logout with Valid Token')
print('-' * 50)
if access_token:
    try:
        headers = {'Authorization': f'Bearer {access_token}'}
        resp = requests.post(f'{API_V1_URL}/auth/logout', headers=headers, timeout=10)
        print(f'Status: {resp.status_code}')
        if resp.status_code == 200:
            log_result('Logout', True, 'Logout successful')
        else:
            log_result('Logout', False, f'Status: {resp.status_code}')
    except Exception as e:
        log_result('Logout', False, f'Exception: {str(e)}')
else:
    log_result('Logout', False, 'No token available')

# Test 4.2: Token blacklisted after logout
print('\n[TEST 4.2] Token Blacklisted After Logout')
print('-' * 50)
if access_token:
    try:
        headers = {'Authorization': f'Bearer {access_token}'}
        resp = requests.get(f'{API_V1_URL}/auth/me', headers=headers, timeout=10)
        print(f'Status: {resp.status_code}')
        if resp.status_code == 401:
            log_result('Token Blacklisted After Logout', True, 'Token correctly rejected')
        else:
            log_result('Token Blacklisted After Logout', False, f'Status: {resp.status_code} - Token should have been rejected')
    except Exception as e:
        log_result('Token Blacklisted After Logout', False, f'Exception: {str(e)}')
else:
    log_result('Token Blacklisted After Logout', False, 'No token available')

# =======================
# SECTION 5: FORGOT PASSWORD
# =======================
print('\n' + '=' * 70)
print('SECTION 5: FORGOT PASSWORD')
print('=' * 70)

# Test 5.1: Request password reset for existing user
print('\n[TEST 5.1] Request Password Reset - Existing User')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                        json={'email': test_user['email']}, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 200:
        log_result('Password Reset Request', True, 'Reset request processed')
    else:
        log_result('Password Reset Request', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Password Reset Request', False, f'Exception: {str(e)}')

# Test 5.2: Password reset for non-existent user (no enumeration)
print('\n[TEST 5.2] Password Reset - Non-Existent User')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                        json={'email': 'nonexistent_xyz@example.com'}, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 200:
        log_result('No Email Enumeration', True, 'Same response for unknown emails - secure')
    else:
        log_result('No Email Enumeration', False, f'Status: {resp.status_code} - May leak user existence')
except Exception as e:
    log_result('No Email Enumeration', False, f'Exception: {str(e)}')

# Test 5.3: Reset password with invalid token
print('\n[TEST 5.3] Reset Password - Invalid Token')
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

# Test 5.4: Reset password with invalid email format
print('\n[TEST 5.4] Forgot Password - Invalid Email Format')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                        json={'email': 'not-an-email'}, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 422:
        log_result('Reject Invalid Email Format', True, 'Email validation working')
    else:
        log_result('Reject Invalid Email Format', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Reject Invalid Email Format', False, f'Exception: {str(e)}')

# =======================
# SECTION 6: RE-LOGIN TEST
# =======================
print('\n' + '=' * 70)
print('SECTION 6: RE-LOGIN AFTER LOGOUT')
print('=' * 70)

# Test 6.1: Login again after logout
print('\n[TEST 6.1] Login Again After Logout')
print('-' * 50)
try:
    login_data = {
        'username': test_user['username'],
        'password': test_user['password']
    }
    resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 200:
        new_token_data = resp.json()
        new_access_token = new_token_data.get('access_token')
        log_result('Re-Login After Logout', True, 'Successfully logged in again')
        
        # Verify the new token works
        headers = {'Authorization': f'Bearer {new_access_token}'}
        resp2 = requests.get(f'{API_V1_URL}/auth/me', headers=headers, timeout=10)
        if resp2.status_code == 200:
            log_result('New Token Works', True, 'New token is valid')
        else:
            log_result('New Token Works', False, 'New token should work')
    else:
        log_result('Re-Login After Logout', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Re-Login After Logout', False, f'Exception: {str(e)}')

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
print(f'Success Rate: {(results["passed"]/total)*100:.1f}%')
print('=' * 70)

if results['failed'] == 0:
    print('\nALL TESTS PASSED! Authentication system is working correctly.')
else:
    print(f'\n{results["failed"]} TEST(S) FAILED:')
    for test in results['tests']:
        if not test['passed']:
            print(f'  - {test["name"]}: {test["details"]}')
print('=' * 70)

# Export results
with open('auth_e2e_test_results.json', 'w') as f:
    json.dump({
        'summary': {
            'total': total,
            'passed': results['passed'],
            'failed': results['failed'],
            'success_rate': (results['passed']/total)*100
        },
        'tests': results['tests']
    }, f, indent=2)
print('\nResults saved to auth_e2e_test_results.json')
