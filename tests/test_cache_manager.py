import pytest
import os
import json
import time
from unittest.mock import patch, MagicMock
from src.app.services.cache_manager import CacheManager
from src.app.exceptions import CacheManagerError

@pytest.fixture
def cache_manager():
    config = {
        'cache_enabled': True,
        'cache_type': 'redis',
        'cache_dir': 'test_cache',
        'max_cache_size': 100,
        'default_ttl': 3600,
        'redis_host': 'localhost',
        'redis_port': 6379,
        'redis_db': 0,
        'redis_password': None
    }
    return CacheManager(config)

@pytest.fixture(autouse=True)
def cleanup():
    yield
    # Limpiar archivos de test
    if os.path.exists('test_cache'):
        for file in os.listdir('test_cache'):
            os.remove(os.path.join('test_cache', file))
        os.rmdir('test_cache')

def test_init_cache_manager(cache_manager):
    # Verificar configuración
    assert cache_manager.enabled == True
    assert cache_manager.cache_type == 'redis'
    assert cache_manager.cache_dir == 'test_cache'
    assert cache_manager.max_size == 100
    assert cache_manager.default_ttl == 3600
    assert cache_manager.redis_host == 'localhost'
    assert cache_manager.redis_port == 6379
    assert cache_manager.redis_db == 0
    assert cache_manager.redis_password == None
    
    # Verificar métricas iniciales
    assert cache_manager.metrics['total_operations'] == 0
    assert cache_manager.metrics['hits'] == 0
    assert cache_manager.metrics['misses'] == 0
    assert cache_manager.metrics['evictions'] == 0
    assert cache_manager.metrics['errors'] == 0
    assert cache_manager.metrics['size'] == 0

@patch('redis.Redis')
def test_init_redis_client(mock_redis, cache_manager):
    # Configurar mock
    mock_client = MagicMock()
    mock_redis.return_value = mock_client
    
    # Inicializar cliente
    cache_manager._init_cache_client()
    
    # Verificar que se creó el cliente Redis
    mock_redis.assert_called_once_with(
        host=cache_manager.redis_host,
        port=cache_manager.redis_port,
        db=cache_manager.redis_db,
        password=cache_manager.redis_password,
        decode_responses=True
    )
    
    # Verificar que se llamó a ping
    mock_client.ping.assert_called_once()

def test_init_file_cache(cache_manager):
    # Cambiar tipo de caché a archivo
    cache_manager.cache_type = 'file'
    
    # Inicializar cliente
    cache_manager._init_cache_client()
    
    # Verificar que se creó el directorio
    assert os.path.exists('test_cache')

def test_init_invalid_cache_type(cache_manager):
    # Cambiar a tipo inválido
    cache_manager.cache_type = 'invalid'
    
    # Verificar que se lanza error
    with pytest.raises(CacheManagerError):
        cache_manager._init_cache_client()

@patch('redis.Redis')
def test_get_redis(mock_redis, cache_manager):
    # Configurar mock
    mock_client = MagicMock()
    mock_redis.return_value = mock_client
    mock_client.get.return_value = json.dumps({'test': 'value'})
    
    # Obtener valor
    value = cache_manager.get('test_key')
    
    # Verificar que se llamó a get
    mock_client.get.assert_called_once_with('test_key')
    
    # Verificar valor
    assert value == {'test': 'value'}
    
    # Verificar métricas
    assert cache_manager.metrics['total_operations'] == 1
    assert cache_manager.metrics['hits'] == 1
    assert cache_manager.metrics['misses'] == 0

def test_get_file(cache_manager):
    # Cambiar tipo de caché a archivo
    cache_manager.cache_type = 'file'
    
    # Crear archivo de caché
    cache_file = os.path.join('test_cache', 'test_key.json')
    data = {
        'value': {'test': 'value'},
        'expires_at': (time.time() + 3600).isoformat()
    }
    os.makedirs('test_cache', exist_ok=True)
    with open(cache_file, 'w') as f:
        json.dump(data, f)
    
    # Obtener valor
    value = cache_manager.get('test_key')
    
    # Verificar valor
    assert value == {'test': 'value'}
    
    # Verificar métricas
    assert cache_manager.metrics['total_operations'] == 1
    assert cache_manager.metrics['hits'] == 1
    assert cache_manager.metrics['misses'] == 0

