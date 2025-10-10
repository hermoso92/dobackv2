import pytest
import os
import json
import logging
from pathlib import Path
from datetime import datetime, timedelta
from src.automation.validations.log_validation import (
    validate_log_directory,
    validate_log_file,
    validate_log_format,
    validate_log_rotation,
    validate_log_cleanup,
    validate_log_levels,
    validate_log_storage,
    validate_log_retention,
    validate_log_analysis,
    validate_log_alerts,
    validate_log_export,
    validate_log_backup
)

# Fixtures para logs de prueba
@pytest.fixture
def valid_log_dir(tmp_path):
    """Fixture que proporciona un directorio de logs válido"""
    log_dir = tmp_path / "logs"
    log_dir.mkdir()
    return str(log_dir)

@pytest.fixture
def valid_log_file(tmp_path):
    """Fixture que proporciona un archivo de log válido"""
    log_file = tmp_path / "app.log"
    log_content = """
2024-01-01 00:00:00,000 INFO [MainThread] Iniciando aplicación
2024-01-01 00:00:01,000 DEBUG [MainThread] Configuración cargada
2024-01-01 00:00:02,000 INFO [MainThread] Base de datos conectada
2024-01-01 00:00:03,000 WARNING [MainThread] Reintentando conexión
2024-01-01 00:00:04,000 ERROR [MainThread] Error de conexión
2024-01-01 00:00:05,000 CRITICAL [MainThread] Aplicación detenida
"""
    log_file.write_text(log_content)
    return str(log_file)

@pytest.fixture
def invalid_log_file(tmp_path):
    """Fixture que proporciona un archivo de log inválido"""
    log_file = tmp_path / "invalid.log"
    log_content = """
Invalid log format
No timestamp
No level
No thread
No message
"""
    log_file.write_text(log_content)
    return str(log_file)

@pytest.fixture
def valid_log_format():
    """Fixture que proporciona formato de log válido"""
    return {
        'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        'date_format': '%Y-%m-%d %H:%M:%S',
        'fields': [
            {
                'name': 'timestamp',
                'type': 'datetime',
                'format': 'ISO8601'
            },
            {
                'name': 'level',
                'type': 'string',
                'values': ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
            },
            {
                'name': 'logger',
                'type': 'string',
                'pattern': '^[a-zA-Z0-9_.]+$'
            },
            {
                'name': 'message',
                'type': 'string',
                'max_length': 1000
            }
        ],
        'extras': [
            {
                'name': 'request_id',
                'type': 'string',
                'pattern': '^[a-f0-9]{32}$'
            },
            {
                'name': 'user_id',
                'type': 'string',
                'pattern': '^[a-zA-Z0-9_-]+$'
            }
        ]
    }

@pytest.fixture
def valid_log_levels():
    """Fixture que proporciona niveles de log válidos"""
    return {
        'levels': [
            {
                'name': 'DEBUG',
                'value': 10,
                'color': 'grey',
                'enabled': True
            },
            {
                'name': 'INFO',
                'value': 20,
                'color': 'blue',
                'enabled': True
            },
            {
                'name': 'WARNING',
                'value': 30,
                'color': 'yellow',
                'enabled': True
            },
            {
                'name': 'ERROR',
                'value': 40,
                'color': 'red',
                'enabled': True
            },
            {
                'name': 'CRITICAL',
                'value': 50,
                'color': 'red',
                'enabled': True
            }
        ],
        'default_level': 'INFO',
        'min_level': 'DEBUG',
        'max_level': 'CRITICAL'
    }

@pytest.fixture
def valid_log_rotation():
    """Fixture que proporciona configuración de rotación de logs válida"""
    return {
        'enabled': True,
        'type': 'time',
        'interval': 'daily',
        'backup_count': 30,
        'max_size': 10485760,  # 10MB
        'compress': True,
        'format': '{name}.{date}.{ext}',
        'date_format': '%Y-%m-%d',
        'ext': 'gz'
    }

# Tests para validate_log_directory
def test_validate_log_directory_success(valid_log_dir):
    """Test para validar un directorio de logs válido"""
    success, messages = validate_log_directory(valid_log_dir)
    assert success
    assert "Directorio de logs válido" in messages[0]

