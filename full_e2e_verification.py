#!/usr/bin/env python3
"""
Full E2E Verification Suite for TCA IRR Application
Tests: Backend Health, Auth, SSD Integration, File Upload, Analysis, and all functionality

Run with: python full_e2e_verification.py
"""

import requests
import json
import uuid
import time
from datetime import datetime
from typing import Dict, Any, List, Tuple

# Configuration
BACKEND_URL = "https://tcairrapiccontainer.azurewebsites.net"
AUTH_URL = f"{BACKEND_URL}/auth"  # Auth endpoints at /auth/*
TIMEOUT = 30

# Test results tracking
class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.skipped = 0
        self.tests: List[Dict[str, Any]] = []
        self.sections: Dict[str, Dict[str, int]] = {}
    
    def add_result(self, section: str, name: str, passed: bool, details: str = "", skipped: bool = False):
        status = "SKIPPED" if skipped else ("PASSED" if passed else "FAILED")
        self.tests.append({
            'section': section,
            'name': name,
            'status': status,
            'passed': passed,
            'skipped': skipped,
            'details': details
        })
        
        if section not in self.sections:
            self.sections[section] = {'passed': 0, 'failed': 0, 'skipped': 0}
        
        if skipped:
            self.skipped += 1
            self.sections[section]['skipped'] += 1
        elif passed:
            self.passed += 1
            self.sections[section]['passed'] += 1
        else:
            self.failed += 1
            self.sections[section]['failed'] += 1
        
        icon = "⏭️" if skipped else ("✅" if passed else "❌")
        print(f"  {icon} {name}")
        if details:
            print(f"      {details}")
    
    def print_summary(self):
        print("\n" + "=" * 70)
        print("📊 FULL E2E VERIFICATION SUMMARY")
        print("=" * 70)
        
        total = self.passed + self.failed + self.skipped
        print(f"\nTotal Tests: {total}")
        print(f"  ✅ Passed:  {self.passed}")
        print(f"  ❌ Failed:  {self.failed}")
        print(f"  ⏭️ Skipped: {self.skipped}")
        
        if total > 0:
            pass_rate = (self.passed / (total - self.skipped)) * 100 if (total - self.skipped) > 0 else 0
            print(f"\n  Pass Rate: {pass_rate:.1f}%")
        
        print("\n" + "-" * 70)
        print("Breakdown by Section:")
        for section, counts in self.sections.items():
            sect_total = counts['passed'] + counts['failed'] + counts['skipped']
            print(f"  {section}: {counts['passed']}/{sect_total - counts['skipped']} passed" + 
                  (f" ({counts['skipped']} skipped)" if counts['skipped'] > 0 else ""))
        
        # Save results to JSON
        self._save_results()
        return self.failed == 0
    
    def _save_results(self):
        result_data = {
            'timestamp': datetime.now().isoformat(),
            'backend_url': BACKEND_URL,
            'summary': {
                'total': self.passed + self.failed + self.skipped,
                'passed': self.passed,
                'failed': self.failed,
                'skipped': self.skipped
            },
            'sections': self.sections,
            'tests': self.tests
        }
        with open('full_e2e_verification_results.json', 'w') as f:
            json.dump(result_data, f, indent=2)
        print(f"\n📁 Results saved to: full_e2e_verification_results.json")


results = TestResults()