def test_get_expired_file(cache_manager):
    # Cambiar tipo de caché a archivo
    cache_manager.cache_type = 'file'
    
    # Crear archivo de caché expirado
    cache_file = os.path.join('test_cache', 'test_key.json')
    data = {
        'value': {'test': 'value'},
        'expires_at': (time.time() - 3600).isoformat()
    }
    os.makedirs('test_cache', exist_ok=True)
    with open(cache_file, 'w') as f:
        json.dump(data, f)
    
    # Obtener valor
    value = cache_manager.get('test_key')
    
    # Verificar que el archivo se eliminó
    assert not os.path.exists(cache_file)
    
    # Verificar valor
    assert value is None
    
    # Verificar métricas
    assert cache_manager.metrics['total_operations'] == 1
    assert cache_manager.metrics['hits'] == 0
    assert cache_manager.metrics['misses'] == 1

@patch('redis.Redis')
def test_set_redis(mock_redis, cache_manager):
    # Configurar mock
    mock_client = MagicMock()
    mock_redis.return_value = mock_client
    
    # Establecer valor
    cache_manager.set('test_key', {'test': 'value'}, 3600)
    
    # Verificar que se llamó a setex
    mock_client.setex.assert_called_once_with(
        'test_key',
        3600,
        json.dumps({'test': 'value'})
    )
    
    # Verificar métricas
    assert cache_manager.metrics['total_operations'] == 1
    assert cache_manager.metrics['size'] == 1

def test_set_file(cache_manager):
    # Cambiar tipo de caché a archivo
    cache_manager.cache_type = 'file'
    
    # Establecer valor
    cache_manager.set('test_key', {'test': 'value'}, 3600)
    
    # Verificar archivo
    cache_file = os.path.join('test_cache', 'test_key.json')
    assert os.path.exists(cache_file)
    
    with open(cache_file, 'r') as f:
        data = json.load(f)
    
    assert data['value'] == {'test': 'value'}
    assert 'expires_at' in data
    
    # Verificar métricas
    assert cache_manager.metrics['total_operations'] == 1
    assert cache_manager.metrics['size'] == 1

@patch('redis.Redis')
def test_delete_redis(mock_redis, cache_manager):
    # Configurar mock
    mock_client = MagicMock()
    mock_redis.return_value = mock_client
    
    # Eliminar valor
    cache_manager.delete('test_key')
    
    # Verificar que se llamó a delete
    mock_client.delete.assert_called_once_with('test_key')
    
    # Verificar métricas
    assert cache_manager.metrics['total_operations'] == 1
    assert cache_manager.metrics['size'] == 0

def test_delete_file(cache_manager):
    # Cambiar tipo de caché a archivo
    cache_manager.cache_type = 'file'
    
    # Crear archivo de caché
    cache_file = os.path.join('test_cache', 'test_key.json')
    os.makedirs('test_cache', exist_ok=True)
    with open(cache_file, 'w') as f:
        json.dump({'value': 'test'}, f)
    
    # Eliminar valor
    cache_manager.delete('test_key')
    
    # Verificar que el archivo se eliminó
    assert not os.path.exists(cache_file)
    
    # Verificar métricas
    assert cache_manager.metrics['total_operations'] == 1
    assert cache_manager.metrics['size'] == 0

@patch('redis.Redis')
def test_exists_redis(mock_redis, cache_manager):
    # Configurar mock
    mock_client = MagicMock()
    mock_redis.return_value = mock_client
    mock_client.exists.return_value = True
    
    # Verificar existencia
    exists = cache_manager.exists('test_key')
    
    # Verificar que se llamó a exists
    mock_client.exists.assert_called_once_with('test_key')
    
    # Verificar resultado
    assert exists == True
    
    # Verificar métricas
    assert cache_manager.metrics['total_operations'] == 1

def test_exists_file(cache_manager):
    # Cambiar tipo de caché a archivo
    cache_manager.cache_type = 'file'
    
    # Crear archivo de caché
    cache_file = os.path.join('test_cache', 'test_key.json')
    data = {
        'value': {'test': 'value'},
        'expires_at': (time.time() + 3600).isoformat()
    }
    os.makedirs('test_cache', exist_ok=True)
    with open(cache_file, 'w') as f:
        json.dump(data, f)
    
    # Verificar existencia
    exists = cache_manager.exists('test_key')
    
    # Verificar resultado
    assert exists == True
    
    # Verificar métricas
    assert cache_manager.metrics['total_operations'] == 1

@patch('redis.Redis')
def test_clear_redis(mock_redis, cache_manager):
    # Configurar mock
    mock_client = MagicMock()
    mock_redis.return_value = mock_client
    
    # Limpiar caché
    cache_manager.clear()
    
    # Verificar que se llamó a flushdb
    mock_client.flushdb.assert_called_once()
    
    # Verificar métricas
    assert cache_manager.metrics['size'] == 0