def test_validate_log_directory_missing():
    """Test para validar un directorio de logs faltante"""
    success, messages = validate_log_directory("nonexistent/logs")
    assert not success
    assert "Directorio de logs no encontrado" in messages[0]

def test_validate_log_directory_no_permissions(tmp_path):
    """Test para validar un directorio de logs sin permisos"""
    log_dir = tmp_path / "logs"
    log_dir.mkdir()
    os.chmod(log_dir, 0o000)  # Sin permisos
    
    success, messages = validate_log_directory(str(log_dir))
    assert not success
    assert "Permisos insuficientes" in messages[0]

# Tests para validate_log_file
def test_validate_log_file_success(valid_log_file):
    """Test para validar un archivo de log válido"""
    success, messages = validate_log_file(valid_log_file)
    assert success
    assert "Archivo de log válido" in messages[0]

def test_validate_log_file_missing():
    """Test para validar un archivo de log faltante"""
    success, messages = validate_log_file("nonexistent.log")
    assert not success
    assert "Archivo de log no encontrado" in messages[0]

def test_validate_log_file_no_permissions(tmp_path):
    """Test para validar un archivo de log sin permisos"""
    log_file = tmp_path / "app.log"
    log_file.write_text("Test log")
    os.chmod(log_file, 0o000)  # Sin permisos
    
    success, messages = validate_log_file(str(log_file))
    assert not success
    assert "Permisos insuficientes" in messages[0]

# Tests para validate_log_format
def test_validate_log_format_success(valid_log_format):
    """Test para validar formato de log exitoso"""
    success, messages = validate_log_format(valid_log_format)
    assert success
    assert "Formato de log válido" in messages[0]

def test_validate_log_format_missing_required():
    """Test para validar formato de log sin campos requeridos"""
    log_format = valid_log_format.copy()
    del log_format['format']
    
    success, messages = validate_log_format(log_format)
    assert not success
    assert "Campo requerido faltante" in messages[0]

def test_validate_log_format_invalid_pattern():
    """Test para validar formato de log con patrón inválido"""
    log_format = valid_log_format.copy()
    log_format['fields'][2]['pattern'] = 'invalid_pattern'
    
    success, messages = validate_log_format(log_format)
    assert not success
    assert "Patrón inválido" in messages[0]

# Tests para validate_log_levels
def test_validate_log_levels_success(valid_log_levels):
    """Test para validar niveles de log exitosos"""
    success, messages = validate_log_levels(valid_log_levels)
    assert success
    assert "Niveles de log válidos" in messages[0]

def test_validate_log_levels_missing_required():
    """Test para validar niveles de log sin campos requeridos"""
    log_levels = valid_log_levels.copy()
    del log_levels['levels']
    
    success, messages = validate_log_levels(log_levels)
    assert not success
    assert "Campo requerido faltante" in messages[0]

def test_validate_log_levels_invalid_value():
    """Test para validar niveles de log con valor inválido"""
    log_levels = valid_log_levels.copy()
    log_levels['levels'][0]['value'] = -1
    
    success, messages = validate_log_levels(log_levels)
    assert not success
    assert "Valor inválido" in messages[0]

# Tests para validate_log_rotation
def test_validate_log_rotation_success(valid_log_rotation):
    """Test para validar rotación de logs exitosa"""
    success, messages = validate_log_rotation(valid_log_rotation)
    assert success
    assert "Rotación de logs válida" in messages[0]

def test_validate_log_rotation_missing_required():
    """Test para validar rotación de logs sin campos requeridos"""
    log_rotation = valid_log_rotation.copy()
    del log_rotation['type']
    
    success, messages = validate_log_rotation(log_rotation)
    assert not success
    assert "Campo requerido faltante" in messages[0]

def test_validate_log_rotation_invalid_interval():
    """Test para validar rotación de logs con intervalo inválido"""
    log_rotation = valid_log_rotation.copy()
    log_rotation['interval'] = 'invalid'
    
    success, messages = validate_log_rotation(log_rotation)
    assert not success
    assert "Intervalo inválido" in messages[0]

