import pytest
import os
import json
from pathlib import Path
from sqlalchemy import create_engine, text
from src.automation.validations.database_validation import (
    validate_database_connection,
    validate_database_schema,
    validate_database_permissions,
    validate_database_backup,
    validate_database_restore,
    validate_database_queries,
    validate_database_transactions,
    validate_database_integrity
)
from datetime import datetime, timedelta

# Fixtures para configuración de prueba
@pytest.fixture
def valid_db_config(tmp_path):
    """Fixture que proporciona una configuración de base de datos válida"""
    config_path = tmp_path / "database.ini"
    config_data = {
        'database': {
            'host': 'localhost',
            'port': '5432',
            'database': 'test_db',
            'user': 'test_user',
            'password': 'test_password'
        }
    }
    config_path.write_text(json.dumps(config_data))
    return str(config_path)

@pytest.fixture
def invalid_db_config(tmp_path):
    """Fixture que proporciona una configuración de base de datos inválida"""
    config_path = tmp_path / "database.ini"
    config_data = {
        'database': {
            'host': 'invalid_host',
            'port': 'invalid_port',
            'database': 'invalid_db',
            'user': 'invalid_user',
            'password': 'invalid_password'
        }
    }
    config_path.write_text(json.dumps(config_data))
    return str(config_path)

@pytest.fixture
def test_db_engine():
    """Fixture que proporciona un motor de base de datos de prueba"""
    return create_engine('sqlite:///:memory:')

# Fixtures para pruebas de base de datos
@pytest.fixture
def valid_database_connection():
    """Fixture que proporciona configuración de conexión válida"""
    return {
        'host': 'localhost',
        'port': 5432,
        'database': 'DobackSoft',
        'user': 'admin',
        'password': '********',
        'ssl_mode': 'require',
        'connection_timeout': 30,
        'pool_size': 20,
        'max_overflow': 10
    }

@pytest.fixture
def valid_database_queries():
    """Fixture que proporciona consultas de base de datos válidas"""
    return {
        'vehicles': {
            'select': {
                'query': 'SELECT * FROM vehicles WHERE company_id = :company_id',
                'parameters': ['company_id'],
                'expected_columns': [
                    'id', 'plate_number', 'make', 'model', 'year',
                    'type', 'status', 'company_id', 'driver_id'
                ]
            },
            'insert': {
                'query': '''
                    INSERT INTO vehicles (
                        plate_number, make, model, year, type,
                        status, company_id, driver_id
                    ) VALUES (
                        :plate_number, :make, :model, :year, :type,
                        :status, :company_id, :driver_id
                    )
                ''',
                'parameters': [
                    'plate_number', 'make', 'model', 'year', 'type',
                    'status', 'company_id', 'driver_id'
                ]
            },
            'update': {
                'query': '''
                    UPDATE vehicles
                    SET status = :status, driver_id = :driver_id
                    WHERE id = :id
                ''',
                'parameters': ['status', 'driver_id', 'id']
            }
        }
    }

@pytest.fixture
def valid_database_transactions():
    """Fixture que proporciona transacciones de base de datos válidas"""
    return {
        'maintenance_record': {
            'queries': [
                {
                    'type': 'insert',
                    'table': 'maintenance',
                    'values': {
                        'vehicle_id': ':vehicle_id',
                        'type': ':type',
                        'description': ':description',
                        'cost': ':cost'
                    }
                },
                {
                    'type': 'update',
                    'table': 'vehicles',
                    'values': {
                        'status': 'maintenance'
                    },
                    'where': {
                        'id': ':vehicle_id'
                    }
                }
            ],
            'parameters': [
                'vehicle_id', 'type', 'description', 'cost'
            ]
        }
    }

# Tests para validate_database_connection
def test_validate_database_connection_success(valid_db_config, monkeypatch):
    """Test para validar una conexión exitosa a la base de datos"""
    def mock_create_engine(*args, **kwargs):
        return create_engine('sqlite:///:memory:')
    
    monkeypatch.setattr('sqlalchemy.create_engine', mock_create_engine)
    
    success, messages = validate_database_connection(valid_db_config)
    assert success
    assert "Conexión exitosa" in messages[0]

def test_validate_database_connection_invalid_config(invalid_db_config):
    """Test para validar una conexión fallida a la base de datos"""
    success, messages = validate_database_connection(invalid_db_config)
    assert not success
    assert "Error de conexión" in messages[0]

