import pytest
import os
import json
from pathlib import Path
from src.automation.validations.config_validation import (
    validate_config_file,
    validate_config_structure,
    validate_config_values,
    validate_config_permissions,
    validate_config_backup,
    validate_global_config,
    validate_company_config,
    validate_config_schema,
    validate_config_dependencies,
    validate_env_variables,
    validate_system_params,
    validate_database_config,
    validate_api_config,
    validate_security_config,
    validate_logging_config,
    validate_email_config,
    validate_storage_config,
    validate_caching_config
)
from datetime import datetime, timedelta

# Fixtures para configuración de prueba
@pytest.fixture
def valid_config(tmp_path):
    """Fixture que proporciona una configuración válida"""
    config_path = tmp_path / "config.json"
    config_data = {
        'system': {
            'name': 'DobackSoft V2',
            'version': '2.0.0',
            'environment': 'production',
            'debug': False,
            'log_level': 'INFO',
            'log_path': '/var/log/DobackSoft',
            'backup_path': '/var/backups/DobackSoft',
            'max_file_size': 10485760,  # 10MB
            'allowed_extensions': ['.csv', '.json', '.xlsx'],
            'api': {
                'host': '0.0.0.0',
                'port': 5000,
                'timeout': 30,
                'rate_limit': 100
            },
            'database': {
                'host': 'localhost',
                'port': 5432,
                'name': 'DobackSoft',
                'user': 'DobackSoft',
                'password': '********'
            },
            'security': {
                'jwt_secret': '********',
                'jwt_expiration': 3600,
                'password_min_length': 8,
                'password_require_special': True,
                'session_timeout': 1800
            },
            'notifications': {
                'email': {
                    'enabled': True,
                    'smtp_host': 'smtp.example.com',
                    'smtp_port': 587,
                    'smtp_user': 'notifications@example.com',
                    'smtp_password': '********'
                },
                'sms': {
                    'enabled': False,
                    'provider': 'twilio',
                    'account_sid': '********',
                    'auth_token': '********'
                }
            }
        }
    }
    config_path.write_text(json.dumps(config_data, indent=4))
    return str(config_path)

@pytest.fixture
def invalid_config(tmp_path):
    """Fixture que proporciona una configuración inválida"""
    config_path = tmp_path / "config.json"
    config_data = {
        'system': {
            'name': 123,  # Debe ser string
            'version': 'invalid',  # Formato inválido
            'environment': 'invalid_env',  # Valor no permitido
            'debug': 'true',  # Debe ser boolean
            'log_level': 'INVALID',  # Valor no permitido
            'log_path': 123,  # Debe ser string
            'backup_path': None,  # No puede ser null
            'max_file_size': '10MB',  # Debe ser integer
            'allowed_extensions': 'csv,json',  # Debe ser lista
            'api': {
                'host': 'invalid_host',
                'port': '5000',  # Debe ser integer
                'timeout': -1,  # No puede ser negativo
                'rate_limit': 0  # No puede ser cero
            }
        }
    }
    config_path.write_text(json.dumps(config_data, indent=4))
    return str(config_path)

# Fixtures para pruebas de configuración
@pytest.fixture
def valid_global_config():
    """Fixture que proporciona una configuración global válida"""
    return {
        'system': {
            'name': 'DobackSoft V2',
            'version': '2.0.0',
            'environment': 'production',
            'debug': False,
            'timezone': 'UTC'
        },
        'database': {
            'host': 'localhost',
            'port': 5432,
            'name': 'DobackSoft',
            'user': 'admin',
            'password': '********'
        },
        'logging': {
            'level': 'INFO',
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            'file': 'logs/DobackSoft.log',
            'max_size': 10485760,
            'backup_count': 5
        },
        'security': {
            'jwt_secret': '********',
            'jwt_expiration': 3600,
            'password_min_length': 8,
            'password_require_special': True,
            'session_timeout': 1800
        },
        'notifications': {
            'email_enabled': True,
            'sms_enabled': False,
            'webhook_enabled': True,
            'default_language': 'es'
        }
    }

