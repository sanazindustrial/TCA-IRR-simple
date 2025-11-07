"""
Integration test to check frontend-backend compatibility
"""
import sys
import os

# Add backend to Python path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_path)

try:
    from main import app
    from fastapi.testclient import TestClient
    import json
    from app.db.test_database import mock_get_db

    print("🔍 Frontend-Backend Integration Test")
    print("=" * 50)

    # Override the database dependency with test mock
    from app.db import get_db
    app.dependency_overrides[get_db] = mock_get_db

    # Create test client
    client = TestClient(app)

    # Frontend expected endpoints based on src/lib/backend-api.ts and api.ts
    frontend_endpoints = [
        # Core API endpoints
        {
            "method": "GET",
            "path": "/",
            "name": "API Root"
        },
        {
            "method": "GET",
            "path": "/health",
            "name": "Health Check"
        },

        # Auth endpoints (from frontend api.ts)
        {
            "method": "POST",
            "path": "/api/v1/auth/login",
            "name": "Auth Login",
            "needs_body": True
        },
        {
            "method": "POST",
            "path": "/api/v1/auth/register",
            "name": "Auth Register",
            "needs_body": True
        },
        {
            "method": "GET",
            "path": "/api/v1/auth/me",
            "name": "Auth Me"
        },

        # Company endpoints
        {
            "method": "GET",
            "path": "/api/v1/companies",
            "name": "Companies List"
        },
        {
            "method": "POST",
            "path": "/api/v1/companies",
            "name": "Create Company",
            "needs_body": True
        },

        # Analysis endpoints (from backend-api.ts)
        {
            "method": "POST",
            "path": "/api/v1/analysis/comprehensive",
            "name": "Comprehensive Analysis",
            "needs_body": True
        },
        {
            "method": "POST",
            "path": "/api/v1/tca/quick",
            "name": "Quick TCA",
            "needs_body": True
        },
        {
            "method": "POST",
            "path": "/api/v1/tca/sector-analysis",
            "name": "Sector TCA",
            "needs_body": True
        },

        # Dashboard endpoints
        {
            "method": "GET",
            "path": "/api/v1/dashboard/stats",
            "name": "Dashboard Stats"
        },
        {
            "method": "GET",
            "path": "/api/v1/tca/system-status",
            "name": "TCA System Status"
        },

        # Admin endpoints
        {
            "method": "GET",
            "path": "/api/v1/admin/health",
            "name": "Admin Health"
        },
        {
            "method": "GET",
            "path": "/api/v1/admin/system-status",
            "name": "Admin System Status"
        },
    ]

    results = []

    for endpoint in frontend_endpoints:
        try:
            if endpoint["method"] == "GET":
                response = client.get(endpoint["path"])
            elif endpoint["method"] == "POST":
                # Provide sample data for POST requests
                sample_data = {}
                if "auth/login" in endpoint["path"]:
                    sample_data = {
                        "username": "testuser",
                        "password": "test12345"
                    }
                elif "auth/register" in endpoint["path"]:
                    sample_data = {
                        "username": "newuser",
                        "email": "test@test.com",
                        "password": "test12345",
                        "confirm_password": "test12345"
                    }
                elif "companies" in endpoint["path"]:
                    sample_data = {
                        "name": "Test Company",
                        "sector": "technology"
                    }
                elif "analysis" in endpoint["path"] or "tca" in endpoint[
                        "path"]:
                    sample_data = {
                        "framework": "general",
                        "company_name": "Test Co"
                    }

                response = client.post(endpoint["path"], json=sample_data)

            status = "✅ PASS" if response.status_code < 500 else "❌ FAIL"
            if response.status_code == 404:
                status = "⚠️  NOT_FOUND"
            elif response.status_code == 422:
                status = "⚠️  VALIDATION_ERROR"

            result = f"{status} {endpoint['name']:<25} [{endpoint['method']}] {endpoint['path']:<35} -> {response.status_code}"
            results.append(result)
            print(result)

        except Exception as e:
            error_result = f"❌ ERROR {endpoint['name']:<25} {str(e)[:50]}"
            results.append(error_result)
            print(error_result)

    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)

    passed = len([r for r in results if "✅ PASS" in r])
    failed = len([r for r in results if "❌" in r])
    not_found = len([r for r in results if "NOT_FOUND" in r])
    validation_errors = len([r for r in results if "VALIDATION_ERROR" in r])

    print(f"✅ Passed: {passed}")
    print(f"⚠️  Not Found: {not_found}")
    print(f"⚠️  Validation Errors: {validation_errors}")
    print(f"❌ Failed: {failed}")
    print(f"📝 Total Tested: {len(results)}")

    if not_found > 0:
        print(f"\n⚠️  MISSING ENDPOINTS ({not_found}):")
        for result in results:
            if "NOT_FOUND" in result:
                print(f"   {result}")

    if failed > 0:
        print(f"\n❌ FAILED ENDPOINTS ({failed}):")
        for result in results:
            if "❌" in result and "NOT_FOUND" not in result:
                print(f"   {result}")

    print(
        f"\n🎯 Integration Status: {'GOOD' if failed == 0 and not_found < 3 else 'NEEDS_WORK'}"
    )

except Exception as e:
    print(f"❌ Integration test failed: {e}")
    import traceback
    traceback.print_exc()