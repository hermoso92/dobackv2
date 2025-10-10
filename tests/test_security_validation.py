import pytest
import json
import re
from pathlib import Path
from datetime import datetime, timedelta
from src.automation.validations.security_validation import (
    validate_password_strength,
    validate_jwt_token,
    validate_input_sanitization,
    validate_csrf_protection,
    validate_xss_protection,
    validate_security_tokens,
    validate_security_encryption,
    validate_security_policies,
    validate_security_audit,
    validate_security_compliance
)

# Fixtures para pruebas de seguridad
@pytest.fixture
def valid_password():
    """Fixture que proporciona una contraseña válida"""
    return {
        'password': 'P@ssw0rd123!',
        'min_length': 8,
        'require_uppercase': True,
        'require_lowercase': True,
        'require_numbers': True,
        'require_special': True
    }

@pytest.fixture
def valid_jwt():
    """Fixture que proporciona un token JWT válido"""
    return {
        'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'secret': 'your-secret-key',
        'algorithm': 'HS256',
        'expires_at': (datetime.now() + timedelta(hours=1)).timestamp()
    }

@pytest.fixture
def valid_input():
    """Fixture que proporciona una entrada válida"""
    return {
        'text': 'Hello World!',
        'email': 'test@example.com',
        'phone': '+1234567890',
        'url': 'https://example.com',
        'number': '123.45'
    }

@pytest.fixture
def valid_security_tokens():
    """Fixture que proporciona tokens de seguridad válidos"""
    return {
        'access_token': {
            'token': 'valid.jwt.token',
            'type': 'Bearer',
            'expires_at': (datetime.now() + timedelta(hours=1)).isoformat(),
            'claims': {
                'sub': 'user123',
                'role': 'admin',
                'company_id': 'company456',
                'permissions': ['read:all', 'write:all']
            }
        },
        'refresh_token': {
            'token': 'valid.refresh.token',
            'type': 'Bearer',
            'expires_at': (datetime.now() + timedelta(days=30)).isoformat(),
            'claims': {
                'sub': 'user123',
                'token_type': 'refresh'
            }
        }
    }

@pytest.fixture
def valid_security_encryption():
    """Fixture que proporciona configuración de encriptación válida"""
    return {
        'algorithm': 'AES-256-GCM',
        'key_size': 256,
        'iv_size': 12,
        'tag_size': 16,
        'salt_size': 16,
        'iterations': 100000,
        'hash_algorithm': 'SHA-256',
        'key_derivation': 'PBKDF2'
    }

@pytest.fixture
def valid_security_policies():
    """Fixture que proporciona políticas de seguridad válidas"""
    return {
        'password_policy': {
            'min_length': 12,
            'require_uppercase': True,
            'require_lowercase': True,
            'require_numbers': True,
            'require_special': True,
            'max_age_days': 90,
            'history_size': 5
        },
        'session_policy': {
            'max_duration_minutes': 60,
            'inactivity_timeout_minutes': 15,
            'max_concurrent_sessions': 3,
            'require_reauth': True
        },
        'access_policy': {
            'max_failed_attempts': 5,
            'lockout_duration_minutes': 30,
            'ip_whitelist': ['192.168.1.0/24'],
            'ip_blacklist': ['10.0.0.0/8']
        }
    }

# Tests para validate_password_strength
def test_validate_password_strength_success(valid_password):
    """Test para validar una contraseña fuerte"""
    success, messages = validate_password_strength(valid_password)
    assert success
    assert "Contraseña válida" in messages[0]

def test_validate_password_strength_too_short():
    """Test para validar una contraseña demasiado corta"""
    password = {
        'password': 'Short1!',
        'min_length': 8,
        'require_uppercase': True,
        'require_lowercase': True,
        'require_numbers': True,
        'require_special': True
    }
    
    success, messages = validate_password_strength(password)
    assert not success
    assert "Contraseña demasiado corta" in messages[0]

def test_validate_password_strength_missing_requirements():
    """Test para validar una contraseña sin requisitos"""
    password = {
        'password': 'password123',
        'min_length': 8,
        'require_uppercase': True,
        'require_lowercase': True,
        'require_numbers': True,
        'require_special': True
    }
    
    success, messages = validate_password_strength(password)
    assert not success
    assert "Faltan requisitos" in messages[0]

# Tests para validate_jwt_token
def test_validate_jwt_token_success(valid_jwt):
    """Test para validar un token JWT válido"""
    success, messages = validate_jwt_token(valid_jwt)
    assert success
    assert "Token válido" in messages[0]

def test_validate_jwt_token_invalid_format():
    """Test para validar un token JWT con formato inválido"""
    jwt = {
        'token': 'invalid.token.format',
        'secret': 'your-secret-key',
        'algorithm': 'HS256',
        'expires_at': (datetime.now() + timedelta(hours=1)).timestamp()
    }
    
    success, messages = validate_jwt_token(jwt)
    assert not success
    assert "Formato de token inválido" in messages[0]