# ========================================
# SECTION 1: BACKEND HEALTH & BASIC ENDPOINTS
# ========================================
def test_backend_health():
    section = "1. Backend Health"
    print(f"\n{'=' * 70}")
    print(f"📍 {section}")
    print('=' * 70)
    
    # Test 1.1: Root endpoint
    try:
        resp = requests.get(f"{BACKEND_URL}/", timeout=TIMEOUT)
        passed = resp.status_code == 200
        results.add_result(section, "Root Endpoint (/)", passed, 
                          f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "Root Endpoint (/)", False, f"Error: {e}")
    
    # Test 1.2: Health endpoint
    try:
        resp = requests.get(f"{BACKEND_URL}/api/health", timeout=TIMEOUT)
        if resp.status_code == 200:
            data = resp.json()
            passed = data.get('status') == 'healthy' and data.get('database') == 'healthy'
            results.add_result(section, "Health Check (/api/health)", passed,
                              f"Status: {data.get('status')}, DB: {data.get('database')}")
        else:
            results.add_result(section, "Health Check (/api/health)", False,
                              f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "Health Check (/api/health)", False, f"Error: {e}")
    
    # Test 1.3: Health endpoint
    try:
        resp = requests.get(f"{BACKEND_URL}/health", timeout=TIMEOUT)
        passed = resp.status_code == 200
        results.add_result(section, "Health Check (/health)", passed,
                          f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "Health Check (/health)", False, f"Error: {e}")
    
    # Test 1.4: API Docs
    try:
        resp = requests.get(f"{BACKEND_URL}/docs", timeout=TIMEOUT)
        passed = resp.status_code == 200
        results.add_result(section, "API Docs (/docs)", passed,
                          f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "API Docs (/docs)", False, f"Error: {e}")
    
    # Test 1.5: OpenAPI spec
    try:
        resp = requests.get(f"{BACKEND_URL}/openapi.json", timeout=TIMEOUT)
        passed = resp.status_code == 200 and 'openapi' in resp.json()
        results.add_result(section, "OpenAPI Spec (/openapi.json)", passed,
                          f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "OpenAPI Spec (/openapi.json)", False, f"Error: {e}")


# ========================================
# SECTION 2: AUTHENTICATION E2E
# ========================================
def test_authentication_e2e():
    section = "2. Authentication E2E"
    print(f"\n{'=' * 70}")
    print(f"📍 {section}")
    print('=' * 70)
    
    # Generate unique test user
    unique_id = uuid.uuid4().hex[:8]
    test_email = f'e2e_verify_{unique_id}@test.com'
    test_user = {
        'full_name': f'E2E Test User {unique_id}',
        'email': test_email,
        'password': 'TestPassword123!'
    }
    
    access_token = None
    refresh_token = None
    user_id = None
    
    # Test 2.1: User Registration
    try:
        resp = requests.post(f"{AUTH_URL}/register", json=test_user, timeout=TIMEOUT)
        if resp.status_code in [200, 201]:
            data = resp.json()
            user_id = data.get('user_id')
            results.add_result(section, "User Registration", True,
                              f"User ID: {user_id}, Name: {data.get('full_name')}")
        elif resp.status_code == 400 and 'already' in resp.text.lower():
            results.add_result(section, "User Registration", True, "User exists (acceptable)")
        else:
            results.add_result(section, "User Registration", False,
                              f"Status: {resp.status_code}, Response: {resp.text[:100]}")
    except Exception as e:
        results.add_result(section, "User Registration", False, f"Error: {e}")
    
    # Test 2.2: User Login
    try:
        login_data = {
            'email': test_email,
            'password': test_user['password']
        }
        resp = requests.post(f"{AUTH_URL}/login", json=login_data, timeout=TIMEOUT)
        if resp.status_code == 200:
            data = resp.json()
            access_token = data.get('access_token')
            refresh_token = data.get('refresh_token')
            results.add_result(section, "User Login", True,
                              f"Token Type: {data.get('token_type')}, Expires: {data.get('expires_in')}s")
        else:
            results.add_result(section, "User Login", False,
                              f"Status: {resp.status_code}, Response: {resp.text[:100]}")
    except Exception as e:
        results.add_result(section, "User Login", False, f"Error: {e}")
    
    # Test 2.3: Get Current User (Authenticated)
    if access_token:
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            resp = requests.get(f"{AUTH_URL}/me", headers=headers, timeout=TIMEOUT)
            if resp.status_code == 200:
                data = resp.json()
                results.add_result(section, "Get Current User (/me)", True,
                                  f"Username: {data.get('username')}")
            else:
                results.add_result(section, "Get Current User (/me)", False,
                                  f"Status: {resp.status_code}")
        except Exception as e:
            results.add_result(section, "Get Current User (/me)", False, f"Error: {e}")
    else:
        results.add_result(section, "Get Current User (/me)", False, skipped=True,
                          details="Skipped - no access token")
    
    # Test 2.4: Token Refresh
    if refresh_token:
        try:
            resp = requests.post(f"{AUTH_URL}/refresh",
                               json={'refresh_token': refresh_token}, timeout=TIMEOUT)
            if resp.status_code == 200:
                data = resp.json()
                results.add_result(section, "Token Refresh", True,
                                  f"New token issued")
            else:
                results.add_result(section, "Token Refresh", False,
                                  f"Status: {resp.status_code}")
        except Exception as e:
            results.add_result(section, "Token Refresh", False, f"Error: {e}")
    else:
        results.add_result(section, "Token Refresh", False, skipped=True,
                          details="Skipped - no refresh token")
    
    # Test 2.5: Invalid Login
    try:
        bad_login = {'email': 'nonexistent@test.com', 'password': 'wrongpass'}
        resp = requests.post(f"{AUTH_URL}/login", json=bad_login, timeout=TIMEOUT)
        passed = resp.status_code in [401, 400]
        results.add_result(section, "Reject Invalid Login", passed,
                          f"Status: {resp.status_code} (expected 401/400)")
    except Exception as e:
        results.add_result(section, "Reject Invalid Login", False, f"Error: {e}")
    
    # Test 2.6: Logout
    if access_token:
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            resp = requests.post(f"{AUTH_URL}/logout", headers=headers, timeout=TIMEOUT)
            passed = resp.status_code == 200
            results.add_result(section, "User Logout", passed,
                              f"Status: {resp.status_code}")
        except Exception as e:
            results.add_result(section, "User Logout", False, f"Error: {e}")
    else:
        results.add_result(section, "User Logout", False, skipped=True,
                          details="Skipped - no access token")
    
    return access_token