def test_validate_database_connection_missing_config():
    """Test para validar una configuración faltante"""
    success, messages = validate_database_connection("nonexistent.ini")
    assert not success
    assert "Archivo de configuración no encontrado" in messages[0]

# Tests para validate_database_schema
def test_validate_database_schema_success(test_db_engine):
    """Test para validar un esquema de base de datos válido"""
    # Crear tablas de prueba
    test_db_engine.execute(text("""
        CREATE TABLE test_table (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    
    success, messages = validate_database_schema(test_db_engine)
    assert success
    assert "Esquema válido" in messages[0]

def test_validate_database_schema_missing_tables(test_db_engine):
    """Test para validar un esquema con tablas faltantes"""
    success, messages = validate_database_schema(test_db_engine)
    assert not success
    assert "Tablas requeridas faltantes" in messages[0]

def test_validate_database_schema_invalid_structure(test_db_engine):
    """Test para validar un esquema con estructura inválida"""
    # Crear tabla con estructura inválida
    test_db_engine.execute(text("""
        CREATE TABLE invalid_table (
            id INTEGER,
            name TEXT
        )
    """))
    
    success, messages = validate_database_schema(test_db_engine)
    assert not success
    assert "Estructura inválida" in messages[0]

# Tests para validate_database_permissions
def test_validate_database_permissions_success(test_db_engine):
    """Test para validar permisos de base de datos válidos"""
    success, messages = validate_database_permissions(test_db_engine)
    assert success
    assert "Permisos válidos" in messages[0]

def test_validate_database_permissions_insufficient(test_db_engine, monkeypatch):
    """Test para validar permisos insuficientes"""
    def mock_execute(*args, **kwargs):
        raise Exception("Permission denied")
    
    monkeypatch.setattr(test_db_engine, 'execute', mock_execute)
    
    success, messages = validate_database_permissions(test_db_engine)
    assert not success
    assert "Permisos insuficientes" in messages[0]

# Tests para validate_database_backup
def test_validate_database_backup_success(test_db_engine, tmp_path):
    """Test para validar un backup exitoso"""
    backup_path = tmp_path / "backup.sql"
    
    success, messages = validate_database_backup(test_db_engine, str(backup_path))
    assert success
    assert "Backup exitoso" in messages[0]
    assert backup_path.exists()

def test_validate_database_backup_failure(test_db_engine, tmp_path):
    """Test para validar un backup fallido"""
    backup_path = tmp_path / "backup.sql"
    os.chmod(tmp_path, 0o000)  # Sin permisos de escritura
    
    success, messages = validate_database_backup(test_db_engine, str(backup_path))
    assert not success
    assert "Error al crear backup" in messages[0]

# Tests para validate_database_restore
def test_validate_database_restore_success(test_db_engine, tmp_path):
    """Test para validar una restauración exitosa"""
    # Crear archivo de backup de prueba
    backup_path = tmp_path / "backup.sql"
    backup_path.write_text("""
        CREATE TABLE test_table (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        );
        INSERT INTO test_table (id, name) VALUES (1, 'test');
    """)
    
    success, messages = validate_database_restore(test_db_engine, str(backup_path))
    assert success
    assert "Restauración exitosa" in messages[0]

def test_validate_database_restore_invalid_backup(test_db_engine, tmp_path):
    """Test para validar una restauración con backup inválido"""
    backup_path = tmp_path / "invalid_backup.sql"
    backup_path.write_text("INVALID SQL")
    
    success, messages = validate_database_restore(test_db_engine, str(backup_path))
    assert not success
    assert "Error al restaurar" in messages[0]

def test_validate_database_restore_missing_backup(test_db_engine):
    """Test para validar una restauración con backup faltante"""
    success, messages = validate_database_restore(test_db_engine, "nonexistent.sql")
    assert not success
    assert "Archivo de backup no encontrado" in messages[0]

# Tests para validate_database_queries
def test_validate_database_queries_success(valid_database_queries):
    """Test para validar consultas de base de datos válidas"""
    success, messages = validate_database_queries(valid_database_queries)
    assert success
    assert "Consultas de base de datos válidas" in messages[0]

def test_validate_database_queries_invalid_syntax():
    """Test para validar consultas de base de datos con sintaxis inválida"""
    queries = valid_database_queries.copy()
    queries['vehicles']['select']['query'] = 'INVALID SQL'
    
    success, messages = validate_database_queries(queries)
    assert not success
    assert "Sintaxis inválida" in messages[0]

def test_validate_database_queries_missing_parameters():
    """Test para validar consultas de base de datos con parámetros faltantes"""
    queries = valid_database_queries.copy()
    del queries['vehicles']['select']['parameters']
    
    success, messages = validate_database_queries(queries)
    assert not success
    assert "Parámetros faltantes" in messages[0]

# Tests para validate_database_transactions
def test_validate_database_transactions_success(valid_database_transactions):
    """Test para validar transacciones de base de datos válidas"""
    success, messages = validate_database_transactions(valid_database_transactions)
    assert success
    assert "Transacciones de base de datos válidas" in messages[0]

def test_validate_database_transactions_invalid_sequence():
    """Test para validar transacciones de base de datos con secuencia inválida"""
    transactions = valid_database_transactions.copy()
    transactions['maintenance_record']['queries'].append({
        'type': 'invalid',
        'table': 'vehicles'
    })
    
    success, messages = validate_database_transactions(transactions)
    assert not success
    assert "Secuencia inválida" in messages[0]

def test_validate_database_transactions_missing_required():
    """Test para validar transacciones de base de datos con campos requeridos faltantes"""
    transactions = valid_database_transactions.copy()
    del transactions['maintenance_record']['queries'][0]['type']
    
    success, messages = validate_database_transactions(transactions)
    assert not success
    assert "Campos requeridos faltantes" in messages[0]

# Tests para validate_database_integrity
def test_validate_database_integrity_success():
    """Test para validar integridad de base de datos válida"""
    integrity_checks = {
        'foreign_keys': [
            {
                'table': 'vehicles',
                'column': 'company_id',
                'references': {
                    'table': 'companies',
                    'column': 'id'
                }
            }
        ],
        'unique_constraints': [
            {
                'table': 'vehicles',
                'columns': ['plate_number']
            }
        ],
        'not_null_constraints': [
            {
                'table': 'vehicles',
                'columns': ['plate_number', 'make', 'model']
            }
        ]
    }
    
    success, messages = validate_database_integrity(integrity_checks)
    assert success
    assert "Integridad de base de datos válida" in messages[0]

def test_validate_database_integrity_invalid_references():
    """Test para validar integridad de base de datos con referencias inválidas"""
    integrity_checks = {
        'foreign_keys': [
            {
                'table': 'vehicles',
                'column': 'invalid_column',
                'references': {
                    'table': 'companies',
                    'column': 'id'
                }
            }
        ]
    }
    
    success, messages = validate_database_integrity(integrity_checks)
    assert not success
    assert "Referencias inválidas" in messages[0]

def test_validate_database_integrity_missing_constraints():
    """Test para validar integridad de base de datos con restricciones faltantes"""
    integrity_checks = {
        'foreign_keys': [],
        'unique_constraints': [],
        'not_null_constraints': []
    }
    
    success, messages = validate_database_integrity(integrity_checks)
    assert not success
    assert "Restricciones faltantes" in messages[0]

# Tests para validate_database_backup
def test_validate_database_backup_success():
    """Test para validar backup de base de datos válido"""
    backup_config = {
        'schedule': {
            'frequency': 'daily',
            'time': '00:00',
            'retention_days': 30
        },
        'storage': {
            'type': 's3',
            'bucket': 'DobackSoft-backups',
            'path': 'database/'
        },
        'compression': {
            'enabled': True,
            'format': 'gzip'
        }
    }
    
    success, messages = validate_database_backup(backup_config)
    assert success
    assert "Backup de base de datos válido" in messages[0]

def test_validate_database_backup_invalid_schedule():
    """Test para validar backup de base de datos con programación inválida"""
    backup_config = {
        'schedule': {
            'frequency': 'invalid',
            'time': '00:00',
            'retention_days': 30
        }
    }
    
    success, messages = validate_database_backup(backup_config)
    assert not success
    assert "Programación inválida" in messages[0]

def test_validate_database_backup_missing_required():
    """Test para validar backup de base de datos con campos requeridos faltantes"""
    backup_config = {
        'schedule': {
            'frequency': 'daily'
            # Falta time y retention_days
        }
    }
    
    success, messages = validate_database_backup(backup_config)
    assert not success
    assert "Campos requeridos faltantes" in messages[0] 