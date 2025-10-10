import pytest
import os
import time
from datetime import datetime, timedelta
from src.app.services.session_manager import SessionManager, Session
from src.app.exceptions import SessionError

@pytest.fixture
def session_manager():
    config = {
        'session_dir': 'test_sessions',
        'session_timeout': 24,  # horas
        'max_sessions': 1000,
        'session_cleanup': True
    }
    return SessionManager(config)

@pytest.fixture(autouse=True)
def cleanup():
    # Limpiar directorios de prueba
    yield
    for dir_name in ['test_sessions']:
        if os.path.exists(dir_name):
            import shutil
            shutil.rmtree(dir_name)

def test_session_creation():
    # Crear sesión
    session = Session('test_user', {'test': 'data'})
    
    # Verificar propiedades
    assert session.user_id == 'test_user'
    assert session.data == {'test': 'data'}
    assert session.created_at is not None
    assert session.last_activity is not None
    assert not session.expires_at
    assert session.is_active

def test_session_to_dict():
    # Crear sesión
    session = Session('test_user', {'test': 'data'})
    session.expires_at = datetime.now() + timedelta(hours=1)
    
    # Convertir a diccionario
    session_dict = session.to_dict()
    
    # Verificar propiedades
    assert session_dict['user_id'] == 'test_user'
    assert session_dict['data'] == {'test': 'data'}
    assert session_dict['created_at'] is not None
    assert session_dict['last_activity'] is not None
    assert session_dict['expires_at'] is not None
    assert session_dict['is_active']

def test_create_session(session_manager):
    # Crear sesión
    data = {'user_role': 'admin'}
    session = session_manager.create_session('user123', data)
    
    # Verificar propiedades
    assert session.user_id == 'user123'
    assert session.data == data
    assert session.is_active
    assert not session.is_expired()
    
    # Verificar métricas
    assert session_manager.metrics['total_sessions'] == 1
    assert session_manager.metrics['active_sessions'] == 1
    assert session_manager.metrics['user_sessions']['user123'] == 1

def test_create_session_max_limit(session_manager):
    # Configurar límite bajo para pruebas
    session_manager.max_sessions = 2
    
    # Crear sesiones hasta el límite
    session1 = session_manager.create_session('user1')
    session2 = session_manager.create_session('user2')
    
    # Intentar crear una sesión más
    with pytest.raises(SessionError) as exc:
        session_manager.create_session('user3')
    
    assert "Se ha alcanzado el límite máximo de sesiones" in str(exc.value)

def test_get_session(session_manager):
    # Crear sesión
    session = session_manager.create_session('user123')
    
    # Obtener sesión
    retrieved_session = session_manager.get_session(session.session_id)
    
    # Verificar propiedades
    assert retrieved_session is not None
    assert retrieved_session.session_id == session.session_id
    assert retrieved_session.user_id == 'user123'
    assert retrieved_session.is_active
    assert not retrieved_session.is_expired()

def test_get_session_expired(session_manager):
    # Crear sesión
    session = session_manager.create_session('user123')
    
    # Forzar expiración
    session.expires_at = datetime.now() - timedelta(hours=1)
    
    # Intentar obtener sesión expirada
    retrieved_session = session_manager.get_session(session.session_id)
    
    # Verificar que la sesión fue invalidada
    assert retrieved_session is None
    assert session_manager.metrics['active_sessions'] == 0
    assert session_manager.metrics['expired_sessions'] == 1

def test_update_session(session_manager):
    # Crear sesión
    session = session_manager.create_session('user123')
    
    # Actualizar datos
    new_data = {'user_role': 'admin'}
    updated_session = session_manager.update_session(session.session_id, new_data)
    
    # Verificar actualización
    assert updated_session.data == new_data
    assert updated_session.last_activity > session.last_activity

def test_update_session_not_found(session_manager):
    # Intentar actualizar sesión inexistente
    with pytest.raises(SessionError) as exc:
        session_manager.update_session('invalid_session', {})
    
    assert "Sesión no encontrada" in str(exc.value)

def test_invalidate_session(session_manager):
    # Crear sesión
    session = session_manager.create_session('user123')
    
    # Invalidar sesión
    session_manager.invalidate_session(session.session_id)
    
    # Verificar estado
    assert not session.is_active
    assert session_manager.metrics['active_sessions'] == 0
    assert session_manager.metrics['expired_sessions'] == 1
    assert session_manager.metrics['user_sessions']['user123'] == 0

def test_cleanup_sessions(session_manager):
    # Crear sesiones
    session1 = session_manager.create_session('user1')
    session2 = session_manager.create_session('user2')
    
    # Forzar expiración de una sesión
    session1.expires_at = datetime.now() - timedelta(hours=1)
    
    # Limpiar sesiones
    session_manager.cleanup_sessions()
    
    # Verificar estado
    assert session_manager.metrics['active_sessions'] == 1
    assert session_manager.metrics['expired_sessions'] == 1
    assert session_manager.get_session(session1.session_id) is None
    assert session_manager.get_session(session2.session_id) is not None

def test_get_user_sessions(session_manager):
    # Crear sesiones para el mismo usuario
    session1 = session_manager.create_session('user123')
    session2 = session_manager.create_session('user123')
    
    # Obtener sesiones del usuario
    user_sessions = session_manager.get_user_sessions('user123')
    
    # Verificar sesiones
    assert len(user_sessions) == 2
    assert all(s.user_id == 'user123' for s in user_sessions)
    assert all(s.is_active for s in user_sessions)

def test_get_session_stats(session_manager):
    # Crear sesiones
    session1 = session_manager.create_session('user1')
    session2 = session_manager.create_session('user2')
    
    # Invalidar una sesión
    session_manager.invalidate_session(session1.session_id)
    
    # Obtener estadísticas
    stats = session_manager.get_session_stats()
    
    # Verificar estadísticas
    assert stats['total_sessions'] == 2
    assert stats['active_sessions'] == 1
    assert stats['expired_sessions'] == 1
    assert stats['user_sessions']['user1'] == 0
    assert stats['user_sessions']['user2'] == 1

def test_get_status(session_manager):
    # Obtener estado
    status = session_manager.get_status()
    
    # Verificar propiedades
    assert isinstance(status, dict)
    assert 'session_dir' in status
    assert 'session_timeout' in status
    assert 'max_sessions' in status
    assert 'session_cleanup' in status
    assert 'stats' in status 