@pytest.fixture
def valid_company_config():
    """Fixture que proporciona una configuración de compañía válida"""
    return {
        'company_id': 'C001',
        'name': 'Test Company',
        'settings': {
            'language': 'es',
            'timezone': 'America/Mexico_City',
            'date_format': 'DD/MM/YYYY',
            'time_format': '24h'
        },
        'features': {
            'stability_monitoring': True,
            'telemetry_tracking': True,
            'maintenance_alerts': True,
            'report_generation': True
        },
        'limits': {
            'max_vehicles': 100,
            'max_users': 50,
            'max_storage_gb': 10,
            'data_retention_days': 365
        },
        'notifications': {
            'email_domain': 'testcompany.com',
            'alert_threshold': 0.8,
            'report_frequency': 'daily'
        }
    }

@pytest.fixture
def valid_config_schema():
    """Fixture que proporciona un esquema de configuración válido"""
    return {
        'type': 'object',
        'properties': {
            'system': {
                'type': 'object',
                'required': ['name', 'version', 'environment'],
                'properties': {
                    'name': {'type': 'string'},
                    'version': {'type': 'string'},
                    'environment': {'type': 'string', 'enum': ['development', 'staging', 'production']},
                    'debug': {'type': 'boolean'},
                    'timezone': {'type': 'string'}
                }
            },
            'database': {
                'type': 'object',
                'required': ['host', 'port', 'name', 'user'],
                'properties': {
                    'host': {'type': 'string'},
                    'port': {'type': 'integer', 'minimum': 1, 'maximum': 65535},
                    'name': {'type': 'string'},
                    'user': {'type': 'string'},
                    'password': {'type': 'string'}
                }
            }
        }
    }

@pytest.fixture
def valid_config_file():
    """Fixture que proporciona archivo de configuración válido"""
    return {
        'app': {
            'name': 'DobackSoft V2',
            'version': '2.0.0',
            'environment': 'production',
            'debug': False,
            'timezone': 'America/Mexico_City'
        },
        'server': {
            'host': '0.0.0.0',
            'port': 8000,
            'workers': 4,
            'timeout': 30
        },
        'database': {
            'host': 'localhost',
            'port': 5432,
            'name': 'DobackSoft',
            'user': 'admin',
            'password': '********',
            'pool_size': 20,
            'max_overflow': 10
        },
        'security': {
            'secret_key': '********',
            'token_expiration': 3600,
            'password_hash': 'bcrypt',
            'cors_origins': ['https://DobackSoft.com']
        }
    }

@pytest.fixture
def valid_env_variables():
    """Fixture que proporciona variables de entorno válidas"""
    return {
        'APP_ENV': 'production',
        'APP_DEBUG': 'false',
        'APP_SECRET_KEY': '********',
        'DB_HOST': 'localhost',
        'DB_PORT': '5432',
        'DB_NAME': 'DobackSoft',
        'DB_USER': 'admin',
        'DB_PASSWORD': '********',
        'REDIS_HOST': 'localhost',
        'REDIS_PORT': '6379',
        'SMTP_HOST': 'smtp.gmail.com',
        'SMTP_PORT': '587',
        'SMTP_USER': 'notifications@DobackSoft.com',
        'SMTP_PASSWORD': '********'
    }

@pytest.fixture
def valid_system_params():
    """Fixture que proporciona parámetros del sistema válidos"""
    return {
        'max_upload_size': 10485760,  # 10MB
        'max_concurrent_uploads': 5,
        'max_file_age_days': 30,
        'cleanup_interval_hours': 24,
        'backup_retention_days': 90,
        'session_timeout_minutes': 60,
        'password_expiry_days': 90,
        'max_login_attempts': 5,
        'lockout_duration_minutes': 30
    }

# Tests para validate_config_file
def test_validate_config_file_success(valid_config):
    """Test para validar un archivo de configuración válido"""
    success, messages = validate_config_file(valid_config)
    assert success
    assert "Archivo de configuración válido" in messages[0]

def test_validate_config_file_missing():
    """Test para validar un archivo de configuración faltante"""
    success, messages = validate_config_file("nonexistent.json")
    assert not success
    assert "Archivo de configuración no encontrado" in messages[0]

def test_validate_config_file_invalid_json(tmp_path):
    """Test para validar un archivo de configuración con JSON inválido"""
    config_path = tmp_path / "invalid.json"
    config_path.write_text("invalid json")
    
    success, messages = validate_config_file(str(config_path))
    assert not success
    assert "Formato JSON inválido" in messages[0]

