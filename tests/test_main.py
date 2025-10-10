"""Test suite for main application functionality."""

import pytest
from datetime import datetime
from src.app import create_app
from src.models import User, Vehicle, TelemetryData, StabilityData

def test_app_creation():
    """Test that the application can be created."""
    app = create_app(testing=True)
    assert app is not None
    assert app.config["TESTING"] is True

def test_home_route(client):
    """Test the home route."""
    response = client.get("/")
    assert response.status_code == 200
    assert b"Welcome to DobackSoft V2" in response.data

def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "timestamp" in data

def test_user_registration(client, db_session):
    """Test user registration."""
    response = client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert "token" in data
    assert "user" in data
    assert data["user"]["username"] == "testuser"

def test_user_login(client, test_user):
    """Test user login."""
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "token" in data
    assert "user" in data
    assert data["user"]["username"] == "testuser"

def test_vehicle_registration(client, auth_headers, db_session):
    """Test vehicle registration."""
    response = client.post("/api/vehicles", 
        json={
            "plate": "TEST123",
            "model": "Test Model",
            "year": 2024
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["plate"] == "TEST123"
    assert data["model"] == "Test Model"

def test_telemetry_data_submission(client, auth_headers, test_vehicle, mock_telemetry_data):
    """Test telemetry data submission."""
    response = client.post(
        f"/api/vehicles/{test_vehicle.id}/telemetry",
        json=mock_telemetry_data,
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["speed"] == mock_telemetry_data["speed"]
    assert data["battery_level"] == mock_telemetry_data["battery_level"]

def test_stability_data_submission(client, auth_headers, test_vehicle, mock_stability_data):
    """Test stability data submission."""
    response = client.post(
        f"/api/vehicles/{test_vehicle.id}/stability",
        json=mock_stability_data,
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["roll_angle"] == mock_stability_data["roll_angle"]
    assert data["pitch_angle"] == mock_stability_data["pitch_angle"]

def test_vehicle_data_retrieval(client, auth_headers, test_vehicle, mock_telemetry_data, mock_stability_data):
    """Test vehicle data retrieval."""
    # First submit some data
    client.post(
        f"/api/vehicles/{test_vehicle.id}/telemetry",
        json=mock_telemetry_data,
        headers=auth_headers
    )
    client.post(
        f"/api/vehicles/{test_vehicle.id}/stability",
        json=mock_stability_data,
        headers=auth_headers
    )

    # Then retrieve it
    response = client.get(
        f"/api/vehicles/{test_vehicle.id}/data",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.get_json()
    assert "telemetry" in data
    assert "stability" in data
    assert len(data["telemetry"]) > 0
    assert len(data["stability"]) > 0

def test_error_handling(client):
    """Test error handling."""
    # Test 404
    response = client.get("/nonexistent")
    assert response.status_code == 404

    # Test 401 (unauthorized)
    response = client.get("/api/vehicles")
    assert response.status_code == 401

    # Test 400 (bad request)
    response = client.post("/api/auth/login", json={})
    assert response.status_code == 400

def test_rate_limiting(client):
    """Test rate limiting."""
    # Make multiple requests in quick succession
    for _ in range(100):
        response = client.get("/")
    
    # The next request should be rate limited
    response = client.get("/")
    assert response.status_code == 429

@pytest.mark.parametrize("endpoint,method,expected_status", [
    ("/api/vehicles", "GET", 401),
    ("/api/vehicles", "POST", 401),
    ("/api/auth/register", "POST", 201),
    ("/api/auth/login", "POST", 200),
    ("/health", "GET", 200),
])
def test_endpoint_access(client, endpoint, method, expected_status):
    """Test endpoint access with different methods."""
    if method == "GET":
        response = client.get(endpoint)
    elif method == "POST":
        response = client.post(endpoint, json={})
    assert response.status_code == expected_status 