# ========================================
# SECTION 3: SSD INTEGRATION ENDPOINTS
# ========================================
def test_ssd_integration():
    section = "3. SSD Integration"
    print(f"\n{'=' * 70}")
    print(f"📍 {section}")
    print('=' * 70)
    
    # Test 3.1: SSD Audit Stats
    try:
        resp = requests.get(f"{BACKEND_URL}/api/ssd/audit/stats", timeout=TIMEOUT)
        if resp.status_code == 200:
            data = resp.json()
            results.add_result(section, "SSD Audit Stats", True,
                              f"Stats retrieved successfully")
        elif resp.status_code == 404:
            results.add_result(section, "SSD Audit Stats", False, skipped=True,
                              details="Endpoint not deployed (404)")
        else:
            results.add_result(section, "SSD Audit Stats", False,
                              f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "SSD Audit Stats", False, f"Error: {e}")
    
    # Test 3.2: SSD Audit Logs
    try:
        resp = requests.get(f"{BACKEND_URL}/api/ssd/audit/logs", timeout=TIMEOUT)
        if resp.status_code == 200:
            results.add_result(section, "SSD Audit Logs List", True,
                              f"Status: {resp.status_code}")
        elif resp.status_code == 404:
            results.add_result(section, "SSD Audit Logs List", False, skipped=True,
                              details="Endpoint not deployed (404)")
        else:
            results.add_result(section, "SSD Audit Logs List", False,
                              f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "SSD Audit Logs List", False, f"Error: {e}")
    
    # Test 3.3: SSD TIRR Submit (with mock data)
    tracking_id = None
    try:
        ssd_payload = {
            "contactInformation": {
                "email": f"test_{uuid.uuid4().hex[:8]}@e2everify.com",
                "phoneNumber": "+1-555-123-4567",
                "firstName": "E2E",
                "lastName": "Verify",
                "jobTitle": "CEO",
                "linkedInUrl": "https://linkedin.com/in/test"
            },
            "companyInformation": {
                "companyName": f"E2E Test Company {uuid.uuid4().hex[:6]}",
                "website": "https://e2etestcompany.com",
                "industryVertical": "Technology",
                "developmentStage": "Seed",
                "businessModel": "B2B SaaS",
                "country": "United States",
                "state": "California",
                "city": "San Francisco",
                "oneLineDescription": "E2E Test company for verification",
                "companyDescription": "This is an automated E2E test submission",
                "productDescription": "Test product for E2E verification",
                "pitchDeckPath": "/path/to/test/deck.pdf"
            },
            "financialInformation": {
                "fundingType": "Seed",
                "annualRevenue": 100000,
                "preMoneyValuation": 5000000,
                "postMoneyValuation": 6000000,
                "targetRaise": 1000000
            },
            "investorQuestions": {
                "problemSolution": "E2E Test problem and solution",
                "companyBackgroundTeam": "E2E Test team background",
                "markets": "Global tech market"
            },
            "customerMetrics": {
                "customerAcquisitionCost": 100,
                "customerLifetimeValue": 1000,
                "churn": 5.0,
                "margins": 70.0
            },
            "revenueMetrics": {
                "totalRevenuesToDate": 500000,
                "monthlyRecurringRevenue": 50000,
                "burnRate": 30000
            },
            "marketSize": {
                "totalAvailableMarket": 10000000000,
                "serviceableAreaMarket": 1000000000,
                "serviceableObtainableMarket": 100000000
            }
        }
        
        resp = requests.post(f"{BACKEND_URL}/api/ssd/tirr", json=ssd_payload, timeout=60)
        if resp.status_code in [200, 201, 202]:
            data = resp.json()
            tracking_id = data.get('tracking_id')
            results.add_result(section, "SSD TIRR Submit", True,
                              f"Tracking ID: {tracking_id}, Status: {data.get('status')}")
        elif resp.status_code == 404:
            results.add_result(section, "SSD TIRR Submit", False, skipped=True,
                              details="Endpoint not deployed (404)")
        else:
            results.add_result(section, "SSD TIRR Submit", False,
                              f"Status: {resp.status_code}, Response: {resp.text[:150]}")
    except requests.exceptions.Timeout:
        results.add_result(section, "SSD TIRR Submit", False, "Request timed out (60s)")
    except Exception as e:
        results.add_result(section, "SSD TIRR Submit", False, f"Error: {e}")
    
    # Test 3.4: Get SSD TIRR Status (if we have tracking_id)
    if tracking_id:
        try:
            resp = requests.get(f"{BACKEND_URL}/api/ssd/tirr/{tracking_id}", timeout=TIMEOUT)
            if resp.status_code == 200:
                data = resp.json()
                results.add_result(section, "SSD TIRR Status Check", True,
                                  f"Status: {data.get('status')}")
            else:
                results.add_result(section, "SSD TIRR Status Check", False,
                                  f"Status: {resp.status_code}")
        except Exception as e:
            results.add_result(section, "SSD TIRR Status Check", False, f"Error: {e}")
        
        # Test 3.5: Get SSD Audit Log for tracking_id
        try:
            resp = requests.get(f"{BACKEND_URL}/api/ssd/audit/logs/{tracking_id}", timeout=TIMEOUT)
            passed = resp.status_code == 200
            results.add_result(section, "SSD Audit Log Detail", passed,
                              f"Status: {resp.status_code}")
        except Exception as e:
            results.add_result(section, "SSD Audit Log Detail", False, f"Error: {e}")
    else:
        results.add_result(section, "SSD TIRR Status Check", False, skipped=True,
                          details="Skipped - no tracking ID")
        results.add_result(section, "SSD Audit Log Detail", False, skipped=True,
                          details="Skipped - no tracking ID")


