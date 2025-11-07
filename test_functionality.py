#!/usr/bin/env python3
"""
Comprehensive functionality test for TCA IRR App
Tests backend API endpoints and file upload functionality
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3001"


def test_health_endpoint():
    """Test the health endpoint"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Health endpoint - OK")
            print(f"   Status: {data.get('status')}")
            print(f"   Database: {data.get('database')}")
            return True
        else:
            print(f"❌ Health endpoint failed - Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False


def test_file_upload_endpoint():
    """Test file upload endpoint"""
    try:
        # Mock file upload data
        mock_files = [{
            "name": "business_plan.pdf",
            "size": 1024000,
            "type": "application/pdf"
        }, {
            "name":
            "financials.xlsx",
            "size":
            512000,
            "type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }, {
            "name":
            "presentation.pptx",
            "size":
            2048000,
            "type":
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        }]

        response = requests.post(f"{BACKEND_URL}/api/files/upload",
                                 json={"files": mock_files},
                                 timeout=10)

        if response.status_code == 200:
            data = response.json()
            print("✅ File upload endpoint - OK")
            print(f"   Files processed: {data.get('files_processed', 0)}")
            print(f"   Status: {data.get('status')}")
            return True
        else:
            print(
                f"❌ File upload endpoint failed - Status: {response.status_code}"
            )
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ File upload endpoint error: {e}")
        return False


def test_url_fetch_endpoint():
    """Test URL fetch endpoint"""
    try:
        mock_urls = [
            "https://example.com/business-plan",
            "https://example.com/financial-data"
        ]

        response = requests.post(f"{BACKEND_URL}/api/urls/fetch",
                                 json={"urls": mock_urls},
                                 timeout=10)

        if response.status_code == 200:
            data = response.json()
            print("✅ URL fetch endpoint - OK")
            print(f"   URLs processed: {data.get('urls_processed', 0)}")
            print(f"   Status: {data.get('status')}")
            return True
        else:
            print(
                f"❌ URL fetch endpoint failed - Status: {response.status_code}"
            )
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ URL fetch endpoint error: {e}")
        return False


def test_comprehensive_analysis_endpoint():
    """Test comprehensive analysis endpoint"""
    try:
        mock_data = {
            "company": {
                "name": "Test Company",
                "sector": "tech",
                "stage": "series_a"
            },
            "files": [{
                "name": "business_plan.pdf",
                "type": "application/pdf",
                "size": 1024000
            }, {
                "name": "financials.xlsx",
                "type":
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "size": 512000
            }],
            "urls": ["https://example.com/company-info"],
            "configuration": {
                "analysis_depth": "comprehensive",
                "focus_areas": ["financial", "market", "team"]
            }
        }

        response = requests.post(f"{BACKEND_URL}/api/analysis/comprehensive",
                                 json=mock_data,
                                 timeout=15)

        if response.status_code == 200:
            data = response.json()
            print("✅ Comprehensive analysis endpoint - OK")
            print(f"   Analysis ID: {data.get('analysis_id')}")
            print(f"   Status: {data.get('status')}")
            return True
        else:
            print(
                f"❌ Comprehensive analysis endpoint failed - Status: {response.status_code}"
            )
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Comprehensive analysis endpoint error: {e}")
        return False


def test_frontend_accessibility():
    """Test frontend accessibility"""
    try:
        # Test main page
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print("✅ Frontend main page - OK")
        else:
            print(
                f"❌ Frontend main page failed - Status: {response.status_code}"
            )
            return False

        # Test analysis page
        response = requests.get(f"{FRONTEND_URL}/analysis", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend analysis page - OK")
            return True
        else:
            print(
                f"❌ Frontend analysis page failed - Status: {response.status_code}"
            )
            return False
    except Exception as e:
        print(f"❌ Frontend accessibility error: {e}")
        return False


def main():
    """Run all tests"""
    print("🚀 TCA IRR App - Comprehensive Functionality Test")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    tests = [
        ("Backend Health Check", test_health_endpoint),
        ("File Upload Endpoint", test_file_upload_endpoint),
        ("URL Fetch Endpoint", test_url_fetch_endpoint),
        ("Comprehensive Analysis Endpoint",
         test_comprehensive_analysis_endpoint),
        ("Frontend Accessibility", test_frontend_accessibility),
    ]

    results = []

    for test_name, test_func in tests:
        print(f"🧪 Testing: {test_name}")
        try:
            result = test_func()
            results.append((test_name, result))
            print()
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append((test_name, False))
            print()

    # Summary
    print("📊 Test Results Summary")
    print("=" * 60)
    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")

    print()
    print(f"Tests passed: {passed}/{total} ({passed/total*100:.1f}%)")

    if passed == total:
        print("🎉 All tests passed! The application is fully functional.")
    else:
        print(
            f"⚠️  {total-passed} test(s) failed. Please check the output above."
        )

    return passed == total


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)