# Tests para validate_config_structure
def test_validate_config_structure_success(valid_config):
    """Test para validar la estructura de una configuración válida"""
    with open(valid_config) as f:
        config_data = json.load(f)
    
    success, messages = validate_config_structure(config_data)
    assert success
    assert not messages

def test_validate_config_structure_missing_sections():
    """Test para validar una configuración con secciones faltantes"""
    config_data = {
        'invalid_section': {}
    }
    
    success, messages = validate_config_structure(config_data)
    assert not success
    assert "Sección 'system' faltante" in messages[0]

def test_validate_config_structure_invalid_sections():
    """Test para validar una configuración con secciones inválidas"""
    config_data = {
        'system': {
            'invalid_key': 'value'
        }
    }
    
    success, messages = validate_config_structure(config_data)
    assert not success
    assert "Clave inválida" in messages[0]

# Tests para validate_config_values
def test_validate_config_values_success(valid_config):
    """Test para validar los valores de una configuración válida"""
    with open(valid_config) as f:
        config_data = json.load(f)
    
    success, messages = validate_config_values(config_data)
    assert success
    assert not messages

def test_validate_config_values_invalid_types(invalid_config):
    """Test para validar los valores de una configuración con tipos inválidos"""
    with open(invalid_config) as f:
        config_data = json.load(f)
    
    success, messages = validate_config_values(config_data)
    assert not success
    assert any("tipo inválido" in msg for msg in messages)

def test_validate_config_values_invalid_ranges(invalid_config):
    """Test para validar los valores de una configuración con rangos inválidos"""
    with open(invalid_config) as f:
        config_data = json.load(f)
    
    success, messages = validate_config_values(config_data)
    assert not success
    assert any("fuera de rango" in msg for msg in messages)

# Tests para validate_config_permissions
def test_validate_config_permissions_success(valid_config):
    """Test para validar los permisos de un archivo de configuración"""
    success, messages = validate_config_permissions(valid_config)
    assert success
    assert "Permisos válidos" in messages[0]

def test_validate_config_permissions_insufficient(tmp_path):
    """Test para validar los permisos de un archivo de configuración sin permisos"""
    config_path = tmp_path / "config.json"
    config_path.write_text("{}")
    os.chmod(config_path, 0o000)  # Sin permisos
    
    success, messages = validate_config_permissions(str(config_path))
    assert not success
    assert "Permisos insuficientes" in messages[0]

# Tests para validate_config_backup
def test_validate_config_backup_success(valid_config, tmp_path):
    """Test para validar un backup de configuración exitoso"""
    backup_path = tmp_path / "config_backup.json"
    
    success, messages = validate_config_backup(valid_config, str(backup_path))
    assert success
    assert "Backup exitoso" in messages[0]
    assert backup_path.exists()

def test_validate_config_backup_failure(valid_config, tmp_path):
    """Test para validar un backup de configuración fallido"""
    backup_path = tmp_path / "config_backup.json"
    os.chmod(tmp_path, 0o000)  # Sin permisos de escritura
    
    success, messages = validate_config_backup(valid_config, str(backup_path))
    assert not success
    assert "Error al crear backup" in messages[0]

# Tests para validate_global_config
def test_validate_global_config_success(valid_global_config):
    """Test para validar configuración global válida"""
    success, messages = validate_global_config(valid_global_config)
    assert success
    assert "Configuración global válida" in messages[0]

def test_validate_global_config_missing_required():
    """Test para validar configuración global con campos requeridos faltantes"""
    config = valid_global_config.copy()
    del config['system']['name']
    
    success, messages = validate_global_config(config)
    assert not success
    assert "Campos requeridos faltantes" in messages[0]

def test_validate_global_config_invalid_values():
    """Test para validar configuración global con valores inválidos"""
    config = valid_global_config.copy()
    config['system']['environment'] = 'invalid'
    
    success, messages = validate_global_config(config)
    assert not success
    assert "Valores inválidos" in messages[0]

# Tests para validate_company_config
def test_validate_company_config_success(valid_company_config):
    """Test para validar configuración de compañía válida"""
    success, messages = validate_company_config(valid_company_config)
    assert success
    assert "Configuración de compañía válida" in messages[0]