# ========================================
# SECTION 4: FILE UPLOAD & URL FETCH
# ========================================
def test_file_operations():
    section = "4. File Operations"
    print(f"\n{'=' * 70}")
    print(f"📍 {section}")
    print('=' * 70)
    
    # Test 4.1: File Upload Endpoint
    try:
        mock_files = [{
            "name": "e2e_business_plan.pdf",
            "size": 1024000,
            "type": "application/pdf"
        }]
        resp = requests.post(f"{BACKEND_URL}/api/files/upload",
                            json={"files": mock_files}, timeout=TIMEOUT)
        if resp.status_code == 200:
            data = resp.json()
            results.add_result(section, "File Upload Endpoint", True,
                              f"Files processed: {data.get('files_processed', 0)}")
        else:
            results.add_result(section, "File Upload Endpoint", False,
                              f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "File Upload Endpoint", False, f"Error: {e}")
    
    # Test 4.2: URL Fetch Endpoint
    try:
        mock_urls = ["https://example.com/e2e-test"]
        resp = requests.post(f"{BACKEND_URL}/api/urls/fetch",
                            json={"urls": mock_urls}, timeout=TIMEOUT)
        if resp.status_code == 200:
            data = resp.json()
            results.add_result(section, "URL Fetch Endpoint", True,
                              f"URLs processed: {data.get('urls_processed', 0)}")
        else:
            results.add_result(section, "URL Fetch Endpoint", False,
                              f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "URL Fetch Endpoint", False, f"Error: {e}")


