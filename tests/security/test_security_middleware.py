"""Security middleware tests."""

import pytest
from flask import Flask, request, jsonify
from app.middleware.security import SecurityMiddleware
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
    
    # Initialize security middleware
    security = SecurityMiddleware(app)
    
    # Test routes
    @app.route('/test', methods=['GET', 'POST'])
    def test_route():
        return jsonify({'message': 'success'})
    
    @app.route('/csrf-test', methods=['POST'])
    @security.require_csrf
    def csrf_test():
        return jsonify({'message': 'success'})
    
    @app.route('/rate-limit-test', methods=['GET'])
    @security.rate_limit('5/minute')
    def rate_limit_test():
        return jsonify({'message': 'success'})
    
    return app

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

def test_security_headers(client):
    """Test security headers are present."""
    response = client.get('/test')
    
    # Check required headers
    assert 'Strict-Transport-Security' in response.headers
    assert 'X-Content-Type-Options' in response.headers
    assert 'X-Frame-Options' in response.headers
    assert 'X-XSS-Protection' in response.headers
    assert 'Content-Security-Policy' in response.headers
    assert 'Referrer-Policy' in response.headers
    assert 'Permissions-Policy' in response.headers

def test_csrf_protection(client):
    """Test CSRF protection."""
    # Test without token
    response = client.post('/csrf-test')
    assert response.status_code == 403
    
    # Test with invalid token
    response = client.post('/csrf-test', headers={'X-CSRF-Token': 'invalid'})
    assert response.status_code == 403
    
    # Test with valid token
    token = client.get('/test').headers.get('X-CSRF-Token')
    response = client.post('/csrf-test', headers={'X-CSRF-Token': token})
    assert response.status_code == 200

def test_rate_limiting(client):
    """Test rate limiting."""
    # Make requests up to limit
    for _ in range(5):
        response = client.get('/rate-limit-test')
        assert response.status_code == 200
    
    # Test exceeding limit
    response = client.get('/rate-limit-test')
    assert response.status_code == 429

def test_request_validation(client):
    """Test request validation."""
    # Test invalid content type
    response = client.post('/test', data='invalid', content_type='text/plain')
    assert response.status_code == 400
    
    # Test valid content type
    response = client.post('/test', json={'test': 'data'})
    assert response.status_code == 200

def test_sql_injection_prevention(client):
    """Test SQL injection prevention."""
    # Test SQL injection in query parameters
    response = client.get('/test?param=1\' OR \'1\'=\'1')
    assert response.status_code == 200
    
    # Test SQL injection in JSON body
    response = client.post('/test', json={
        'param': '1\' OR \'1\'=\'1'
    })
    assert response.status_code == 200

def test_xss_prevention(client):
    """Test XSS prevention."""
    # Test XSS in query parameters
    response = client.get('/test?param=<script>alert(1)</script>')
    assert response.status_code == 200
    
    # Test XSS in JSON body
    response = client.post('/test', json={
        'param': '<script>alert(1)</script>'
    })
    assert response.status_code == 200

def test_content_length_limit(client):
    """Test content length limit."""
    # Test large request
    large_data = 'x' * (16 * 1024 * 1024 + 1)  # 16MB + 1
    response = client.post('/test', data=large_data)
    assert response.status_code == 413

def test_ip_validation(client):
    """Test IP address validation."""
    # Test invalid IP
    response = client.get('/test', headers={
        'X-Forwarded-For': 'invalid-ip'
    })
    assert response.status_code == 400
    
    # Test valid IP
    response = client.get('/test', headers={
        'X-Forwarded-For': '192.168.1.1'
    })
    assert response.status_code == 200

def test_csp_policy(client):
    """Test Content Security Policy."""
    response = client.get('/test')
    csp = response.headers.get('Content-Security-Policy')
    
    # Check required directives
    assert 'default-src \'self\'' in csp
    assert 'script-src \'self\'' in csp
    assert 'style-src \'self\'' in csp
    assert 'img-src \'self\'' in csp
    assert 'frame-ancestors \'none\'' in csp
    assert 'form-action \'self\'' in csp
    assert 'base-uri \'self\'' in csp
    assert 'object-src \'none\'' in csp

def test_token_expiry(client):
    """Test token expiry."""
    # Get token
    token = client.get('/test').headers.get('X-CSRF-Token')
    
    # Wait for token to expire
    app.config['CSRF_TOKEN_EXPIRY'] = 1
    import time
    time.sleep(2)
    
    # Test expired token
    response = client.post('/csrf-test', headers={'X-CSRF-Token': token})
    assert response.status_code == 403

def test_rate_limit_reset(client):
    """Test rate limit reset."""
    # Make requests up to limit
    for _ in range(5):
        response = client.get('/rate-limit-test')
        assert response.status_code == 200
    
    # Wait for rate limit to reset
    import time
    time.sleep(61)
    
    # Test after reset
    response = client.get('/rate-limit-test')
    assert response.status_code == 200 