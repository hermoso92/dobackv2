"""Security integration tests."""

import pytest
from flask import Flask, request, jsonify
from src.app.middleware.security import SecurityMiddleware
from src.app.models.user import User
from src.app.models.user_security import UserSecurity
from src.app.extensions import db
from datetime import datetime, timedelta
import json

@pytest.fixture
def app():
    """Create test application."""
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    app.config['CSRF_ENABLED'] = True
    app.config['RATE_LIMIT_ENABLED'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    
    # Initialize security middleware
    security = SecurityMiddleware(app)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Test routes
    @app.route('/auth/login', methods=['POST'])
    def login():
        data = request.get_json()
        user = User.query.filter_by(email=data.get('email')).first()
        if user and user.check_password(data.get('password')):
            return jsonify({'message': 'success'})
        return jsonify({'message': 'invalid credentials'}), 401
    
    @app.route('/auth/register', methods=['POST'])
    def register():
        data = request.get_json()
        user = User(
            email=data.get('email'),
            username=data.get('username')
        )
        user.set_password(data.get('password'))
        db.session.add(user)
        db.session.commit()
        return jsonify({'message': 'success'})
    
    @app.route('/auth/reset-password', methods=['POST'])
    def reset_password():
        data = request.get_json()
        user = User.query.filter_by(email=data.get('email')).first()
        if user:
            user.generate_reset_token()
            db.session.commit()
            return jsonify({'message': 'success'})
        return jsonify({'message': 'user not found'}), 404
    
    @app.route('/auth/change-password', methods=['POST'])
    @security.require_csrf
    def change_password():
        data = request.get_json()
        user = User.query.filter_by(email=data.get('email')).first()
        if user and user.check_password(data.get('current_password')):
            user.set_password(data.get('new_password'))
            db.session.commit()
            return jsonify({'message': 'success'})
        return jsonify({'message': 'invalid credentials'}), 401
    
    return app

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

def test_login_security(client):
    """Test login security."""
    # Test rate limiting
    for _ in range(5):
        response = client.post('/auth/login', json={
            'email': 'test@example.com',
            'password': 'wrong'
        })
        assert response.status_code == 401
    
    response = client.post('/auth/login', json={
        'email': 'test@example.com',
        'password': 'wrong'
    })
    assert response.status_code == 429
    
    # Test SQL injection
    response = client.post('/auth/login', json={
        'email': "test@example.com' OR '1'='1",
        'password': 'wrong'
    })
    assert response.status_code == 401
    
    # Test XSS
    response = client.post('/auth/login', json={
        'email': '<script>alert(1)</script>',
        'password': 'wrong'
    })
    assert response.status_code == 401

def test_register_security(client):
    """Test registration security."""
    # Test rate limiting
    for _ in range(5):
        response = client.post('/auth/register', json={
            'email': 'test@example.com',
            'username': 'test',
            'password': 'password123'
        })
        assert response.status_code == 200
    
    response = client.post('/auth/register', json={
        'email': 'test@example.com',
        'username': 'test',
        'password': 'password123'
    })
    assert response.status_code == 429
    
    # Test password strength
    response = client.post('/auth/register', json={
        'email': 'test@example.com',
        'username': 'test',
        'password': 'weak'
    })
    assert response.status_code == 400
    
    # Test email validation
    response = client.post('/auth/register', json={
        'email': 'invalid-email',
        'username': 'test',
        'password': 'password123'
    })
    assert response.status_code == 400

def test_password_reset_security(client):
    """Test password reset security."""
    # Test rate limiting
    for _ in range(5):
        response = client.post('/auth/reset-password', json={
            'email': 'test@example.com'
        })
        assert response.status_code == 404
    
    response = client.post('/auth/reset-password', json={
        'email': 'test@example.com'
    })
    assert response.status_code == 429
    
    # Test token expiry
    with client.session_transaction() as session:
        session['reset_token'] = 'test-token'
        session['reset_token_expiry'] = datetime.utcnow() - timedelta(hours=1)
    
    response = client.post('/auth/change-password', json={
        'email': 'test@example.com',
        'current_password': 'old',
        'new_password': 'new'
    })
    assert response.status_code == 403

def test_session_security(client):
    """Test session security."""
    # Test session fixation
    response = client.get('/auth/login')
    session_id = response.headers.get('Set-Cookie')
    
    response = client.post('/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    }, headers={'Cookie': session_id})
    assert response.status_code == 401
    
    # Test session timeout
    with client.session_transaction() as session:
        session['last_activity'] = datetime.utcnow() - timedelta(hours=2)
    
    response = client.get('/auth/login')
    assert response.status_code == 401

def test_csrf_integration(client):
    """Test CSRF integration."""
    # Test CSRF token generation
    response = client.get('/auth/login')
    assert 'X-CSRF-Token' in response.headers
    
    # Test CSRF token validation
    token = response.headers.get('X-CSRF-Token')
    response = client.post('/auth/change-password', json={
        'email': 'test@example.com',
        'current_password': 'old',
        'new_password': 'new'
    }, headers={'X-CSRF-Token': token})
    assert response.status_code == 401
    
    # Test CSRF token expiry
    with client.session_transaction() as session:
        session['csrf_token'] = 'test-token'
        session['csrf_token_expiry'] = datetime.utcnow() - timedelta(hours=1)
    
    response = client.post('/auth/change-password', json={
        'email': 'test@example.com',
        'current_password': 'old',
        'new_password': 'new'
    }, headers={'X-CSRF-Token': 'test-token'})
    assert response.status_code == 403

def test_security_headers_integration(client):
    """Test security headers integration."""
    response = client.get('/auth/login')
    
    # Check required headers
    assert 'Strict-Transport-Security' in response.headers
    assert 'X-Content-Type-Options' in response.headers
    assert 'X-Frame-Options' in response.headers
    assert 'X-XSS-Protection' in response.headers
    assert 'Content-Security-Policy' in response.headers
    assert 'Referrer-Policy' in response.headers
    assert 'Permissions-Policy' in response.headers
    
    # Check CSP policy
    csp = response.headers.get('Content-Security-Policy')
    assert 'default-src \'self\'' in csp
    assert 'script-src \'self\'' in csp
    assert 'style-src \'self\'' in csp
    assert 'img-src \'self\'' in csp
    assert 'frame-ancestors \'none\'' in csp
    assert 'form-action \'self\'' in csp
    assert 'base-uri \'self\'' in csp
    assert 'object-src \'none\'' in csp

def test_rate_limit_integration(client):
    """Test rate limit integration."""
    # Test rate limit per endpoint
    for _ in range(5):
        response = client.post('/auth/login', json={
            'email': 'test@example.com',
            'password': 'wrong'
        })
        assert response.status_code == 401
    
    response = client.post('/auth/login', json={
        'email': 'test@example.com',
        'password': 'wrong'
    })
    assert response.status_code == 429
    
    # Test rate limit per IP
    response = client.post('/auth/register', json={
        'email': 'test@example.com',
        'username': 'test',
        'password': 'password123'
    })
    assert response.status_code == 200
    
    # Test rate limit reset
    import time
    time.sleep(61)
    
    response = client.post('/auth/login', json={
        'email': 'test@example.com',
        'password': 'wrong'
    })
    assert response.status_code == 401 