def test_validate_jwt_token_expired():
    """Test para validar un token JWT expirado"""
    jwt = {
        'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'secret': 'your-secret-key',
        'algorithm': 'HS256',
        'expires_at': (datetime.now() - timedelta(hours=1)).timestamp()
    }
    
    success, messages = validate_jwt_token(jwt)
    assert not success
    assert "Token expirado" in messages[0]

# Tests para validate_input_sanitization
def test_validate_input_sanitization_success(valid_input):
    """Test para validar una entrada sanitizada"""
    success, messages = validate_input_sanitization(valid_input)
    assert success
    assert "Entrada válida" in messages[0]

def test_validate_input_sanitization_sql_injection():
    """Test para validar una entrada con inyección SQL"""
    input_data = {
        'text': "'; DROP TABLE users; --",
        'email': 'test@example.com',
        'phone': '+1234567890',
        'url': 'https://example.com',
        'number': '123.45'
    }
    
    success, messages = validate_input_sanitization(input_data)
    assert not success
    assert "Inyección SQL detectada" in messages[0]

def test_validate_input_sanitization_xss():
    """Test para validar una entrada con XSS"""
    input_data = {
        'text': '<script>alert("XSS")</script>',
        'email': 'test@example.com',
        'phone': '+1234567890',
        'url': 'https://example.com',
        'number': '123.45'
    }
    
    success, messages = validate_input_sanitization(input_data)
    assert not success
    assert "XSS detectado" in messages[0]

# Tests para validate_csrf_protection
def test_validate_csrf_protection_success():
    """Test para validar protección CSRF exitosa"""
    request = {
        'method': 'POST',
        'headers': {
            'X-CSRF-Token': 'valid-token',
            'Content-Type': 'application/json'
        },
        'body': {
            'data': 'test'
        }
    }
    
    success, messages = validate_csrf_protection(request)
    assert success
    assert "Protección CSRF válida" in messages[0]

def test_validate_csrf_protection_missing_token():
    """Test para validar protección CSRF sin token"""
    request = {
        'method': 'POST',
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': {
            'data': 'test'
        }
    }
    
    success, messages = validate_csrf_protection(request)
    assert not success
    assert "Token CSRF faltante" in messages[0]

def test_validate_csrf_protection_invalid_token():
    """Test para validar protección CSRF con token inválido"""
    request = {
        'method': 'POST',
        'headers': {
            'X-CSRF-Token': 'invalid-token',
            'Content-Type': 'application/json'
        },
        'body': {
            'data': 'test'
        }
    }
    
    success, messages = validate_csrf_protection(request)
    assert not success
    assert "Token CSRF inválido" in messages[0]

# Tests para validate_xss_protection
def test_validate_xss_protection_success():
    """Test para validar protección XSS exitosa"""
    response = {
        'headers': {
            'Content-Security-Policy': "default-src 'self'",
            'X-XSS-Protection': '1; mode=block',
            'X-Content-Type-Options': 'nosniff'
        },
        'body': '<p>Safe content</p>'
    }
    
    success, messages = validate_xss_protection(response)
    assert success
    assert "Protección XSS válida" in messages[0]

def test_validate_xss_protection_missing_headers():
    """Test para validar protección XSS sin headers"""
    response = {
        'headers': {
            'Content-Type': 'text/html'
        },
        'body': '<p>Safe content</p>'
    }
    
    success, messages = validate_xss_protection(response)
    assert not success
    assert "Headers de seguridad faltantes" in messages[0]

def test_validate_xss_protection_unsafe_content():
    """Test para validar protección XSS con contenido inseguro"""
    response = {
        'headers': {
            'Content-Security-Policy': "default-src 'self'",
            'X-XSS-Protection': '1; mode=block',
            'X-Content-Type-Options': 'nosniff'
        },
        'body': '<script>alert("XSS")</script>'
    }
    
    success, messages = validate_xss_protection(response)
    assert not success
    assert "Contenido inseguro detectado" in messages[0]

# Tests para validate_security_tokens
def test_validate_security_tokens_success(valid_security_tokens):
    """Test para validar tokens de seguridad válidos"""
    success, messages = validate_security_tokens(valid_security_tokens)
    assert success
    assert "Tokens de seguridad válidos" in messages[0]

def test_validate_security_tokens_invalid_format():
    """Test para validar tokens de seguridad con formato inválido"""
    tokens = valid_security_tokens.copy()
    tokens['access_token']['token'] = 'invalid.token.format'
    
    success, messages = validate_security_tokens(tokens)
    assert not success
    assert "Formato de token inválido" in messages[0]

