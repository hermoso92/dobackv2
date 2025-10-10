"""Test configuration module."""

import os
import pytest
from datetime import datetime
from src.app import create_app
from src.database import db
from src.config import TestConfig

@pytest.fixture(scope="session")
def app():
    """Create application for the tests."""
    app = create_app(testing=True)
    app.config.from_object(TestConfig)
    return app

@pytest.fixture(scope="session")
def client(app):
    """Create test client fixture."""
    with app.test_client() as client:
        yield client

@pytest.fixture(scope="session")
def db_session(app):
    """Create a fresh database for each test session."""
    with app.app_context():
        db.create_all()
        yield db.session
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope="function")
def test_user(db_session):
    """Create a test user."""
    from src.models import User
    user = User(
        username="testuser",
        email="test@example.com",
        password="testpass123"
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture(scope="function")
def auth_headers(test_user):
    """Create authentication headers for API requests."""
    return {
        "Authorization": f"Bearer {test_user.generate_token()}"
    }

@pytest.fixture(scope="function")
def test_vehicle(db_session):
    """Create a test vehicle."""
    from src.models import Vehicle
    vehicle = Vehicle(
        plate="TEST123",
        model="Test Model",
        year=2024
    )
    db_session.add(vehicle)
    db_session.commit()
    return vehicle

@pytest.fixture(scope="function")
def mock_telemetry_data():
    """Generate mock telemetry data for testing."""
    return {
        "timestamp": datetime.now().isoformat(),
        "speed": 60.5,
        "acceleration": 0.2,
        "latitude": 40.4168,
        "longitude": -3.7038,
        "battery_level": 85.0
    }

@pytest.fixture(scope="function")
def mock_stability_data():
    """Generate mock stability data for testing."""
    return {
        "timestamp": datetime.now().isoformat(),
        "roll_angle": 0.5,
        "pitch_angle": 0.3,
        "vertical_acceleration": 9.8,
        "lateral_acceleration": 0.1
    }

@pytest.fixture(scope="function")
def test_log_file(tmp_path):
    """Create a temporary log file for testing."""
    log_file = tmp_path / "test.log"
    log_file.write_text("Test log content\n")
    return str(log_file)

@pytest.fixture(scope="function")
def mock_cache():
    """Create a mock cache for testing."""
    return {}

@pytest.fixture(scope="function")
def mock_file_system(tmp_path):
    """Create a temporary file system for testing."""
    return tmp_path 