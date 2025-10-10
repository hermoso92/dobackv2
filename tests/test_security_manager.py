import pytest
import time
from datetime import datetime, timedelta
from src.app.services.security_manager import SecurityManager
from src.app.exceptions import SecurityManagerError

@pytest.fixture
def security_manager():
    config = {
        'secret_key': 'test_secret_key',
        'token_expiry': 3600,
        'password_salt_rounds': 12,
        'max_login_attempts': 3,
        'lockout_duration': 300
    }
    return SecurityManager(config)

def test_init_security_manager(security_manager):
    # Verificar configuración
    assert security_manager.secret_key == 'test_secret_key'
    assert security_manager.token_expiry == 3600
    assert security_manager.password_salt_rounds == 12
    assert security_manager.max_login_attempts == 3
    assert security_manager.lockout_duration == 300
    
    # Verificar métricas iniciales
    assert security_manager.metrics['total_logins'] == 0
    assert security_manager.metrics['failed_logins'] == 0
    assert security_manager.metrics['password_resets'] == 0
    assert security_manager.metrics['token_creations'] == 0
    assert security_manager.metrics['token_validations'] == 0
    assert security_manager.metrics['account_locks'] == 0
    assert security_manager.metrics['security_errors'] == 0

def test_hash_password(security_manager):
    # Generar hash
    password = 'test_password'
    password_hash = security_manager.hash_password(password)
    
    # Verificar hash
    assert password_hash != password
    assert len(password_hash) > len(password)
    
    # Verificar que el mismo password genera el mismo hash
    assert security_manager.hash_password(password) != password_hash  # Debe ser diferente por el salt

def test_verify_password(security_manager):
    # Generar hash
    password = 'test_password'
    password_hash = security_manager.hash_password(password)
    
    # Verificar contraseña correcta
    assert security_manager.verify_password(password, password_hash) is True
    
    # Verificar contraseña incorrecta
    assert security_manager.verify_password('wrong_password', password_hash) is False

def test_generate_token(security_manager):
    # Generar token
    user_id = 'test_user'
    data = {'role': 'admin'}
    token = security_manager.generate_token(user_id, data)
    
    # Verificar token
    assert token is not None
    assert len(token) > 0
    
    # Verificar métricas
    assert security_manager.metrics['token_creations'] == 1

def test_validate_token(security_manager):
    # Generar token
    user_id = 'test_user'
    token = security_manager.generate_token(user_id)
    
    # Validar token
    payload = security_manager.validate_token(token)
    
    # Verificar payload
    assert payload['user_id'] == user_id
    assert 'exp' in payload
    
    # Verificar métricas
    assert security_manager.metrics['token_validations'] == 1

def test_validate_expired_token(security_manager):
    # Generar token con expiración corta
    security_manager.token_expiry = 1
    token = security_manager.generate_token('test_user')
    
    # Esperar a que expire
    time.sleep(2)
    
    # Intentar validar token expirado
    with pytest.raises(SecurityManagerError):
        security_manager.validate_token(token)
    
    # Verificar métricas
    assert security_manager.metrics['security_errors'] == 1

def test_blacklist_token(security_manager):
    # Generar token
    token = security_manager.generate_token('test_user')
    
    # Añadir a lista negra
    security_manager.blacklist_token(token)
    
    # Verificar que está en lista negra
    assert token in security_manager.blacklisted_tokens
    
    # Intentar validar token en lista negra
    with pytest.raises(SecurityManagerError):
        security_manager.validate_token(token)

def test_check_account_lock(security_manager):
    # Verificar cuenta no bloqueada
    assert security_manager.check_account_lock('test_user') is False
    
    # Registrar intentos fallidos
    for _ in range(security_manager.max_login_attempts):
        security_manager.record_login_attempt('test_user', False)
    
    # Verificar cuenta bloqueada
    assert security_manager.check_account_lock('test_user') is True
    
    # Esperar a que expire el bloqueo
    security_manager.lockout_duration = 1
    time.sleep(2)
    
    # Verificar que se desbloqueó
    assert security_manager.check_account_lock('test_user') is False

def test_record_login_attempt(security_manager):
    # Registrar intento exitoso
    security_manager.record_login_attempt('test_user', True)
    assert security_manager.metrics['total_logins'] == 1
    assert security_manager.metrics['failed_logins'] == 0
    
    # Registrar intento fallido
    security_manager.record_login_attempt('test_user', False)
    assert security_manager.metrics['total_logins'] == 2
    assert security_manager.metrics['failed_logins'] == 1
    
    # Verificar bloqueo después de múltiples intentos fallidos
    for _ in range(security_manager.max_login_attempts - 1):
        security_manager.record_login_attempt('test_user', False)
    
    assert security_manager.metrics['account_locks'] == 1
    assert 'test_user' in security_manager.locked_accounts

def test_generate_password_reset_token(security_manager):
    # Generar token
    token = security_manager.generate_password_reset_token('test_user')
    
    # Verificar token
    assert token is not None
    assert len(token) > 0
    
    # Verificar métricas
    assert security_manager.metrics['password_resets'] == 1

def test_get_security_stats(security_manager):
    # Realizar algunas operaciones
    security_manager.hash_password('test_password')
    security_manager.generate_token('test_user')
    security_manager.record_login_attempt('test_user', False)
    
    # Obtener estadísticas
    stats = security_manager.get_security_stats()
    
    # Verificar estadísticas
    assert stats['total_logins'] == 1
    assert stats['failed_logins'] == 1
    assert stats['token_creations'] == 1
    assert stats['token_validations'] == 0
    assert stats['account_locks'] == 0
    assert stats['security_errors'] == 0
    assert stats['locked_accounts'] == 0
    assert stats['blacklisted_tokens'] == 0

def test_get_status(security_manager):
    # Obtener estado
    status = security_manager.get_status()
    
    # Verificar propiedades
    assert status['token_expiry'] == 3600
    assert status['password_salt_rounds'] == 12
    assert status['max_login_attempts'] == 3
    assert status['lockout_duration'] == 300
    assert 'metrics' in status

def test_invalid_token(security_manager):
    # Intentar validar token inválido
    with pytest.raises(SecurityManagerError):
        security_manager.validate_token('invalid_token')
    
    # Verificar métricas
    assert security_manager.metrics['security_errors'] == 1 