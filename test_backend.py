"""
Basic tests for TCA IRR Backend API
Run with: pytest test_backend.py
"""

import pytest
import asyncio
import httpx
from main import app
import os

# Test configuration
API_BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword123"


@pytest.fixture
async def client():
    """Create test HTTP client"""
    async with httpx.AsyncClient(app=app, base_url=API_BASE_URL) as client:
        yield client


@pytest.mark.asyncio
async def test_health_endpoint(client):
    """Test health check endpoint"""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "TCA IRR Backend API" in data["message"]


@pytest.mark.asyncio
async def test_health_check_endpoint(client):
    """Test detailed health check"""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data


@pytest.mark.asyncio
async def test_user_registration(client):
    """Test user registration"""
    user_data = {
        "full_name": "Test User",
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD,
        "role": "User"
    }

    response = await client.post("/auth/register", json=user_data)

    # Note: This might fail if user already exists, which is expected
    if response.status_code == 200:
        data = response.json()
        assert data["email"] == TEST_USER_EMAIL
        assert data["full_name"] == "Test User"
        assert "user_id" in data
    elif response.status_code == 400:
        # User already exists, which is fine for testing
        data = response.json()
        assert "already registered" in data["detail"]


@pytest.mark.asyncio
async def test_user_login(client):
    """Test user login"""
    login_data = {"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}

    response = await client.post("/auth/login", json=login_data)

    if response.status_code == 200:
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        return data["access_token"]
    else:
        # If login fails, user might not exist
        pytest.skip("Test user not found, skipping login test")


@pytest.mark.asyncio
async def test_protected_endpoint(client):
    """Test protected endpoint with authentication"""
    # First login to get token
    login_data = {"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}

    login_response = await client.post("/auth/login", json=login_data)

    if login_response.status_code != 200:
        pytest.skip("Cannot login, skipping protected endpoint test")

    token = login_response.json()["access_token"]

    # Test protected endpoint
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/auth/me", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "user_id" in data
    assert data["email"] == TEST_USER_EMAIL


@pytest.mark.asyncio
async def test_create_app_request(client):
    """Test creating an app request"""
    # First login to get token
    login_data = {"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}

    login_response = await client.post("/auth/login", json=login_data)

    if login_response.status_code != 200:
        pytest.skip("Cannot login, skipping request creation test")

    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create request
    request_data = {
        "request_type": "feature_request",
        "title": "Test Feature Request",
        "description": "This is a test request created during testing",
        "priority": "low"
    }

    response = await client.post("/requests",
                                 json=request_data,
                                 headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Feature Request"
    assert data["request_type"] == "feature_request"
    assert "request_id" in data


@pytest.mark.asyncio
async def test_unauthorized_access(client):
    """Test that protected endpoints require authentication"""
    response = await client.get("/auth/me")
    assert response.status_code == 403  # Should be unauthorized


@pytest.mark.asyncio
async def test_invalid_login(client):
    """Test login with invalid credentials"""
    login_data = {
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    }

    response = await client.post("/auth/login", json=login_data)
    assert response.status_code == 401
    data = response.json()
    assert "Invalid credentials" in data["detail"]


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__])