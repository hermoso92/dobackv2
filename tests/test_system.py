"""System tests."""

import os
import sys
import pytest
from datetime import datetime, timedelta
from pathlib import Path

# Add the src directory to the Python path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir))

from src.app import create_app
from src.app.extensions import db
from src.app.models import (
    User, Role, Company, Vehicle, TelemetryData,
    StabilitySession, StabilityEvent, Alert, Fleet
)

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    app = create_app('testing')
    
    # Create the database and load test data
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

def test_app_exists(app):
    """Test that the app exists."""
    assert app is not None

def test_app_is_testing(app):
    """Test that the app is in testing mode."""
    assert app.config['TESTING']

def test_database_creation(app):
    """Test database creation."""
    with app.app_context():
        # Create test data
        company = Company(
            name="Test Company",
            description="Test Description",
            email="test@example.com",
            phone="+1234567890",
            address="123 Test St",
            city="Test City",
            state="Test State",
            country="Test Country",
            postal_code="12345"
        )
        db.session.add(company)
        db.session.commit()
        
        # Verify data was created
        assert Company.query.count() == 1
        assert Company.query.first().name == "Test Company"

def test_user_creation(app):
    """Test user creation."""
    with app.app_context():
        # Create test company
        company = Company(
            name="Test Company",
            email="test@example.com"
        )
        db.session.add(company)
        db.session.commit()
        
        # Create test user
        user = User(
            username="testuser",
            email="test@example.com",
            company_id=company.id,
            first_name="Test",
            last_name="User",
            is_active=True
        )
        user.password = "testpass123"
        db.session.add(user)
        db.session.commit()
        
        # Verify user was created
        assert User.query.count() == 1
        assert User.query.first().username == "testuser"

def test_vehicle_creation(app):
    """Test vehicle creation."""
    with app.app_context():
        # Create test company
        company = Company(
            name="Test Company",
            email="test@example.com"
        )
        db.session.add(company)
        db.session.commit()
        
        # Create test vehicle
        vehicle = Vehicle(
            name="Test Vehicle",
            plate="TEST123",
            brand="Test Brand",
            model="Test Model",
            year=2024,
            weight=1000.0,
            length=5.0,
            width=2.0,
            height=2.0,
            wheelbase=3.0,
            company_id=company.id
        )
        db.session.add(vehicle)
        db.session.commit()
        
        # Verify vehicle was created
        assert Vehicle.query.count() == 1
        assert Vehicle.query.first().plate == "TEST123"

def test_stability_session_creation(app):
    """Test stability session creation."""
    with app.app_context():
        # Create test company
        company = Company(
            name="Test Company",
            email="test@example.com"
        )
        db.session.add(company)
        db.session.commit()
        
        # Create test user
        user = User(
            username="testuser",
            email="test@example.com",
            company_id=company.id,
            first_name="Test",
            last_name="User",
            is_active=True
        )
        user.password = "testpass123"
        db.session.add(user)
        db.session.commit()
        
        # Create test vehicle
        vehicle = Vehicle(
            name="Test Vehicle",
            plate="TEST123",
            brand="Test Brand",
            model="Test Model",
            year=2024,
            weight=1000.0,
            length=5.0,
            width=2.0,
            height=2.0,
            wheelbase=3.0,
            company_id=company.id
        )
        db.session.add(vehicle)
        db.session.commit()
        
        # Create test stability session
        session = StabilitySession(
            vehicle_id=vehicle.id,
            user_id=user.id,
            filename="test.csv",
            file_path="/path/to/test.csv"
        )
        db.session.add(session)
        db.session.commit()
        
        # Create test telemetry data
        data = TelemetryData(
            session_id=session.id,
            vehicle_id=vehicle.id,
            value=1.0,
            unit="m/s²"
        )
        db.session.add(data)
        db.session.commit()
        
        # Verify data was created
        assert StabilitySession.query.count() == 1
        assert TelemetryData.query.count() == 1

def test_alert_creation(app):
    """Test alert creation."""
    with app.app_context():
        # Create test company
        company = Company(
            name="Test Company",
            email="test@example.com"
        )
        db.session.add(company)
        db.session.commit()
        
        # Create test vehicle
        vehicle = Vehicle(
            name="Test Vehicle",
            plate="TEST123",
            brand="Test Brand",
            model="Test Model",
            year=2024,
            weight=1000.0,
            length=5.0,
            width=2.0,
            height=2.0,
            wheelbase=3.0,
            company_id=company.id
        )
        db.session.add(vehicle)
        db.session.commit()
        
        # Create test alert
        alert = Alert(
            vehicle_id=vehicle.id,
            type="stability_warning",
            message="Test alert message",
            severity="high"
        )
        db.session.add(alert)
        db.session.commit()
        
        # Verify alert was created
        assert Alert.query.count() == 1
        assert Alert.query.first().type == "stability_warning" 