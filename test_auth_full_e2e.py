"""
Comprehensive Authentication End-to-End Test Suite
Tests: Signup, Login, Authenticated Access, Logout, Password Reset, Token Blacklisting
"""

import requests
import json
import uuid
import time
from datetime import datetime

BASE_URL = 'http://localhost:8000'
API_V1_URL = f'{BASE_URL}/api/v1'

# Test results tracking
results = {'passed': 0, 'failed': 0, 'tests': []}

def log_result(name, passed, details=''):
    """Log test result"""
    status = '✅ PASSED' if passed else '❌ FAILED'
    results['tests'].append({'name': name, 'passed': passed, 'details': details})
    results['passed' if passed else 'failed'] += 1
    print(f'{status}: {name}')
    if details:
        print(f'   Details: {details}')

def main():
    print('=' * 70)
    print('COMPREHENSIVE AUTH E2E TEST - Full Flow Testing')
    print(f'Started: {datetime.now()}')
    print(f'Target: {BASE_URL}')
    print('=' * 70)

    # Generate unique user for testing
    unique_id = uuid.uuid4().hex[:8]
    test_user = {
        'username': f'e2e_test_{unique_id}',
        'email': f'e2e_test_{unique_id}@test.com',
        'password': 'TestPassword123!',
        'confirm_password': 'TestPassword123!'
    }

    # Test 1: Register new user
    print('\n📋 TEST 1: User Registration')
    print('-' * 50)
    try:
        resp = requests.post(f'{API_V1_URL}/auth/register', json=test_user, timeout=10)
        if resp.status_code == 201:
            user_data = resp.json()
            log_result('User Registration', True, 
                      f'User ID: {user_data.get("id")}, Username: {user_data.get("username")}')
        elif resp.status_code == 400 and 'already registered' in resp.text.lower():
            log_result('User Registration', True, 'User already exists (acceptable)')
        else:
            log_result('User Registration', False, 
                      f'Status: {resp.status_code}, Response: {resp.text[:200]}')
    except Exception as e:
        log_result('User Registration', False, f'Exception: {str(e)}')

    # Test 2: Login with valid credentials
    print('\n📋 TEST 2: Login with Valid Credentials')
    print('-' * 50)
    access_token = None
    try:
        login_data = {
            'username': test_user['username'],
            'password': test_user['password']
        }
        resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
        if resp.status_code == 200:
            token_data = resp.json()
            access_token = token_data.get('access_token')
            log_result('Login with Valid Credentials', True, 
                      f'Token Type: {token_data.get("token_type")}, Expires In: {token_data.get("expires_in")}s')
        else:
            log_result('Login with Valid Credentials', False, 
                      f'Status: {resp.status_code}, Response: {resp.text[:200]}')
    except Exception as e:
        log_result('Login with Valid Credentials', False, f'Exception: {str(e)}')

    # Test 3: Access /me endpoint with valid token
    print('\n📋 TEST 3: Access Protected Endpoint (/me)')
    print('-' * 50)
    if access_token:
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            resp = requests.get(f'{API_V1_URL}/auth/me', headers=headers, timeout=10)
            if resp.status_code == 200:
                user_info = resp.json()
                log_result('Access /me with Token', True, 
                          f'Username: {user_info.get("username")}, Email: {user_info.get("email")}')
            else:
                log_result('Access /me with Token', False, 
                          f'Status: {resp.status_code}, Response: {resp.text[:200]}')
        except Exception as e:
            log_result('Access /me with Token', False, f'Exception: {str(e)}')
    else:
        log_result('Access /me with Token', False, 'No token available from login')

    # Test 4: Logout with valid token
    print('\n📋 TEST 4: Logout')
    print('-' * 50)
    if access_token:
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            resp = requests.post(f'{API_V1_URL}/auth/logout', headers=headers, timeout=10)
            if resp.status_code == 200:
                logout_data = resp.json()
                log_result('Logout', True, f'Message: {logout_data.get("message")}')
            else:
                log_result('Logout', False, 
                          f'Status: {resp.status_code}, Response: {resp.text[:200]}')
        except Exception as e:
            log_result('Logout', False, f'Exception: {str(e)}')
    else:
        log_result('Logout', False, 'No token available from login')

    # Test 5: Access /me after logout (token should be blacklisted)
    print('\n📋 TEST 5: Access /me After Logout (Token Blacklist)')
    print('-' * 50)
    if access_token:
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            resp = requests.get(f'{API_V1_URL}/auth/me', headers=headers, timeout=10)
            if resp.status_code == 401:
                log_result('Token Blacklisted After Logout', True, 
                          'Token correctly rejected after logout')
            else:
                log_result('Token Blacklisted After Logout', False, 
                          f'Status: {resp.status_code} - Token should have been rejected')
        except Exception as e:
            log_result('Token Blacklisted After Logout', False, f'Exception: {str(e)}')
    else:
        log_result('Token Blacklisted After Logout', False, 'No token available')

    # Test 6: Login again to get fresh token
    print('\n📋 TEST 6: Login Again After Logout')
    print('-' * 50)
    try:
        login_data = {
            'username': test_user['username'],
            'password': test_user['password']
        }
        resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
        if resp.status_code == 200:
            token_data = resp.json()
            log_result('Login After Logout', True, 'Successfully logged in again')
        else:
            log_result('Login After Logout', False, 
                      f'Status: {resp.status_code}, Response: {resp.text[:200]}')
    except Exception as e:
        log_result('Login After Logout', False, f'Exception: {str(e)}')

    # Test 7: Login with invalid credentials
    print('\n📋 TEST 7: Login with Invalid Credentials')
    print('-' * 50)
    try:
        login_data = {
            'username': test_user['username'],
            'password': 'WrongPassword123!'
        }
        resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
        if resp.status_code == 401:
            log_result('Reject Invalid Password', True, 'Correctly rejected wrong password')
        else:
            log_result('Reject Invalid Password', False, 
                      f'Status: {resp.status_code} - Should have been 401')
    except Exception as e:
        log_result('Reject Invalid Password', False, f'Exception: {str(e)}')

    # Test 8: Login with non-existent user
    print('\n📋 TEST 8: Login with Non-Existent User')
    print('-' * 50)
    try:
        login_data = {
            'username': 'nonexistent_user_12345',
            'password': 'AnyPassword123!'
        }
        resp = requests.post(f'{API_V1_URL}/auth/login', json=login_data, timeout=10)
        if resp.status_code == 401:
            log_result('Reject Non-Existent User', True, 'Correctly rejected unknown user')
        else:
            log_result('Reject Non-Existent User', False, 
                      f'Status: {resp.status_code} - Should have been 401')
    except Exception as e:
        log_result('Reject Non-Existent User', False, f'Exception: {str(e)}')

    # Test 9: Register with weak password (too short)
    print('\n📋 TEST 9: Register with Weak Password (Too Short)')
    print('-' * 50)
    try:
        weak_user = {
            'username': f'weak_{unique_id}',
            'email': f'weak_{unique_id}@test.com',
            'password': '123',
            'confirm_password': '123'
        }
        resp = requests.post(f'{API_V1_URL}/auth/register', json=weak_user, timeout=10)
        if resp.status_code == 422:
            log_result('Reject Weak Password (Short)', True, 'Correctly rejected short password')
        else:
            log_result('Reject Weak Password (Short)', False, 
                      f'Status: {resp.status_code} - Should have been 422')
    except Exception as e:
        log_result('Reject Weak Password (Short)', False, f'Exception: {str(e)}')

    # Test 10: Register with weak password (no complexity)
    print('\n📋 TEST 10: Register with Weak Password (No Complexity)')
    print('-' * 50)
    try:
        weak_user = {
            'username': f'weak2_{unique_id}',
            'email': f'weak2_{unique_id}@test.com',
            'password': 'simplepassword',
            'confirm_password': 'simplepassword'
        }
        resp = requests.post(f'{API_V1_URL}/auth/register', json=weak_user, timeout=10)
        if resp.status_code == 422:
            log_result('Reject Weak Password (No Complexity)', True, 
                      'Correctly rejected password without complexity')
        else:
            log_result('Reject Weak Password (No Complexity)', False, 
                      f'Status: {resp.status_code} - Should have been 422')
    except Exception as e:
        log_result('Reject Weak Password (No Complexity)', False, f'Exception: {str(e)}')

    # Test 11: Register with password mismatch
    print('\n📋 TEST 11: Register with Password Mismatch')
    print('-' * 50)
    try:
        mismatch_user = {
            'username': f'mismatch_{unique_id}',
            'email': f'mismatch_{unique_id}@test.com',
            'password': 'TestPassword123!',
            'confirm_password': 'DifferentPassword123!'
        }
        resp = requests.post(f'{API_V1_URL}/auth/register', json=mismatch_user, timeout=10)
        if resp.status_code == 422:
            log_result('Reject Password Mismatch', True, 'Correctly rejected mismatched passwords')
        else:
            log_result('Reject Password Mismatch', False, 
                      f'Status: {resp.status_code} - Should have been 422')
    except Exception as e:
        log_result('Reject Password Mismatch', False, f'Exception: {str(e)}')

    # Test 12: Register with duplicate user
    print('\n📋 TEST 12: Register Duplicate User')
    print('-' * 50)
    try:
        resp = requests.post(f'{API_V1_URL}/auth/register', json=test_user, timeout=10)
        if resp.status_code == 400:
            log_result('Reject Duplicate User', True, 'Correctly rejected duplicate registration')
        else:
            log_result('Reject Duplicate User', False, 
                      f'Status: {resp.status_code} - Should have been 400')
    except Exception as e:
        log_result('Reject Duplicate User', False, f'Exception: {str(e)}')

    # Test 13: Register with invalid email
    print('\n📋 TEST 13: Register with Invalid Email')
    print('-' * 50)
    try:
        invalid_email_user = {
            'username': f'invalid_email_{unique_id}',
            'email': 'not-a-valid-email',
            'password': 'TestPassword123!',
            'confirm_password': 'TestPassword123!'
        }
        resp = requests.post(f'{API_V1_URL}/auth/register', json=invalid_email_user, timeout=10)
        if resp.status_code == 422:
            log_result('Reject Invalid Email', True, 'Correctly rejected invalid email format')
        else:
            log_result('Reject Invalid Email', False, 
                      f'Status: {resp.status_code} - Should have been 422')
    except Exception as e:
        log_result('Reject Invalid Email', False, f'Exception: {str(e)}')

    # Test 14: Access protected endpoint without token
    print('\n📋 TEST 14: Access Protected Endpoint Without Token')
    print('-' * 50)
    try:
        resp = requests.get(f'{API_V1_URL}/auth/me', timeout=10)
        if resp.status_code == 403:
            log_result('Reject Unauthenticated Access', True, 
                      'Correctly rejected request without token')
        else:
            log_result('Reject Unauthenticated Access', False, 
                      f'Status: {resp.status_code} - Should have been 403')
    except Exception as e:
        log_result('Reject Unauthenticated Access', False, f'Exception: {str(e)}')

    # Test 15: Access protected endpoint with invalid token
    print('\n📋 TEST 15: Access Protected Endpoint With Invalid Token')
    print('-' * 50)
    try:
        headers = {'Authorization': 'Bearer invalid_token_12345'}
        resp = requests.get(f'{API_V1_URL}/auth/me', headers=headers, timeout=10)
        if resp.status_code == 401:
            log_result('Reject Invalid Token', True, 'Correctly rejected invalid token')
        else:
            log_result('Reject Invalid Token', False, 
                      f'Status: {resp.status_code} - Should have been 401')
    except Exception as e:
        log_result('Reject Invalid Token', False, f'Exception: {str(e)}')

    # Test 16: Forgot Password Request
    print('\n📋 TEST 16: Forgot Password Request')
    print('-' * 50)
    try:
        resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                            json={'email': test_user['email']}, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            log_result('Forgot Password Request', True, 
                      f'Message: {data.get("message", "")[:50]}...')
        else:
            log_result('Forgot Password Request', False, 
                      f'Status: {resp.status_code}, Response: {resp.text[:200]}')
    except Exception as e:
        log_result('Forgot Password Request', False, f'Exception: {str(e)}')

    # Test 17: Forgot Password Security (Non-existent Email)
    print('\n📋 TEST 17: Forgot Password Security (Non-existent Email)')
    print('-' * 50)
    try:
        resp = requests.post(f'{API_V1_URL}/auth/forgot-password', 
                            json={'email': 'nonexistent_user@test.com'}, timeout=10)
        if resp.status_code == 200:
            log_result('Forgot Password Security', True, 
                      'Returns 200 for non-existent email (prevents enumeration)')
        else:
            log_result('Forgot Password Security', False, 
                      f'Status: {resp.status_code} - Should be 200 to prevent enumeration')
    except Exception as e:
        log_result('Forgot Password Security', False, f'Exception: {str(e)}')

    # Test 18: Validate Invalid Reset Token
    print('\n📋 TEST 18: Validate Invalid Reset Token')
    print('-' * 50)
    try:
        resp = requests.get(f'{API_V1_URL}/auth/reset-password/validate/invalid_token_123', 
                           timeout=10)
        if resp.status_code == 400:
            log_result('Validate Invalid Reset Token', True, 
                      'Invalid token correctly rejected')
        else:
            log_result('Validate Invalid Reset Token', False, 
                      f'Status: {resp.status_code} - Should be 400')
    except Exception as e:
        log_result('Validate Invalid Reset Token', False, f'Exception: {str(e)}')

    # Test 19: Reset Password with Invalid Token
    print('\n📋 TEST 19: Reset Password with Invalid Token')
    print('-' * 50)
    try:
        reset_data = {
            'token': 'invalid_token_123',
            'new_password': 'NewPassword123!',
            'confirm_password': 'NewPassword123!'
        }
        resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                            json=reset_data, timeout=10)
        if resp.status_code == 400:
            log_result('Reset Password Invalid Token', True, 
                      'Correctly rejected invalid token')
        else:
            log_result('Reset Password Invalid Token', False, 
                      f'Status: {resp.status_code} - Should be 400')
    except Exception as e:
        log_result('Reset Password Invalid Token', False, f'Exception: {str(e)}')

    # Test 20: Reset Password with Password Mismatch
    print('\n📋 TEST 20: Reset Password with Password Mismatch')
    print('-' * 50)
    try:
        reset_data = {
            'token': 'any_token',
            'new_password': 'NewPassword123!',
            'confirm_password': 'DifferentPassword123!'
        }
        resp = requests.post(f'{API_V1_URL}/auth/reset-password', 
                            json=reset_data, timeout=10)
        if resp.status_code == 422:
            log_result('Reset Password Mismatch', True, 
                      'Correctly rejected mismatched passwords')
        else:
            log_result('Reset Password Mismatch', False, 
                      f'Status: {resp.status_code} - Should be 422')
    except Exception as e:
        log_result('Reset Password Mismatch', False, f'Exception: {str(e)}')

    # Summary
    print('\n' + '=' * 70)
    print('TEST SUMMARY')
    print('=' * 70)
    print(f'Total Tests: {results["passed"] + results["failed"]}')
    print(f'✅ Passed:   {results["passed"]}')
    print(f'❌ Failed:   {results["failed"]}')
    success_rate = (results["passed"] / (results["passed"] + results["failed"]) * 100) if (results["passed"] + results["failed"]) > 0 else 0
    print(f'Success Rate: {success_rate:.1f}%')
    
    if results['failed'] == 0:
        print('\n🎉 ALL TESTS PASSED!')
    else:
        print('\n⚠️  Some tests failed. See details above.')
    
    print(f'\nCompleted: {datetime.now()}')
    print('=' * 70)

    # Save results to JSON file
    with open('auth_full_e2e_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    print(f'\nResults saved to: auth_full_e2e_test_results.json')

    return results['failed'] == 0

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
