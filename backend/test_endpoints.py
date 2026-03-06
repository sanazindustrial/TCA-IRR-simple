"""
Test script to verify TCA API endpoints are working
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8002"


def test_endpoint(endpoint, method="GET", data=None):
    """Test an API endpoint"""
    try:
        url = f"{BASE_URL}{endpoint}"
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)

        print(f"✓ {method} {endpoint}")
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)[:200]}...")
        else:
            print(f"  Error: {response.text[:100]}...")
        print("-" * 50)
        return response.status_code == 200
    except Exception as e:
        print(f"✗ {method} {endpoint} - Error: {e}")
        print("-" * 50)
        return False


# Test critical endpoints
print("Testing TCA API Endpoints")
print("=" * 50)

# Test root endpoint
test_endpoint("/")

# Test health endpoint
test_endpoint("/health")

# Test database health
test_endpoint("/api/v1/admin/database/health")

# Test auth endpoints
test_endpoint("/api/v1/auth/health")

# Test TCA analysis endpoint
test_data = {
    "company_name": "Test Company",
    "sector": "technology",
    "stage": "series_a"
}
test_endpoint("/api/v1/tca/analyze", method="POST", data=test_data)

print("Endpoint testing completed!")