# Tests para validate_log_storage
def test_validate_log_storage_success():
    """Test para validar almacenamiento de logs exitoso"""
    log_storage = {
        'type': 'file',
        'path': '/var/log/DobackSoft',
        'permissions': '0644',
        'owner': 'DobackSoft',
        'group': 'DobackSoft',
        'max_size': 1073741824,  # 1GB
        'compression': {
            'enabled': True,
            'format': 'gzip',
            'level': 6
        },
        'encryption': {
            'enabled': True,
            'algorithm': 'AES-256-GCM',
            'key_rotation_days': 30
        }
    }
    
    success, messages = validate_log_storage(log_storage)
    assert success
    assert "Almacenamiento de logs válido" in messages[0]

def test_validate_log_storage_missing_required():
    """Test para validar almacenamiento de logs sin campos requeridos"""
    log_storage = {
        'type': 'file'
        # Falta path, permissions, etc.
    }
    
    success, messages = validate_log_storage(log_storage)
    assert not success
    assert "Campo requerido faltante" in messages[0]

# Tests para validate_log_retention
def test_validate_log_retention_success():
    """Test para validar retención de logs exitosa"""
    log_retention = {
        'policy': {
            'type': 'time',
            'days': 90,
            'size': 10737418240  # 10GB
        },
        'archival': {
            'enabled': True,
            'type': 's3',
            'bucket': 'DobackSoft-logs-archive',
            'path': 'logs/',
            'compression': 'gzip'
        },
        'cleanup': {
            'enabled': True,
            'schedule': 'daily',
            'time': '00:00',
            'dry_run': False
        }
    }
    
    success, messages = validate_log_retention(log_retention)
    assert success
    assert "Retención de logs válida" in messages[0]

def test_validate_log_retention_missing_required():
    """Test para validar retención de logs sin campos requeridos"""
    log_retention = {
        'policy': {
            'type': 'time'
            # Falta days, size
        }
    }
    
    success, messages = validate_log_retention(log_retention)
    assert not success
    assert "Campo requerido faltante" in messages[0]

# Tests para validate_log_analysis
def test_validate_log_analysis_success():
    """Test para validar análisis de logs exitoso"""
    log_analysis = {
        'enabled': True,
        'tools': [
            {
                'name': 'elk',
                'type': 'elasticsearch',
                'host': 'localhost',
                'port': 9200,
                'index_pattern': 'DobackSoft-*'
            },
            {
                'name': 'prometheus',
                'type': 'metrics',
                'endpoint': 'http://localhost:9090',
                'scrape_interval': '15s'
            }
        ],
        'patterns': [
            {
                'name': 'error_pattern',
                'regex': 'ERROR.*',
                'severity': 'error'
            },
            {
                'name': 'warning_pattern',
                'regex': 'WARNING.*',
                'severity': 'warning'
            }
        ],
        'dashboards': [
            {
                'name': 'system_overview',
                'type': 'grafana',
                'url': 'http://localhost:3000/d/system'
            }
        ]
    }
    
    success, messages = validate_log_analysis(log_analysis)
    assert success
    assert "Análisis de logs válido" in messages[0]

def test_validate_log_analysis_missing_required():
    """Test para validar análisis de logs sin campos requeridos"""
    log_analysis = {
        'enabled': True
        # Falta tools, patterns, etc.
    }
    
    success, messages = validate_log_analysis(log_analysis)
    assert not success
    assert "Campo requerido faltante" in messages[0]

# Tests para validate_log_alerts
def test_validate_log_alerts_success():
    """Test para validar alertas de logs exitosas"""
    log_alerts = {
        'enabled': True,
        'channels': [
            {
                'type': 'email',
                'recipients': ['admin@DobackSoft.com'],
                'template': 'alert.html'
            },
            {
                'type': 'slack',
                'webhook': 'https://hooks.slack.com/services/xxx',
                'channel': '#alerts'
            }
        ],
        'rules': [
            {
                'name': 'error_threshold',
                'condition': 'count > 10',
                'window': '5m',
                'severity': 'critical'
            },
            {
                'name': 'response_time',
                'condition': 'avg > 1000',
                'window': '1m',
                'severity': 'warning'
            }
        ],
        'throttling': {
            'enabled': True,
            'max_alerts': 5,
            'window': '1h'
        }
    }
    
    success, messages = validate_log_alerts(log_alerts)
    assert success
    assert "Alertas de logs válidas" in messages[0]

