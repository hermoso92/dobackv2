import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from src.automation.validations.user_validation import (
    validate_user_data,
    validate_user_credentials,
    validate_user_permissions,
    validate_user_sessions,
    validate_user_activity
)

# Fixtures para pruebas de usuarios
@pytest.fixture
def valid_user_data():
    """Fixture que proporciona datos de usuario válidos"""
    return pd.DataFrame({
        'user_id': ['U001', 'U002', 'U003', 'U004', 'U005'],
        'username': ['john.doe', 'jane.smith', 'bob.johnson', 'alice.brown', 'charlie.wilson'],
        'email': [
            'john.doe@example.com',
            'jane.smith@example.com',
            'bob.johnson@example.com',
            'alice.brown@example.com',
            'charlie.wilson@example.com'
        ],
        'role': ['admin', 'company_admin', 'operator', 'viewer', 'driver'],
        'company_id': ['C001', 'C001', 'C002', 'C002', 'C003'],
        'status': ['active', 'active', 'active', 'inactive', 'active'],
        'created_at': [
            datetime(2023, 1, 1),
            datetime(2023, 2, 1),
            datetime(2023, 3, 1),
            datetime(2023, 4, 1),
            datetime(2023, 5, 1)
        ],
        'last_login': [
            datetime(2024, 1, 1),
            datetime(2024, 1, 2),
            datetime(2024, 1, 3),
            None,
            datetime(2024, 1, 5)
        ],
        'password_hash': [
            'hash1',
            'hash2',
            'hash3',
            'hash4',
            'hash5'
        ],
        'two_factor_enabled': [True, True, False, False, True]
    })

@pytest.fixture
def valid_user_credentials():
    """Fixture que proporciona credenciales de usuario válidas"""
    return {
        'U001': {
            'password_hash': 'hash1',
            'salt': 'salt1',
            'iterations': 10000,
            'algorithm': 'pbkdf2_sha256',
            'last_password_change': datetime(2023, 12, 1),
            'password_expiry': datetime(2024, 6, 1),
            'failed_attempts': 0,
            'lockout_until': None
        }
    }

@pytest.fixture
def valid_user_permissions():
    """Fixture que proporciona permisos de usuario válidos"""
    return {
        'admin': {
            'permissions': [
                'create:company',
                'read:company',
                'update:company',
                'delete:company',
                'create:user',
                'read:user',
                'update:user',
                'delete:user'
            ],
            'restrictions': []
        },
        'company_admin': {
            'permissions': [
                'read:company',
                'update:company',
                'create:user',
                'read:user',
                'update:user'
            ],
            'restrictions': ['company_id']
        },
        'operator': {
            'permissions': [
                'read:vehicle',
                'update:vehicle',
                'read:maintenance',
                'create:maintenance'
            ],
            'restrictions': ['company_id']
        }
    }

# Tests para validate_user_data
def test_validate_user_data_success(valid_user_data):
    """Test para validar datos de usuario válidos"""
    success, messages = validate_user_data(valid_user_data)
    assert success
    assert "Datos de usuario válidos" in messages[0]

def test_validate_user_data_missing_columns():
    """Test para validar datos de usuario con columnas faltantes"""
    df = valid_user_data.copy()
    df = df.drop('username', axis=1)
    
    success, messages = validate_user_data(df)
    assert not success
    assert "Columnas requeridas faltantes" in messages[0]

def test_validate_user_data_invalid_types():
    """Test para validar datos de usuario con tipos inválidos"""
    df = valid_user_data.copy()
    df['created_at'] = df['created_at'].astype(str)
    
    success, messages = validate_user_data(df)
    assert not success
    assert "Tipos de datos inválidos" in messages[0]

# Tests para validate_user_credentials
def test_validate_user_credentials_success(valid_user_credentials):
    """Test para validar credenciales de usuario válidas"""
    success, messages = validate_user_credentials(valid_user_credentials)
    assert success
    assert "Credenciales de usuario válidas" in messages[0]

def test_validate_user_credentials_invalid_hash():
    """Test para validar credenciales de usuario con hash inválido"""
    credentials = valid_user_credentials.copy()
    credentials['U001']['password_hash'] = None
    
    success, messages = validate_user_credentials(credentials)
    assert not success
    assert "Hash de contraseña inválido" in messages[0]

def test_validate_user_credentials_expired_password():
    """Test para validar credenciales de usuario con contraseña expirada"""
    credentials = valid_user_credentials.copy()
    credentials['U001']['password_expiry'] = datetime(2023, 12, 1)
    
    success, messages = validate_user_credentials(credentials)
    assert not success
    assert "Contraseña expirada" in messages[0]

# Tests para validate_user_permissions
def test_validate_user_permissions_success(valid_user_permissions):
    """Test para validar permisos de usuario válidos"""
    success, messages = validate_user_permissions(valid_user_permissions)
    assert success
    assert "Permisos de usuario válidos" in messages[0]

def test_validate_user_permissions_invalid_role():
    """Test para validar permisos de usuario con rol inválido"""
    permissions = valid_user_permissions.copy()
    permissions['invalid_role'] = {
        'permissions': ['read:company'],
        'restrictions': []
    }
    
    success, messages = validate_user_permissions(permissions)
    assert not success
    assert "Rol inválido" in messages[0]

def test_validate_user_permissions_missing_required():
    """Test para validar permisos de usuario con campos requeridos faltantes"""
    permissions = valid_user_permissions.copy()
    del permissions['admin']['permissions']
    
    success, messages = validate_user_permissions(permissions)
    assert not success
    assert "Campos requeridos faltantes" in messages[0]

# Tests para validate_user_sessions
def test_validate_user_sessions_success(valid_user_data):
    """Test para validar sesiones de usuario válidas"""
    success, messages = validate_user_sessions(valid_user_data)
    assert success
    assert "Sesiones de usuario válidas" in messages[0]

def test_validate_user_sessions_invalid_status():
    """Test para validar sesiones de usuario con estado inválido"""
    df = valid_user_data.copy()
    df.loc[0, 'status'] = 'invalid'
    
    success, messages = validate_user_sessions(df)
    assert not success
    assert "Estado inválido" in messages[0]

def test_validate_user_sessions_inactive_user():
    """Test para validar sesiones de usuario inactivo"""
    df = valid_user_data.copy()
    df.loc[0, 'status'] = 'inactive'
    df.loc[0, 'last_login'] = datetime.now()
    
    success, messages = validate_user_sessions(df)
    assert not success
    assert "Usuario inactivo" in messages[0]

# Tests para validate_user_activity
def test_validate_user_activity_success(valid_user_data):
    """Test para validar actividad de usuario válida"""
    success, messages = validate_user_activity(valid_user_data)
    assert success
    assert "Actividad de usuario válida" in messages[0]

def test_validate_user_activity_invalid_dates():
    """Test para validar actividad de usuario con fechas inválidas"""
    df = valid_user_data.copy()
    df.loc[0, 'last_login'] = df.loc[0, 'created_at'] - timedelta(days=1)
    
    success, messages = validate_user_activity(df)
    assert not success
    assert "Fechas inválidas" in messages[0]

def test_validate_user_activity_inconsistent_status():
    """Test para validar actividad de usuario con estado inconsistente"""
    df = valid_user_data.copy()
    df.loc[0, 'status'] = 'inactive'
    df.loc[0, 'last_login'] = datetime.now()
    
    success, messages = validate_user_activity(df)
    assert not success
    assert "Estado inconsistente" in messages[0] 