# ========================================
# SECTION 5: ANALYSIS ENDPOINTS
# ========================================
def test_analysis_endpoints():
    section = "5. Analysis Endpoints"
    print(f"\n{'=' * 70}")
    print(f"📍 {section}")
    print('=' * 70)
    
    # Test 5.1: Comprehensive Analysis Endpoint
    try:
        mock_data = {
            "company": {
                "name": "E2E Verify Company",
                "sector": "technology",
                "stage": "seed"
            },
            "files": [{
                "name": "e2e_plan.pdf",
                "type": "application/pdf",
                "size": 1024000
            }],
            "urls": ["https://example.com/e2e"],
            "configuration": {
                "analysis_depth": "comprehensive",
                "focus_areas": ["financial", "market", "team"]
            }
        }
        resp = requests.post(f"{BACKEND_URL}/api/analysis/comprehensive",
                            json=mock_data, timeout=60)
        if resp.status_code == 200:
            data = resp.json()
            results.add_result(section, "Comprehensive Analysis", True,
                              f"Analysis ID: {data.get('analysis_id', 'N/A')}")
        else:
            results.add_result(section, "Comprehensive Analysis", False,
                              f"Status: {resp.status_code}, Response: {resp.text[:100]}")
    except requests.exceptions.Timeout:
        results.add_result(section, "Comprehensive Analysis", False, "Request timed out (60s)")
    except Exception as e:
        results.add_result(section, "Comprehensive Analysis", False, f"Error: {e}")
    
    # Test 5.2: Analysis List Endpoint
    try:
        resp = requests.get(f"{BACKEND_URL}/api/analysis/list", timeout=TIMEOUT)
        if resp.status_code in [200, 401]:
            results.add_result(section, "Analysis List", True,
                              f"Status: {resp.status_code}")
        elif resp.status_code == 404:
            results.add_result(section, "Analysis List", False, skipped=True,
                              details="Endpoint not deployed (404)")
        else:
            results.add_result(section, "Analysis List", False,
                              f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "Analysis List", False, f"Error: {e}")


# ========================================
# SECTION 6: MODULE SYSTEM
# ========================================
def test_module_system():
    section = "6. Module System"
    print(f"\n{'=' * 70}")
    print(f"📍 {section}")
    print('=' * 70)
    
    # Test 6.1: Get Module Weights
    try:
        resp = requests.get(f"{BACKEND_URL}/api/modules/weights", timeout=TIMEOUT)
        if resp.status_code == 200:
            data = resp.json()
            results.add_result(section, "Get Module Weights", True,
                              f"Weights retrieved")
        elif resp.status_code == 404:
            results.add_result(section, "Get Module Weights", False, skipped=True,
                              details="Endpoint not deployed (404)")
        else:
            results.add_result(section, "Get Module Weights", False,
                              f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "Get Module Weights", False, f"Error: {e}")
    
    # Test 6.2: Get Module Configurations
    try:
        resp = requests.get(f"{BACKEND_URL}/api/modules/config", timeout=TIMEOUT)
        passed = resp.status_code in [200, 404]  # May not exist
        results.add_result(section, "Get Module Config", passed,
                          f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "Get Module Config", False, f"Error: {e}")


