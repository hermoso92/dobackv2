import pytest
import os
import json
import zlib
from datetime import datetime, timedelta
from src.app.services.enhanced_data_persistence import EnhancedDataPersistence
from src.app.exceptions import ValidationError, DataIntegrityError

@pytest.fixture
def persistence():
    """Fixture para crear una instancia de EnhancedDataPersistence."""
    config = {
        'data_dir': 'test_data',
        'cache_ttl': 300,
        'cache_size': 1000
    }
    persistence = EnhancedDataPersistence(config)
    yield persistence
    
    # Limpiar después de las pruebas
    if os.path.exists('test_data'):
        for root, dirs, files in os.walk('test_data', topdown=False):
            for name in files:
                os.remove(os.path.join(root, name))
            for name in dirs:
                os.rmdir(os.path.join(root, name))
        os.rmdir('test_data')

def test_save_and_load_config(persistence):
    """Test para guardar y cargar configuración."""
    config_name = 'test_config'
    config_data = {
        'param1': 'value1',
        'param2': 123,
        'param3': [1, 2, 3]
    }
    
    # Guardar configuración
    persistence.save_config(config_name, config_data)
    
    # Cargar configuración
    loaded_config = persistence.load_config(config_name)
    
    assert loaded_config == config_data
    assert '_hash' not in loaded_config

def test_config_integrity(persistence):
    """Test para validar integridad de configuración."""
    config_name = 'test_config'
    config_data = {
        'param1': 'value1',
        'param2': 123
    }
    
    # Guardar configuración
    persistence.save_config(config_name, config_data)
    
    # Modificar archivo directamente
    file_path = os.path.join(persistence.config_dir, f'{config_name}.json')
    with open(file_path, 'rb') as f:
        compressed_data = f.read()
    modified_data = json.loads(zlib.decompress(compressed_data).decode())
    modified_data['param1'] = 'modified_value'
    compressed_modified = zlib.compress(json.dumps(modified_data).encode())
    with open(file_path, 'wb') as f:
        f.write(compressed_modified)
    
    # Intentar cargar configuración modificada
    with pytest.raises(DataIntegrityError):
        persistence.load_config(config_name)

def test_cache_functionality(persistence):
    """Test para funcionalidad de caché."""
    config_name = 'test_config'
    config_data = {
        'param1': 'value1',
        'param2': 123
    }
    
    # Guardar y cargar configuración
    persistence.save_config(config_name, config_data)
    persistence.load_config(config_name)
    
    # Verificar que está en caché
    assert f'config_{config_name}' in persistence._cache
    assert persistence._cache[f'config_{config_name}'] == config_data

def test_cache_expiration(persistence):
    """Test para expiración de caché."""
    config_name = 'test_config'
    config_data = {
        'param1': 'value1',
        'param2': 123
    }
    
    # Guardar configuración
    persistence.save_config(config_name, config_data)
    
    # Modificar timestamp de caché
    persistence._cache_timestamps[f'config_{config_name}'] = datetime.now() - timedelta(seconds=301)
    
    # Intentar obtener de caché
    assert persistence._get_from_cache(f'config_{config_name}') is None

def test_save_and_get_alarms(persistence):
    """Test para guardar y obtener alarmas."""
    alarm_data = {
        'type': 'LTR',
        'level': 'warning',
        'value': 0.7,
        'threshold': 0.6
    }
    
    # Guardar alarma
    persistence.save_alarm(alarm_data)
    
    # Obtener alarmas
    alarms = persistence.get_alarms()
    
    assert len(alarms) == 1
    assert alarms[0]['type'] == alarm_data['type']
    assert alarms[0]['level'] == alarm_data['level']
    assert alarms[0]['value'] == alarm_data['value']
    assert alarms[0]['threshold'] == alarm_data['threshold']
    assert 'timestamp' in alarms[0]
    assert '_hash' not in alarms[0]

def test_alarm_time_filtering(persistence):
    """Test para filtrado de alarmas por tiempo."""
    # Crear alarmas en diferentes momentos
    for i in range(3):
        alarm_data = {
            'type': 'LTR',
            'level': 'warning',
            'value': 0.7 + i,
            'threshold': 0.6
        }
        persistence.save_alarm(alarm_data)
    
    # Obtener alarmas en un rango de tiempo
    start_time = datetime.now() - timedelta(minutes=5)
    end_time = datetime.now() + timedelta(minutes=5)
    alarms = persistence.get_alarms(start_time=start_time, end_time=end_time)
    
    assert len(alarms) == 3

def test_cleanup_and_backup(persistence):
    """Test para limpieza y backup de datos."""
    # Crear datos antiguos
    old_date = datetime.now() - timedelta(days=31)
    old_dir = os.path.join(persistence.base_dir, old_date.strftime('%Y%m%d'))
    os.makedirs(old_dir, exist_ok=True)
    
    with open(os.path.join(old_dir, 'test.txt'), 'w') as f:
        f.write('test data')
    
    # Ejecutar limpieza
    persistence.cleanup_old_data(days_to_keep=30)
    
    # Verificar que los datos antiguos se movieron a backup
    assert not os.path.exists(old_dir)
    backup_files = [f for f in os.listdir(persistence.backup_dir) if f.endswith('.zip')]
    assert len(backup_files) == 1

def test_system_status(persistence):
    """Test para obtener estado del sistema."""
    # Crear algunos datos
    config_data = {'param': 'value'}
    persistence.save_config('test_config', config_data)
    
    alarm_data = {'type': 'LTR', 'level': 'warning'}
    persistence.save_alarm(alarm_data)
    
    # Obtener estado
    status = persistence.get_system_status()
    
    assert status['config_count'] == 1
    assert status['alarm_count'] == 1
    assert status['cache_size'] == 1
    assert status['total_size'] > 0 