def test_validate_company_config_missing_required():
    """Test para validar configuración de compañía con campos requeridos faltantes"""
    config = valid_company_config.copy()
    del config['company_id']
    
    success, messages = validate_company_config(config)
    assert not success
    assert "Campos requeridos faltantes" in messages[0]

def test_validate_company_config_invalid_limits():
    """Test para validar configuración de compañía con límites inválidos"""
    config = valid_company_config.copy()
    config['limits']['max_vehicles'] = -1
    
    success, messages = validate_company_config(config)
    assert not success
    assert "Límites inválidos" in messages[0]

# Tests para validate_config_schema
def test_validate_config_schema_success(valid_global_config, valid_config_schema):
    """Test para validar esquema de configuración válido"""
    success, messages = validate_config_schema(valid_global_config, valid_config_schema)
    assert success
    assert "Esquema de configuración válido" in messages[0]

def test_validate_config_schema_invalid_type():
    """Test para validar esquema de configuración con tipo inválido"""
    config = valid_global_config.copy()
    config['system']['version'] = 2.0  # Debería ser string
    
    success, messages = validate_config_schema(config, valid_config_schema)
    assert not success
    assert "Tipo de dato inválido" in messages[0]

def test_validate_config_schema_missing_property():
    """Test para validar esquema de configuración con propiedad faltante"""
    config = valid_global_config.copy()
    del config['system']['version']
    
    success, messages = validate_config_schema(config, valid_config_schema)
    assert not success
    assert "Propiedad requerida faltante" in messages[0]

# Tests para validate_config_values
def test_validate_config_values_success(valid_global_config):
    """Test para validar valores de configuración válidos"""
    success, messages = validate_config_values(valid_global_config)
    assert success
    assert "Valores de configuración válidos" in messages[0]

def test_validate_config_values_invalid_port():
    """Test para validar valores de configuración con puerto inválido"""
    config = valid_global_config.copy()
    config['database']['port'] = 70000  # Puerto fuera de rango
    
    success, messages = validate_config_values(config)
    assert not success
    assert "Puerto inválido" in messages[0]

def test_validate_config_values_invalid_timezone():
    """Test para validar valores de configuración con zona horaria inválida"""
    config = valid_global_config.copy()
    config['system']['timezone'] = 'Invalid/Timezone'
    
    success, messages = validate_config_values(config)
    assert not success
    assert "Zona horaria inválida" in messages[0]

# Tests para validate_config_dependencies
def test_validate_config_dependencies_success(valid_global_config):
    """Test para validar dependencias de configuración válidas"""
    success, messages = validate_config_dependencies(valid_global_config)
    assert success
    assert "Dependencias de configuración válidas" in messages[0]

def test_validate_config_dependencies_missing_dependency():
    """Test para validar dependencias de configuración con dependencia faltante"""
    config = valid_global_config.copy()
    del config['database']  # Elimina dependencia requerida
    
    success, messages = validate_config_dependencies(config)
    assert not success
    assert "Dependencia faltante" in messages[0]

def test_validate_config_dependencies_invalid_combination():
    """Test para validar dependencias de configuración con combinación inválida"""
    config = valid_global_config.copy()
    config['notifications']['email_enabled'] = True
    config['notifications']['email_domain'] = None  # Falta dominio para email habilitado
    
    success, messages = validate_config_dependencies(config)
    assert not success
    assert "Combinación inválida" in messages[0]

# Tests para validate_env_variables
def test_validate_env_variables_success(valid_env_variables):
    """Test para validar variables de entorno exitosas"""
    success, messages = validate_env_variables(valid_env_variables)
    assert success
    assert "Variables de entorno válidas" in messages[0]

def test_validate_env_variables_missing_required():
    """Test para validar variables de entorno sin campos requeridos"""
    env_vars = valid_env_variables.copy()
    del env_vars['APP_ENV']
    
    success, messages = validate_env_variables(env_vars)
    assert not success
    assert "Variable de entorno requerida faltante" in messages[0]

def test_validate_env_variables_invalid_value():
    """Test para validar variables de entorno con valor inválido"""
    env_vars = valid_env_variables.copy()
    env_vars['DB_PORT'] = 'invalid'
    
    success, messages = validate_env_variables(env_vars)
    assert not success
    assert "Valor inválido" in messages[0]

