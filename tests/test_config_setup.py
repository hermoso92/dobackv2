import pytest
import json
import os
from src.app.config.setup_config import ConfigSetup

@pytest.fixture
def config_setup():
    """Fixture para el gestor de configuración."""
    return ConfigSetup()

@pytest.fixture
def test_config():
    """Fixture para la configuración de prueba."""
    return {
        'app': {
            'name': 'StabiliSafe',
            'version': '2.0.0',
            'environment': 'test'
        },
        'logging': {
            'level': 'DEBUG',
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            'file': 'logs/DobackSoft_test.log'
        },
        'database': {
            'host': 'localhost',
            'port': 5432,
            'name': 'DobackSoft_test',
            'user': 'DobackSoft',
            'password': 'DobackSoft'
        },
        'security': {
            'secret_key': 'test_key',
            'token_expiration': 3600,
            'password_hash_rounds': 12
        },
        'notification': {
            'email': {
                'enabled': False,
                'smtp_host': 'smtp.gmail.com',
                'smtp_port': 587,
                'username': '',
                'password': ''
            },
            'sms': {
                'enabled': False,
                'provider': 'twilio',
                'account_sid': '',
                'auth_token': ''
            },
            'push': {
                'enabled': False,
                'provider': 'firebase',
                'credentials_file': ''
            }
        },
        'cache': {
            'type': 'redis',
            'host': 'localhost',
            'port': 6379,
            'db': 0,
            'max_size': 1000
        },
        'task': {
            'max_workers': 4,
            'timeout': 30,
            'retry_attempts': 3
        },
        'file': {
            'max_size': 10485760,
            'allowed_extensions': ['.txt', '.pdf'],
            'storage_path': 'storage/test'
        },
        'metrics': {
            'max_metrics': 1000,
            'retention_period': 3600,
            'collection_interval': 60
        }
    }

def test_init_config_setup(config_setup):
    """Prueba la inicialización del gestor de configuración."""
    assert config_setup.config_dir == 'config'
    assert config_setup.config_file == 'config.json'
    assert config_setup.template_file == 'config.template.json'

def test_generate_config(config_setup):
    """Prueba la generación de configuración."""
    config = config_setup.generate_config('test')
    
    assert 'app' in config
    assert 'logging' in config
    assert 'database' in config
    assert 'security' in config
    assert 'notification' in config
    assert 'cache' in config
    assert 'task' in config
    assert 'file' in config
    assert 'metrics' in config
    
    assert config['app']['environment'] == 'test'
    assert config['logging']['level'] == 'DEBUG'
    assert config['database']['name'] == 'DobackSoft_test'
    assert config['file']['storage_path'] == 'storage/test'

def test_validate_config(config_setup, test_config):
    """Prueba la validación de configuración."""
    assert config_setup.validate_config(test_config)
    
    # Probar configuración inválida
    invalid_config = test_config.copy()
    del invalid_config['app']
    assert not config_setup.validate_config(invalid_config)
    
    # Probar sin secret key
    invalid_config = test_config.copy()
    invalid_config['security']['secret_key'] = ''
    assert not config_setup.validate_config(invalid_config)
    
    # Probar sin contraseña de base de datos
    invalid_config = test_config.copy()
    invalid_config['database']['password'] = ''
    assert not config_setup.validate_config(invalid_config)

def test_save_config(config_setup, test_config):
    """Prueba guardar configuración."""
    # Guardar configuración
    config_setup.save_config(test_config)
    
    # Verificar archivo
    config_path = os.path.join(config_setup.config_dir, config_setup.config_file)
    assert os.path.exists(config_path)
    
    # Cargar y verificar contenido
    with open(config_path, 'r') as f:
        saved_config = json.load(f)
    
    assert saved_config == test_config
    
    # Limpiar
    os.remove(config_path)
    os.rmdir(config_setup.config_dir)

def test_load_template(config_setup):
    """Prueba cargar plantilla."""
    # Crear plantilla de prueba
    template = {'test': 'template'}
    os.makedirs(config_setup.config_dir, exist_ok=True)
    with open(os.path.join(config_setup.config_dir, config_setup.template_file), 'w') as f:
        json.dump(template, f)
    
    # Cargar plantilla
    loaded_template = config_setup._load_template()
    assert loaded_template == template
    
    # Limpiar
    os.remove(os.path.join(config_setup.config_dir, config_setup.template_file))
    os.rmdir(config_setup.config_dir)

def test_generate_secret_key(config_setup):
    """Prueba generar clave secreta."""
    key = config_setup._generate_secret_key()
    assert isinstance(key, str)
    assert len(key) == 64  # 32 bytes en hex

def test_environment_specific_config(config_setup):
    """Prueba configuración específica por entorno."""
    # Desarrollo
    dev_config = config_setup.generate_config('development')
    assert dev_config['logging']['level'] == 'DEBUG'
    assert dev_config['database']['name'] == 'DobackSoft_development'
    
    # Producción
    prod_config = config_setup.generate_config('production')
    assert prod_config['logging']['level'] == 'INFO'
    assert prod_config['database']['name'] == 'DobackSoft_production'
    
    # Pruebas
    test_config = config_setup.generate_config('test')
    assert test_config['logging']['level'] == 'DEBUG'
    assert test_config['database']['name'] == 'DobackSoft_test' 