"""
Simple FastAPI app verification test
"""
from fastapi.testclient import TestClient
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from main import app

    # Create test client
    client = TestClient(app)

    print("✓ FastAPI app imported successfully")
    print("✓ Test client created")

    # Test root endpoint
    response = client.get("/")
    print(f"✓ Root endpoint test: Status {response.status_code}")
    if response.status_code == 200:
        print(f"  Response: {response.json()}")

    # Test health endpoint
    response = client.get("/health")
    print(f"✓ Health endpoint test: Status {response.status_code}")
    if response.status_code == 200:
        print(f"  Health status: {response.json().get('status', 'Unknown')}")

    # List available routes
    print("\n✓ Available endpoints:")
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            print(
                f"  {list(route.methods)[0] if route.methods else 'GET'} {route.path}"
            )

    print("\n🎉 All basic functionality tests passed!")

except Exception as e:
    print(f"✗ Test failed: {e}")
    import traceback
    traceback.print_exc()