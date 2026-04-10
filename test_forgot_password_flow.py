t"""
Comprehensive Forgot Password Flow E2E Test
"""
import requests
import json
import uuid

BASE_URL = 'http://localhost:8000'
API_V1_URL = f'{BASE_URL}/api/v1'

print('=' * 70)
print('FORGOT PASSWORD FLOW - E2E TEST')
print('=' * 70)

results = {'passed': 0, 'failed': 0}

def log_result(name, passed, details=''):
    status = 'PASSED' if passed else 'FAILED'
    results['passed' if passed else 'failed'] += 1
    print(f'{status}: {name}')
    if details:
        print(f'   Details: {details}')

# First, create a test user to use for password reset
unique_id = uuid.uuid4().hex[:8]
test_user = {
    'username': f'pwdreset_test_{unique_id}',
    'email': f'pwdreset_test_{unique_id}@test.com',
    'password': 'TestPassword123!',
    'confirm_password': 'TestPassword123!'
}

print('\n[SETUP] Creating test user...')
try:
    resp = requests.post(f'{API_V1_URL}/auth/register', json=test_user, timeout=10)
    if resp.status_code == 201:
        print(f'Test user created: {test_user["email"]}')
    else:
        print(f'User registration: {resp.status_code} - {resp.text[:100]}')
except Exception as e:
    print(f'Setup error: {e}')

# Test 1: Request password reset for existing user
print('\n[TEST 1] Request Password Reset - Valid Email')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                        json={'email': test_user['email']},
                        timeout=10)
    print(f'Status: {resp.status_code}')
    print(f'Response: {resp.text}')
    if resp.status_code == 200:
        log_result('Password Reset Request', True, 'Reset request processed')
    else:
        log_result('Password Reset Request', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Password Reset Request', False, f'Exception: {str(e)}')

# Test 2: Request password reset for non-existing user
print('\n[TEST 2] Request Password Reset - Non-existent Email')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                        json={'email': 'nonexistent_user_xyz@example.com'},
                        timeout=10)
    print(f'Status: {resp.status_code}')
    print(f'Response: {resp.text}')
    # Should still return 200 to prevent email enumeration
    if resp.status_code == 200:
        log_result('Non-existent Email (No Enumeration)', True, 'Good - same response for unknown emails')
    else:
        log_result('Non-existent Email (No Enumeration)', False, f'Status: {resp.status_code} - may leak user existence')
except Exception as e:
    log_result('Non-existent Email (No Enumeration)', False, f'Exception: {str(e)}')

# Test 3: Reset password with invalid token
print('\n[TEST 3] Reset Password - Invalid Token')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                        json={
                            'token': 'invalid_token_123', 
                            'new_password': 'NewPassword123!', 
                            'confirm_password': 'NewPassword123!'
                        },
                        timeout=10)
    print(f'Status: {resp.status_code}')
    print(f'Response: {resp.text}')
    if resp.status_code in [400, 401, 404]:
        log_result('Invalid Token Rejection', True, 'Correctly rejected invalid token')
    else:
        log_result('Invalid Token Rejection', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Invalid Token Rejection', False, f'Exception: {str(e)}')

# Test 4: Request password reset with invalid email format
print('\n[TEST 4] Request Password Reset - Invalid Email Format')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                        json={'email': 'not-an-email'},
                        timeout=10)
    print(f'Status: {resp.status_code}')
    print(f'Response: {resp.text}')
    if resp.status_code == 422:
        log_result('Invalid Email Format Rejection', True, 'Correctly validated email format')
    else:
        log_result('Invalid Email Format Rejection', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Invalid Email Format Rejection', False, f'Exception: {str(e)}')

# Test 5: Reset password with mismatched passwords
print('\n[TEST 5] Reset Password - Password Mismatch')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                        json={
                            'token': 'some_token', 
                            'new_password': 'Password123!', 
                            'confirm_password': 'DifferentPassword123!'
                        },
                        timeout=10)
    print(f'Status: {resp.status_code}')
    print(f'Response: {resp.text}')
    if resp.status_code == 422:
        log_result('Password Mismatch Rejection', True, 'Correctly validated password match')
    else:
        log_result('Password Mismatch Rejection', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Password Mismatch Rejection', False, f'Exception: {str(e)}')

# Test 6: Reset password with weak password
print('\n[TEST 6] Reset Password - Weak Password')
print('-' * 50)
try:
    resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                        json={
                            'token': 'some_token', 
                            'new_password': '123456', 
                            'confirm_password': '123456'
                        },
                        timeout=10)
    print(f'Status: {resp.status_code}')
    print(f'Response: {resp.text}')
    if resp.status_code == 422:
        log_result('Weak Password Rejection', True, 'Correctly validated password strength')
    else:
        log_result('Weak Password Rejection', False, f'Status: {resp.status_code}')
except Exception as e:
    log_result('Weak Password Rejection', False, f'Exception: {str(e)}')

# Test 7: Check API docs for forgot password endpoints
print('\n[TEST 7] Check API Documentation')
print('-' * 50)
try:
    resp = requests.get(f'{BASE_URL}/openapi.json', timeout=10)
    if resp.status_code == 200:
        api_spec = resp.json()
        paths = api_spec.get('paths', {})
        forgot_pwd_endpoint = '/api/v1/auth/forgot-password' in paths
        reset_pwd_endpoint = '/api/v1/auth/reset-password' in paths
        if forgot_pwd_endpoint and reset_pwd_endpoint:
            log_result('API Endpoints Documented', True, 'Both endpoints present in OpenAPI spec')
        else:
            log_result('API Endpoints Documented', False, f'forgot: {forgot_pwd_endpoint}, reset: {reset_pwd_endpoint}')
    else:
        log_result('API Endpoints Documented', False, f'Cannot fetch API spec: {resp.status_code}')
except Exception as e:
    log_result('API Endpoints Documented', False, f'Exception: {str(e)}')

# Summary
print('\n' + '=' * 70)
print('TEST SUMMARY')
print('=' * 70)
print(f'Total Tests: {results["passed"] + results["failed"]}')
print(f'Passed: {results["passed"]}')
print(f'Failed: {results["failed"]}')
if results['failed'] == 0:
    print('\nALL TESTS PASSED!')
else:
    print(f'\n{results["failed"]} TEST(S) FAILED - See details above')
print('=' * 70)