def test_validate_security_tokens_expired():
    """Test para validar tokens de seguridad expirados"""
    tokens = valid_security_tokens.copy()
    tokens['access_token']['expires_at'] = (datetime.now() - timedelta(hours=1)).isoformat()
    
    success, messages = validate_security_tokens(tokens)
    assert not success
    assert "Token expirado" in messages[0]

# Tests para validate_security_encryption
def test_validate_security_encryption_success(valid_security_encryption):
    """Test para validar encriptación de seguridad válida"""
    success, messages = validate_security_encryption(valid_security_encryption)
    assert success
    assert "Encriptación de seguridad válida" in messages[0]

def test_validate_security_encryption_invalid_algorithm():
    """Test para validar encriptación de seguridad con algoritmo inválido"""
    encryption = valid_security_encryption.copy()
    encryption['algorithm'] = 'INVALID'
    
    success, messages = validate_security_encryption(encryption)
    assert not success
    assert "Algoritmo inválido" in messages[0]

def test_validate_security_encryption_invalid_key_size():
    """Test para validar encriptación de seguridad con tamaño de clave inválido"""
    encryption = valid_security_encryption.copy()
    encryption['key_size'] = 128  # Tamaño insuficiente
    
    success, messages = validate_security_encryption(encryption)
    assert not success
    assert "Tamaño de clave inválido" in messages[0]

# Tests para validate_security_policies
def test_validate_security_policies_success(valid_security_policies):
    """Test para validar políticas de seguridad válidas"""
    success, messages = validate_security_policies(valid_security_policies)
    assert success
    assert "Políticas de seguridad válidas" in messages[0]

def test_validate_security_policies_invalid_password():
    """Test para validar políticas de seguridad con contraseña inválida"""
    policies = valid_security_policies.copy()
    policies['password_policy']['min_length'] = 4  # Muy corta
    
    success, messages = validate_security_policies(policies)
    assert not success
    assert "Política de contraseña inválida" in messages[0]

def test_validate_security_policies_invalid_session():
    """Test para validar políticas de seguridad con sesión inválida"""
    policies = valid_security_policies.copy()
    policies['session_policy']['max_duration_minutes'] = 0
    
    success, messages = validate_security_policies(policies)
    assert not success
    assert "Política de sesión inválida" in messages[0]

# Tests para validate_security_audit
def test_validate_security_audit_success():
    """Test para validar auditoría de seguridad válida"""
    audit_config = {
        'enabled': True,
        'log_level': 'INFO',
        'events': [
            'login',
            'logout',
            'password_change',
            'permission_change',
            'data_access'
        ],
        'retention_days': 365,
        'storage': {
            'type': 's3',
            'bucket': 'security-logs',
            'path': 'audit/'
        }
    }
    
    success, messages = validate_security_audit(audit_config)
    assert success
    assert "Auditoría de seguridad válida" in messages[0]

def test_validate_security_audit_invalid_events():
    """Test para validar auditoría de seguridad con eventos inválidos"""
    audit_config = {
        'enabled': True,
        'log_level': 'INFO',
        'events': ['invalid_event']
    }
    
    success, messages = validate_security_audit(audit_config)
    assert not success
    assert "Eventos inválidos" in messages[0]

def test_validate_security_audit_missing_required():
    """Test para validar auditoría de seguridad con campos requeridos faltantes"""
    audit_config = {
        'enabled': True
        # Falta log_level y events
    }
    
    success, messages = validate_security_audit(audit_config)
    assert not success
    assert "Campos requeridos faltantes" in messages[0]

# Tests para validate_security_compliance
def test_validate_security_compliance_success():
    """Test para validar cumplimiento de seguridad válido"""
    compliance_config = {
        'standards': [
            'ISO27001',
            'GDPR',
            'PCI-DSS'
        ],
        'requirements': {
            'data_protection': {
                'encryption': True,
                'backup': True,
                'access_control': True
            },
            'privacy': {
                'consent': True,
                'data_minimization': True,
                'right_to_forget': True
            }
        },
        'certifications': [
            {
                'name': 'ISO27001',
                'valid_until': (datetime.now() + timedelta(days=365)).isoformat()
            }
        ]
    }
    
    success, messages = validate_security_compliance(compliance_config)
    assert success
    assert "Cumplimiento de seguridad válido" in messages[0]

def test_validate_security_compliance_invalid_standards():
    """Test para validar cumplimiento de seguridad con estándares inválidos"""
    compliance_config = {
        'standards': ['INVALID_STANDARD']
    }
    
    success, messages = validate_security_compliance(compliance_config)
    assert not success
    assert "Estándares inválidos" in messages[0]

def test_validate_security_compliance_missing_requirements():
    """Test para validar cumplimiento de seguridad con requisitos faltantes"""
    compliance_config = {
        'standards': ['ISO27001'],
        'requirements': {}
    }
    
    success, messages = validate_security_compliance(compliance_config)
    assert not success
    assert "Requisitos faltantes" in messages[0] 