def test_validate_log_alerts_missing_required():
    """Test para validar alertas de logs sin campos requeridos"""
    log_alerts = {
        'enabled': True
        # Falta channels, rules, etc.
    }
    
    success, messages = validate_log_alerts(log_alerts)
    assert not success
    assert "Campo requerido faltante" in messages[0]

# Tests para validate_log_export
def test_validate_log_export_success():
    """Test para validar exportación de logs exitosa"""
    log_export = {
        'formats': [
            {
                'type': 'json',
                'pretty': True,
                'include_metadata': True
            },
            {
                'type': 'csv',
                'delimiter': ',',
                'include_header': True
            }
        ],
        'filters': [
            {
                'field': 'level',
                'operator': 'in',
                'values': ['ERROR', 'CRITICAL']
            },
            {
                'field': 'timestamp',
                'operator': 'gte',
                'value': '2024-01-01'
            }
        ],
        'compression': {
            'enabled': True,
            'format': 'gzip',
            'level': 6
        },
        'encryption': {
            'enabled': True,
            'algorithm': 'AES-256-GCM',
            'password': '********'
        }
    }
    
    success, messages = validate_log_export(log_export)
    assert success
    assert "Exportación de logs válida" in messages[0]

def test_validate_log_export_missing_required():
    """Test para validar exportación de logs sin campos requeridos"""
    log_export = {
        'formats': []
        # Falta formats, filters, etc.
    }
    
    success, messages = validate_log_export(log_export)
    assert not success
    assert "Campo requerido faltante" in messages[0]

# Tests para validate_log_cleanup
def test_validate_log_cleanup_success():
    """Test para validar limpieza de logs exitosa"""
    log_cleanup = {
        'enabled': True,
        'schedule': {
            'type': 'cron',
            'expression': '0 0 * * *'  # Diario a medianoche
        },
        'rules': [
            {
                'type': 'age',
                'days': 90,
                'action': 'delete'
            },
            {
                'type': 'size',
                'max_size': 10737418240,  # 10GB
                'action': 'archive'
            }
        ],
        'dry_run': False,
        'notify': {
            'enabled': True,
            'channels': ['email', 'slack'],
            'template': 'cleanup_report.html'
        }
    }
    
    success, messages = validate_log_cleanup(log_cleanup)
    assert success
    assert "Limpieza de logs válida" in messages[0]

def test_validate_log_cleanup_missing_required():
    """Test para validar limpieza de logs sin campos requeridos"""
    log_cleanup = {
        'enabled': True
        # Falta schedule, rules, etc.
    }
    
    success, messages = validate_log_cleanup(log_cleanup)
    assert not success
    assert "Campo requerido faltante" in messages[0]

# Tests para validate_log_backup
def test_validate_log_backup_success():
    """Test para validar backup de logs exitoso"""
    log_backup = {
        'enabled': True,
        'schedule': {
            'type': 'cron',
            'expression': '0 0 * * *'  # Diario a medianoche
        },
        'storage': {
            'type': 's3',
            'bucket': 'DobackSoft-logs-backup',
            'path': 'backups/',
            'region': 'us-east-1'
        },
        'compression': {
            'enabled': True,
            'format': 'gzip',
            'level': 6
        },
        'encryption': {
            'enabled': True,
            'algorithm': 'AES-256-GCM',
            'key_rotation_days': 30
        },
        'retention': {
            'days': 365,
            'copies': 3
        },
        'verification': {
            'enabled': True,
            'type': 'checksum',
            'algorithm': 'sha256'
        }
    }
    
    success, messages = validate_log_backup(log_backup)
    assert success
    assert "Backup de logs válido" in messages[0]

def test_validate_log_backup_missing_required():
    """Test para validar backup de logs sin campos requeridos"""
    log_backup = {
        'enabled': True
        # Falta schedule, storage, etc.
    }
    
    success, messages = validate_log_backup(log_backup)
    assert not success
    assert "Campo requerido faltante" in messages[0] 