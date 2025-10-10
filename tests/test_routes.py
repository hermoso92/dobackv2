import pytest
from src.app import create_app, db
from src.app.models import Session, StabilityData, CANData, GPSData
from datetime import datetime
import json

@pytest.fixture
def app():
    app = create_app('testing')
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def session(app):
    with app.app_context():
        session = Session(
            name="Test Session",
            description="Test Description",
            created_at=datetime.utcnow()
        )
        db.session.add(session)
        db.session.commit()
        return session

def test_add_stability_data(client, session):
    data = {
        'session_id': session.id,
        'timestamp': datetime.utcnow().isoformat(),
        'roll': 1.5,
        'pitch': 2.5,
        'yaw': 3.5,
        'acceleration_x': 0.1,
        'acceleration_y': 0.2,
        'acceleration_z': 0.3
    }
    
    response = client.post('/stability',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 201
    assert 'id' in response.json

def test_get_stability_data(client, session):
    response = client.get(f'/stability/{session.id}')
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_add_can_data(client, session):
    data = {
        'session_id': session.id,
        'timestamp': datetime.utcnow().isoformat(),
        'can_id': '123',
        'data': {'value': 42}
    }
    
    response = client.post('/can',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 201
    assert 'id' in response.json

def test_get_can_data(client, session):
    response = client.get(f'/can/{session.id}')
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_add_gps_data(client, session):
    data = {
        'session_id': session.id,
        'timestamp': datetime.utcnow().isoformat(),
        'latitude': 40.7128,
        'longitude': -74.0060,
        'altitude': 100.0,
        'speed': 50.0,
        'satellites': 8
    }
    
    response = client.post('/gps',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 201
    assert 'id' in response.json

def test_get_gps_data(client, session):
    response = client.get(f'/gps/{session.id}')
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_get_session_data(client, session):
    response = client.get(f'/session/{session.id}/data')
    assert response.status_code == 200
    assert 'stability_data' in response.json
    assert 'can_data' in response.json
    assert 'gps_data' in response.json

def test_invalid_data(client, session):
    # Test invalid stability data
    data = {
        'session_id': session.id,
        'timestamp': 'invalid_timestamp',
        'roll': 'not_a_number'
    }
    response = client.post('/stability',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 400
    
    # Test invalid CAN data
    data = {
        'session_id': session.id,
        'can_id': 'too_long_id' * 10
    }
    response = client.post('/can',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 400
    
    # Test invalid GPS data
    data = {
        'session_id': session.id,
        'latitude': 200,  # Invalid latitude
        'longitude': -74.0060
    }
    response = client.post('/gps',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 400 