# Tests para validate_system_params
def test_validate_system_params_success(valid_system_params):
    """Test para validar parámetros del sistema exitosos"""
    success, messages = validate_system_params(valid_system_params)
    assert success
    assert "Parámetros del sistema válidos" in messages[0]

def test_validate_system_params_missing_required():
    """Test para validar parámetros del sistema sin campos requeridos"""
    params = valid_system_params.copy()
    del params['max_upload_size']
    
    success, messages = validate_system_params(params)
    assert not success
    assert "Parámetro requerido faltante" in messages[0]

def test_validate_system_params_invalid_value():
    """Test para validar parámetros del sistema con valor inválido"""
    params = valid_system_params.copy()
    params['max_upload_size'] = -1
    
    success, messages = validate_system_params(params)
    assert not success
    assert "Valor inválido" in messages[0]

# Tests para validate_database_config
def test_validate_database_config_success():
    """Test para validar configuración de base de datos exitosa"""
    db_config = {
        'type': 'postgresql',
        'host': 'localhost',
        'port': 5432,
        'database': 'DobackSoft',
        'user': 'admin',
        'password': '********',
        'pool_size': 20,
        'max_overflow': 10,
        'timeout': 30,
        'ssl_mode': 'require',
        'max_connections': 100,
        'idle_timeout': 300
    }
    
    success, messages = validate_database_config(db_config)
    assert success
    assert "Configuración de base de datos válida" in messages[0]

def test_validate_database_config_missing_required():
    """Test para validar configuración de base de datos sin campos requeridos"""
    db_config = {
        'type': 'postgresql',
        'host': 'localhost'
        # Falta port, database, etc.
    }
    
    success, messages = validate_database_config(db_config)
    assert not success
    assert "Campo requerido faltante" in messages[0]

# Tests para validate_api_config
def test_validate_api_config_success():
    """Test para validar configuración de API exitosa"""
    api_config = {
        'base_url': 'https://api.DobackSoft.com',
        'version': 'v2',
        'timeout': 30,
        'rate_limit': {
            'requests_per_minute': 100,
            'burst': 20
        },
        'authentication': {
            'type': 'jwt',
            'header': 'Authorization',
            'prefix': 'Bearer'
        },
        'cors': {
            'allowed_origins': ['https://DobackSoft.com'],
            'allowed_methods': ['GET', 'POST', 'PUT', 'DELETE'],
            'allowed_headers': ['Content-Type', 'Authorization']
        }
    }
    
    success, messages = validate_api_config(api_config)
    assert success
    assert "Configuración de API válida" in messages[0]

def test_validate_api_config_missing_required():
    """Test para validar configuración de API sin campos requeridos"""
    api_config = {
        'base_url': 'https://api.DobackSoft.com'
        # Falta version, timeout, etc.
    }
    
    success, messages = validate_api_config(api_config)
    assert not success
    assert "Campo requerido faltante" in messages[0]

# Tests para validate_security_config
def test_validate_security_config_success():
    """Test para validar configuración de seguridad exitosa"""
    security_config = {
        'authentication': {
            'type': 'jwt',
            'secret_key': '********',
            'algorithm': 'HS256',
            'token_expiration': 3600,
            'refresh_token_expiration': 604800
        },
        'password_policy': {
            'min_length': 8,
            'require_uppercase': True,
            'require_lowercase': True,
            'require_numbers': True,
            'require_special': True,
            'max_age_days': 90
        },
        'session': {
            'timeout_minutes': 60,
            'max_concurrent': 3,
            'inactivity_timeout_minutes': 15
        },
        'encryption': {
            'algorithm': 'AES-256-GCM',
            'key_size': 256,
            'iv_size': 12
        }
    }
    
    success, messages = validate_security_config(security_config)
    assert success
    assert "Configuración de seguridad válida" in messages[0]

def test_validate_security_config_missing_required():
    """Test para validar configuración de seguridad sin campos requeridos"""
    security_config = {
        'authentication': {
            'type': 'jwt'
            # Falta secret_key, algorithm, etc.
        }
    }
    
    success, messages = validate_security_config(security_config)
    assert not success
    assert "Campo requerido faltante" in messages[0]