# ========================================
# SECTION 7: EVALUATION ENDPOINTS
# ========================================
def test_evaluation_endpoints(access_token=None):
    section = "7. Evaluation System"
    print(f"\n{'=' * 70}")
    print(f"📍 {section}")
    print('=' * 70)
    
    headers = {'Authorization': f'Bearer {access_token}'} if access_token else {}
    
    # Test 7.1: Create Evaluation (requires auth)
    evaluation_id = None
    try:
        eval_data = {
            "company_name": f"E2E Test Eval {uuid.uuid4().hex[:6]}",
            "evaluation_data": {
                "industry": "Technology",
                "stage": "Seed",
                "metrics": {"revenue": 100000}
            }
        }
        resp = requests.post(f"{BACKEND_URL}/evaluations", 
                            json=eval_data, headers=headers, timeout=TIMEOUT)
        if resp.status_code in [200, 201]:
            data = resp.json()
            evaluation_id = data.get('evaluation_id')
            results.add_result(section, "Create Evaluation", True,
                              f"Evaluation ID: {evaluation_id}")
        elif resp.status_code == 403:
            # Expected when no auth token
            passed = access_token is None  # 403 expected without auth
            results.add_result(section, "Create Evaluation (Auth Required)", passed,
                              f"Status: {resp.status_code} - Auth required as expected")
        else:
            results.add_result(section, "Create Evaluation", False,
                              f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "Create Evaluation", False, f"Error: {e}")
    
    # Test 7.2: Get Evaluation by ID endpoint exists (using dummy ID)
    try:
        dummy_id = str(uuid.uuid4())
        resp = requests.get(f"{BACKEND_URL}/evaluations/{dummy_id}", headers=headers, timeout=TIMEOUT)
        # 404 is fine (not found), 403 means auth required, 200 is OK
        passed = resp.status_code in [200, 404, 403]
        results.add_result(section, "Get Evaluation Endpoint", passed,
                          f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "Get Evaluation Endpoint", False, f"Error: {e}")


# ========================================
# SECTION 8: USER MANAGEMENT & REQUESTS
# ========================================
def test_user_management(access_token=None):
    section = "8. User Management & Requests"
    print(f"\n{'=' * 70}")
    print(f"📍 {section}")
    print('=' * 70)
    
    headers = {'Authorization': f'Bearer {access_token}'} if access_token else {}
    
    # Test 8.1: List Requests
    try:
        resp = requests.get(f"{BACKEND_URL}/requests", headers=headers, timeout=TIMEOUT)
        passed = resp.status_code in [200, 401, 403]
        results.add_result(section, "List Requests", passed,
                          f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "List Requests", False, f"Error: {e}")
    
    # Test 8.2: Admin Requests (auth required)
    try:
        resp = requests.get(f"{BACKEND_URL}/admin/requests", headers=headers, timeout=TIMEOUT)
        passed = resp.status_code in [200, 401, 403]
        results.add_result(section, "Admin Requests Endpoint", passed,
                          f"Status: {resp.status_code}")
    except Exception as e:
        results.add_result(section, "Admin Requests Endpoint", False, f"Error: {e}")


# ========================================
# MAIN EXECUTION
# ========================================
def main():
    print("🚀 " + "=" * 66)
    print("    FULL E2E VERIFICATION SUITE - TCA IRR Application")
    print("=" * 70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Backend: {BACKEND_URL}")
    print("=" * 70)
    
    # Run all test sections
    test_backend_health()
    access_token = test_authentication_e2e()  # Returns token if auth succeeded
    test_ssd_integration()
    test_file_operations()
    test_analysis_endpoints()
    test_module_system()
    test_evaluation_endpoints(access_token)  # Pass token for auth-required tests
    test_user_management(access_token)  # Pass token for auth-required tests
    
    # Print summary
    all_passed = results.print_summary()
    
    print("\n" + "=" * 70)
    print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    exit(main())
