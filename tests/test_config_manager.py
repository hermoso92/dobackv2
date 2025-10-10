import pytest
import os
import json
import yaml
from datetime import datetime
from src.app.services.config_manager import ConfigManager
from src.app.exceptions import ConfigError, ConfigManagerError

@pytest.fixture
def config_manager():
    config = {
        'config_dir': 'test_config',
        'config_file': 'test_config.json',
        'backup_dir': 'test_config/backups',
        'max_backups': 3
    }
    return ConfigManager(config)

@pytest.fixture(autouse=True)
def cleanup():
    yield
    # Limpiar archivos de test
    if os.path.exists('test_config'):
        for file in os.listdir('test_config/backups'):
            os.remove(os.path.join('test_config/backups', file))
        os.rmdir('test_config/backups')
        for file in os.listdir('test_config'):
            os.remove(os.path.join('test_config', file))
        os.rmdir('test_config')

def test_init_config_manager(config_manager):
    # Verificar configuración
    assert config_manager.config_dir == 'test_config'
    assert config_manager.config_file == 'test_config.json'
    assert config_manager.backup_dir == 'test_config/backups'
    assert config_manager.max_backups == 3
    
    # Verificar que se crearon los directorios
    assert os.path.exists('test_config')
    assert os.path.exists('test_config/backups')
    
    # Verificar métricas iniciales
    assert config_manager.metrics['total_configs'] == 0
    assert config_manager.metrics['configs_by_type'] == {}
    assert config_manager.metrics['backups'] == 0
    assert config_manager.metrics['errors'] == 0

def test_load_config(config_manager):
    # Crear archivo de configuración
    config_data = {
        'test_key': 'test_value',
        'test_number': 123,
        'test_list': [1, 2, 3],
        'test_dict': {'key': 'value'}
    }
    
    os.makedirs('test_config', exist_ok=True)
    with open('test_config/test_config.json', 'w') as f:
        json.dump(config_data, f)
    
    # Cargar configuración
    config_manager._load_config()
    
    # Verificar configuración
    assert config_manager.settings == config_data
    
    # Verificar métricas
    assert config_manager.metrics['total_configs'] == 4
    assert config_manager.metrics['configs_by_type']['str'] == 1
    assert config_manager.metrics['configs_by_type']['int'] == 1
    assert config_manager.metrics['configs_by_type']['list'] == 1
    assert config_manager.metrics['configs_by_type']['dict'] == 1

def test_save_config(config_manager):
    # Crear configuración
    config_data = {
        'test_key': 'test_value',
        'test_number': 123
    }
    config_manager.settings = config_data
    
    # Guardar configuración
    config_manager._save_config()
    
    # Verificar archivo
    assert os.path.exists('test_config/test_config.json')
    
    with open('test_config/test_config.json', 'r') as f:
        saved_data = json.load(f)
    
    assert saved_data == config_data

def test_create_backup(config_manager):
    # Crear configuración inicial
    config_data = {'test_key': 'test_value'}
    config_manager.settings = config_data
    config_manager._save_config()
    
    # Crear backups
    for i in range(5):  # Más que max_backups
        config_manager.settings[f'key_{i}'] = f'value_{i}'
        config_manager._save_config()
    
    # Verificar backups
    backups = os.listdir('test_config/backups')
    assert len(backups) == 3  # max_backups
    
    # Verificar que se mantienen los backups más recientes
    backup_numbers = [int(b.split('_')[1].split('.')[0]) for b in backups]
    assert max(backup_numbers) == 5
    assert min(backup_numbers) == 3

def test_get_set_delete(config_manager):
    # Establecer valor
    config_manager.set('test_key', 'test_value')
    assert config_manager.settings['test_key'] == 'test_value'
    
    # Obtener valor
    value = config_manager.get('test_key')
    assert value == 'test_value'
    
    # Obtener valor por defecto
    default_value = config_manager.get('nonexistent_key', 'default')
    assert default_value == 'default'
    
    # Eliminar valor
    config_manager.delete('test_key')
    assert 'test_key' not in config_manager.settings

def test_get_all(config_manager):
    # Crear configuración
    config_data = {
        'key1': 'value1',
        'key2': 'value2',
        'key3': 'value3'
    }
    config_manager.settings = config_data
    
    # Obtener toda la configuración
    all_config = config_manager.get_all()
    assert all_config == config_data

def test_get_config_stats(config_manager):
    # Crear configuración
    config_data = {
        'str_key': 'value',
        'int_key': 123,
        'list_key': [1, 2, 3],
        'dict_key': {'key': 'value'}
    }
    config_manager.settings = config_data
    config_manager._update_metrics()
    
    # Obtener estadísticas
    stats = config_manager.get_config_stats()
    
    # Verificar estadísticas
    assert stats['total_configs'] == 4
    assert stats['configs_by_type']['str'] == 1
    assert stats['configs_by_type']['int'] == 1
    assert stats['configs_by_type']['list'] == 1
    assert stats['configs_by_type']['dict'] == 1
    assert stats['backups'] == 0
    assert stats['errors'] == 0

def test_get_status(config_manager):
    # Obtener estado
    status = config_manager.get_status()
    
    # Verificar propiedades
    assert status['config_dir'] == 'test_config'
    assert status['config_file'] == 'test_config.json'
    assert status['backup_dir'] == 'test_config/backups'
    assert status['max_backups'] == 3
    assert 'metrics' in status

def test_invalid_file_format(config_manager):
    # Crear archivo con formato inválido
    os.makedirs('test_config', exist_ok=True)
    with open('test_config/test_config.txt', 'w') as f:
        f.write('invalid format')
    
    # Intentar cargar configuración
    with pytest.raises(ConfigManagerError):
        config_manager._load_config()

def test_file_permission_error(config_manager):
    # Crear directorio sin permisos de escritura
    os.makedirs('test_config', exist_ok=True)
    os.chmod('test_config', 0o444)
    
    # Intentar guardar configuración
    with pytest.raises(ConfigManagerError):
        config_manager.set('test_key', 'test_value')
    
    # Restaurar permisos
    os.chmod('test_config', 0o755) 