def test_clear_file(cache_manager):
    # Cambiar tipo de caché a archivo
    cache_manager.cache_type = 'file'
    
    # Crear archivos de caché
    os.makedirs('test_cache', exist_ok=True)
    for i in range(3):
        with open(os.path.join('test_cache', f'test_key_{i}.json'), 'w') as f:
            json.dump({'value': f'test_{i}'}, f)
    
    # Limpiar caché
    cache_manager.clear()
    
    # Verificar que se eliminaron los archivos
    assert len(os.listdir('test_cache')) == 0
    
    # Verificar métricas
    assert cache_manager.metrics['size'] == 0

@patch('redis.Redis')
def test_get_ttl_redis(mock_redis, cache_manager):
    # Configurar mock
    mock_client = MagicMock()
    mock_redis.return_value = mock_client
    mock_client.ttl.return_value = 3600
    
    # Obtener TTL
    ttl = cache_manager.get_ttl('test_key')
    
    # Verificar que se llamó a ttl
    mock_client.ttl.assert_called_once_with('test_key')
    
    # Verificar resultado
    assert ttl == 3600

def test_get_ttl_file(cache_manager):
    # Cambiar tipo de caché a archivo
    cache_manager.cache_type = 'file'
    
    # Crear archivo de caché
    cache_file = os.path.join('test_cache', 'test_key.json')
    data = {
        'value': {'test': 'value'},
        'expires_at': (time.time() + 3600).isoformat()
    }
    os.makedirs('test_cache', exist_ok=True)
    with open(cache_file, 'w') as f:
        json.dump(data, f)
    
    # Obtener TTL
    ttl = cache_manager.get_ttl('test_key')
    
    # Verificar resultado
    assert isinstance(ttl, int)
    assert ttl > 0

def test_evict_oldest_file(cache_manager):
    # Cambiar tipo de caché a archivo
    cache_manager.cache_type = 'file'
    
    # Crear archivos de caché
    os.makedirs('test_cache', exist_ok=True)
    for i in range(3):
        with open(os.path.join('test_cache', f'test_key_{i}.json'), 'w') as f:
            json.dump({'value': f'test_{i}'}, f)
        time.sleep(0.1)  # Asegurar diferentes timestamps
    
    # Establecer tamaño máximo
    cache_manager.max_size = 2
    
    # Establecer nuevo valor
    cache_manager.set('test_key_3', {'test': 'value'})
    
    # Verificar que se eliminó el archivo más antiguo
    files = os.listdir('test_cache')
    assert len(files) == 2
    assert 'test_key_0.json' not in files
    
    # Verificar métricas
    assert cache_manager.metrics['evictions'] == 1
    assert cache_manager.metrics['size'] == 2

def test_get_cache_stats(cache_manager):
    # Realizar algunas operaciones
    cache_manager.set('test_key', {'test': 'value'})
    cache_manager.get('test_key')
    cache_manager.get('nonexistent_key')
    
    # Obtener estadísticas
    stats = cache_manager.get_cache_stats()
    
    # Verificar estadísticas
    assert stats['enabled'] == True
    assert stats['type'] == 'redis'
    assert stats['size'] == 1
    assert stats['max_size'] == 100
    assert stats['total_operations'] == 3
    assert stats['hits'] == 1
    assert stats['misses'] == 1
    assert stats['hit_ratio'] == 0.5
    assert stats['evictions'] == 0
    assert stats['errors'] == 0

def test_get_status(cache_manager):
    # Obtener estado
    status = cache_manager.get_status()
    
    # Verificar propiedades
    assert status['enabled'] == True
    assert status['type'] == 'redis'
    assert status['cache_dir'] == None
    assert status['max_size'] == 100
    assert status['default_ttl'] == 3600
    assert status['redis_host'] == 'localhost'
    assert status['redis_port'] == 6379
    assert status['redis_db'] == 0
    assert 'metrics' in status

@patch('redis.Redis')
def test_redis_error(mock_redis, cache_manager):
    # Configurar mock para lanzar error
    mock_client = MagicMock()
    mock_redis.return_value = mock_client
    mock_client.ping.side_effect = Exception("Redis Error")
    
    # Verificar que se lanza error
    with pytest.raises(CacheManagerError):
        cache_manager._init_cache_client()
    
    # Verificar métricas
    assert cache_manager.metrics['errors'] == 0  # No se incrementa en init

def test_file_error(cache_manager):
    # Cambiar tipo de caché a archivo
    cache_manager.cache_type = 'file'
    
    # Crear archivo de caché inválido
    cache_file = os.path.join('test_cache', 'test_key.json')
    os.makedirs('test_cache', exist_ok=True)
    with open(cache_file, 'w') as f:
        f.write('invalid json')
    
    # Verificar que se lanza error al obtener valor
    with pytest.raises(CacheManagerError):
        cache_manager.get('test_key')
    
    # Verificar métricas
    assert cache_manager.metrics['errors'] == 1 