# Tests para validate_logging_config
def test_validate_logging_config_success():
    """Test para validar configuración de logging exitosa"""
    logging_config = {
        'level': 'INFO',
        'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        'handlers': [
            {
                'type': 'file',
                'filename': 'app.log',
                'max_bytes': 10485760,
                'backup_count': 5
            },
            {
                'type': 'console',
                'stream': 'stdout'
            }
        ],
        'loggers': {
            'app': {
                'level': 'INFO',
                'propagate': False
            },
            'security': {
                'level': 'WARNING',
                'propagate': False
            }
        }
    }
    
    success, messages = validate_logging_config(logging_config)
    assert success
    assert "Configuración de logging válida" in messages[0]

def test_validate_logging_config_missing_required():
    """Test para validar configuración de logging sin campos requeridos"""
    logging_config = {
        'level': 'INFO'
        # Falta format, handlers, etc.
    }
    
    success, messages = validate_logging_config(logging_config)
    assert not success
    assert "Campo requerido faltante" in messages[0]

# Tests para validate_email_config
def test_validate_email_config_success():
    """Test para validar configuración de email exitosa"""
    email_config = {
        'smtp': {
            'host': 'smtp.gmail.com',
            'port': 587,
            'username': 'notifications@DobackSoft.com',
            'password': '********',
            'use_tls': True
        },
        'from_address': 'notifications@DobackSoft.com',
        'from_name': 'DobackSoft Notifications',
        'templates': {
            'welcome': {
                'subject': 'Bienvenido a DobackSoft',
                'template': 'welcome.html'
            },
            'password_reset': {
                'subject': 'Restablecer contraseña',
                'template': 'password_reset.html'
            }
        },
        'queue': {
            'enabled': True,
            'max_retries': 3,
            'retry_delay_seconds': 300
        }
    }
    
    success, messages = validate_email_config(email_config)
    assert success
    assert "Configuración de email válida" in messages[0]

def test_validate_email_config_missing_required():
    """Test para validar configuración de email sin campos requeridos"""
    email_config = {
        'smtp': {
            'host': 'smtp.gmail.com'
            # Falta port, username, etc.
        }
    }
    
    success, messages = validate_email_config(email_config)
    assert not success
    assert "Campo requerido faltante" in messages[0]

# Tests para validate_storage_config
def test_validate_storage_config_success():
    """Test para validar configuración de almacenamiento exitosa"""
    storage_config = {
        'type': 's3',
        'bucket': 'DobackSoft-files',
        'region': 'us-east-1',
        'access_key': '********',
        'secret_key': '********',
        'endpoint': 'https://s3.amazonaws.com',
        'public_url': 'https://files.DobackSoft.com',
        'max_file_size': 10485760,  # 10MB
        'allowed_types': [
            'image/jpeg',
            'image/png',
            'application/pdf'
        ],
        'retention': {
            'temp_files_days': 1,
            'backup_files_days': 90
        }
    }
    
    success, messages = validate_storage_config(storage_config)
    assert success
    assert "Configuración de almacenamiento válida" in messages[0]

def test_validate_storage_config_missing_required():
    """Test para validar configuración de almacenamiento sin campos requeridos"""
    storage_config = {
        'type': 's3'
        # Falta bucket, region, etc.
    }
    
    success, messages = validate_storage_config(storage_config)
    assert not success
    assert "Campo requerido faltante" in messages[0]

# Tests para validate_caching_config
def test_validate_caching_config_success():
    """Test para validar configuración de caché exitosa"""
    caching_config = {
        'type': 'redis',
        'host': 'localhost',
        'port': 6379,
        'password': '********',
        'db': 0,
        'prefix': 'DobackSoft:',
        'default_ttl': 3600,
        'max_memory': '1gb',
        'max_memory_policy': 'allkeys-lru',
        'pools': {
            'session': {
                'db': 1,
                'ttl': 3600
            },
            'api': {
                'db': 2,
                'ttl': 300
            }
        }
    }
    
    success, messages = validate_caching_config(caching_config)
    assert success
    assert "Configuración de caché válida" in messages[0]

def test_validate_caching_config_missing_required():
    """Test para validar configuración de caché sin campos requeridos"""
    caching_config = {
        'type': 'redis'
        # Falta host, port, etc.
    }
    
    success, messages = validate_caching_config(caching_config)
    assert not success
    assert "Campo requerido faltante" in messages[0] 