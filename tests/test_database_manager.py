import pytest
import os
import time
import json
from datetime import datetime
from src.app.services.database_manager import DatabaseManager
from src.app.exceptions import DatabaseError, DatabaseManagerError
import psycopg2

@pytest.fixture
def db_config():
    return {
        'host': 'localhost',
        'port': 5432,
        'database': 'test_db',
        'user': 'postgres',
        'password': 'postgres',
        'min_conn': 1,
        'max_conn': 5,
        'conn_timeout': 30
    }

@pytest.fixture
def database_manager(db_config):
    # Crear base de datos de prueba
    conn = psycopg2.connect(
        host=db_config['host'],
        port=db_config['port'],
        database='postgres',
        user=db_config['user'],
        password=db_config['password']
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Eliminar base de datos si existe
    cursor.execute(f"DROP DATABASE IF EXISTS {db_config['database']}")
    
    # Crear base de datos
    cursor.execute(f"CREATE DATABASE {db_config['database']}")
    
    cursor.close()
    conn.close()
    
    # Crear gestor de base de datos
    manager = DatabaseManager(db_config)
    
    # Crear tabla de prueba
    manager.execute_query("""
        CREATE TABLE test_table (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            value INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    yield manager
    
    # Limpiar
    conn = psycopg2.connect(
        host=db_config['host'],
        port=db_config['port'],
        database='postgres',
        user=db_config['user'],
        password=db_config['password']
    )
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute(f"DROP DATABASE IF EXISTS {db_config['database']}")
    cursor.close()
    conn.close()

def test_connect(database_manager):
    # Conectar a la base de datos
    database_manager.connect()
    
    # Verificar conexión
    assert database_manager.conn is not None
    assert database_manager.cursor is not None

def test_disconnect(database_manager):
    # Conectar y desconectar
    database_manager.connect()
    database_manager.disconnect()
    
    # Verificar desconexión
    assert database_manager.conn is None
    assert database_manager.cursor is None

def test_create_table(database_manager):
    # Conectar a la base de datos
    database_manager.connect()
    
    # Crear tabla
    columns = {
        'id': 'INTEGER PRIMARY KEY',
        'name': 'TEXT NOT NULL',
        'value': 'REAL'
    }
    database_manager.create_table('test_table', columns)
    
    # Verificar que se creó
    tables = database_manager.execute_query(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
    assert len(tables) == 1
    assert tables[0]['name'] == 'test_table'

def test_insert(database_manager):
    # Conectar y crear tabla
    database_manager.connect()
    database_manager.create_table('test_table', {
        'id': 'INTEGER PRIMARY KEY',
        'name': 'TEXT NOT NULL'
    })
    
    # Insertar registro
    data = {'name': 'test'}
    row_id = database_manager.insert('test_table', data)
    
    # Verificar que se insertó
    assert row_id == 1
    
    # Verificar datos
    result = database_manager.select('test_table')
    assert len(result) == 1
    assert result[0]['name'] == 'test'

def test_update(database_manager):
    # Conectar y crear tabla
    database_manager.connect()
    database_manager.create_table('test_table', {
        'id': 'INTEGER PRIMARY KEY',
        'name': 'TEXT NOT NULL'
    })
    
    # Insertar registro
    database_manager.insert('test_table', {'name': 'old'})
    
    # Actualizar registro
    updated = database_manager.update(
        'test_table',
        {'name': 'new'},
        'id = ?',
        (1,)
    )
    
    # Verificar actualización
    assert updated == 1
    
    # Verificar datos
    result = database_manager.select('test_table')
    assert len(result) == 1
    assert result[0]['name'] == 'new'

def test_delete(database_manager):
    # Conectar y crear tabla
    database_manager.connect()
    database_manager.create_table('test_table', {
        'id': 'INTEGER PRIMARY KEY',
        'name': 'TEXT NOT NULL'
    })
    
    # Insertar registros
    database_manager.insert('test_table', {'name': 'test1'})
    database_manager.insert('test_table', {'name': 'test2'})
    
    # Eliminar registro
    deleted = database_manager.delete('test_table', 'name = ?', ('test1',))
    
    # Verificar eliminación
    assert deleted == 1
    
    # Verificar datos
    result = database_manager.select('test_table')
    assert len(result) == 1
    assert result[0]['name'] == 'test2'

def test_select(database_manager):
    # Conectar y crear tabla
    database_manager.connect()
    database_manager.create_table('test_table', {
        'id': 'INTEGER PRIMARY KEY',
        'name': 'TEXT NOT NULL',
        'value': 'INTEGER'
    })
    
    # Insertar registros
    database_manager.insert('test_table', {'name': 'test1', 'value': 1})
    database_manager.insert('test_table', {'name': 'test2', 'value': 2})
    
    # Seleccionar todos los registros
    all_records = database_manager.select('test_table')
    assert len(all_records) == 2
    
    # Seleccionar con condición
    filtered = database_manager.select(
        'test_table',
        columns=['name'],
        condition='value > ?',
        params=(1,)
    )
    assert len(filtered) == 1
    assert filtered[0]['name'] == 'test2'

def test_execute_transaction(database_manager):
    # Conectar y crear tabla
    database_manager.connect()
    database_manager.create_table('test_table', {
        'id': 'INTEGER PRIMARY KEY',
        'name': 'TEXT NOT NULL'
    })
    
    # Ejecutar transacción
    queries = [
        ("INSERT INTO test_table (name) VALUES (?)", ('test1',)),
        ("INSERT INTO test_table (name) VALUES (?)", ('test2',))
    ]
    database_manager.execute_transaction(queries)
    
    # Verificar datos
    result = database_manager.select('test_table')
    assert len(result) == 2
    assert result[0]['name'] == 'test1'
    assert result[1]['name'] == 'test2'

def test_backup(database_manager):
    # Conectar y crear tabla
    database_manager.connect()
    database_manager.create_table('test_table', {
        'id': 'INTEGER PRIMARY KEY',
        'name': 'TEXT NOT NULL'
    })
    
    # Insertar datos
    database_manager.insert('test_table', {'name': 'test'})
    
    # Crear backup
    backup_file = database_manager.backup()
    
    # Verificar que se creó
    assert os.path.exists(backup_file)
    
    # Verificar que se limpiaron backups antiguos
    backups = os.listdir(database_manager.backup_path)
    assert len(backups) <= database_manager.max_backups

def test_restore(database_manager):
    # Conectar y crear tabla
    database_manager.connect()
    database_manager.create_table('test_table', {
        'id': 'INTEGER PRIMARY KEY',
        'name': 'TEXT NOT NULL'
    })
    
    # Insertar datos y crear backup
    database_manager.insert('test_table', {'name': 'test'})
    backup_file = database_manager.backup()
    
    # Eliminar datos
    database_manager.delete('test_table', '1=1')
    
    # Restaurar backup
    database_manager.restore(backup_file)
    
    # Verificar datos
    result = database_manager.select('test_table')
    assert len(result) == 1
    assert result[0]['name'] == 'test'

def test_get_database_stats(database_manager):
    # Conectar y crear tabla
    database_manager.connect()
    database_manager.create_table('test_table', {
        'id': 'INTEGER PRIMARY KEY',
        'name': 'TEXT NOT NULL'
    })
    
    # Insertar datos
    database_manager.insert('test_table', {'name': 'test'})
    
    # Obtener estadísticas
    stats = database_manager.get_database_stats()
    
    # Verificar estadísticas
    assert stats['db_size'] > 0
    assert stats['total_tables'] == 1
    assert stats['table_counts']['test_table'] == 1
    assert 'metrics' in stats

def test_get_status(database_manager):
    # Obtener estado
    status = database_manager.get_status()
    
    # Verificar propiedades
    assert isinstance(status, dict)
    assert 'db_path' in status
    assert 'backup_path' in status
    assert 'max_backups' in status
    assert 'is_connected' in status
    assert 'stats' in status

def test_init_pool(database_manager):
    # Verificar que el pool se inicializó correctamente
    assert database_manager.pool is not None
    assert database_manager.host == 'localhost'
    assert database_manager.port == 5432
    assert database_manager.database == 'test_db'
    assert database_manager.user == 'test_user'
    assert database_manager.min_conn == 1
    assert database_manager.max_conn == 5
    assert database_manager.conn_timeout == 30

def test_get_connection(database_manager):
    # Obtener conexión
    conn = database_manager.get_connection()
    
    # Verificar conexión
    assert conn is not None
    
    # Liberar conexión
    database_manager.release_connection(conn)

def test_execute_query(database_manager):
    # Ejecutar consulta simple
    query = "SELECT 1 as test"
    results = database_manager.execute_query(query)
    
    # Verificar resultados
    assert len(results) == 1
    assert results[0]['test'] == 1
    
    # Verificar métricas
    assert database_manager.metrics['total_queries'] == 1
    assert database_manager.metrics['successful_queries'] == 1
    assert database_manager.metrics['query_time'] > 0

def test_execute_query_with_params(database_manager):
    # Ejecutar consulta con parámetros
    query = "SELECT %s as param1, %s as param2"
    params = ('value1', 'value2')
    results = database_manager.execute_query(query, params)
    
    # Verificar resultados
    assert len(results) == 1
    assert results[0]['param1'] == 'value1'
    assert results[0]['param2'] == 'value2'

def test_execute_query_error(database_manager):
    # Ejecutar consulta inválida
    query = "SELECT * FROM nonexistent_table"
    
    # Verificar que se lanza error
    with pytest.raises(DatabaseError):
        database_manager.execute_query(query)
    
    # Verificar métricas
    assert database_manager.metrics['total_queries'] == 1
    assert database_manager.metrics['failed_queries'] == 1

def test_execute_transaction(database_manager):
    # Crear tabla de prueba
    create_table = {
        'query': """
            CREATE TABLE IF NOT EXISTS test_transaction (
                id SERIAL PRIMARY KEY,
                value TEXT
            )
        """
    }
    
    # Insertar datos
    insert_data = {
        'query': """
            INSERT INTO test_transaction (value)
            VALUES (%s), (%s)
        """,
        'params': ('value1', 'value2')
    }
    
    # Ejecutar transacción
    database_manager.execute_transaction([create_table, insert_data])
    
    # Verificar datos
    results = database_manager.execute_query(
        "SELECT * FROM test_transaction ORDER BY id"
    )
    
    assert len(results) == 2
    assert results[0]['value'] == 'value1'
    assert results[1]['value'] == 'value2'
    
    # Limpiar tabla
    database_manager.execute_query("DROP TABLE test_transaction")

def test_execute_transaction_error(database_manager):
    # Crear consultas inválidas
    queries = [
        {
            'query': "CREATE TABLE test_error (id INT)",
            'params': None
        },
        {
            'query': "INSERT INTO nonexistent_table VALUES (1)",
            'params': None
        }
    ]
    
    # Verificar que se lanza error
    with pytest.raises(DatabaseError):
        database_manager.execute_transaction(queries)
    
    # Verificar que la transacción se revirtió
    results = database_manager.execute_query(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_error')"
    )
    assert not results[0]['exists']

def test_execute_migration(database_manager):
    # Crear archivo de migración
    migration_file = 'test_migration.sql'
    with open(migration_file, 'w') as f:
        f.write("""
            CREATE TABLE test_migration (
                id SERIAL PRIMARY KEY,
                value TEXT
            );
            
            INSERT INTO test_migration (value)
            VALUES ('test_value');
        """)
    
    try:
        # Ejecutar migración
        database_manager.execute_migration(migration_file)
        
        # Verificar resultados
        results = database_manager.execute_query(
            "SELECT * FROM test_migration"
        )
        
        assert len(results) == 1
        assert results[0]['value'] == 'test_value'
        
    finally:
        # Limpiar
        database_manager.execute_query("DROP TABLE test_migration")
        os.remove(migration_file)

def test_get_table_info(database_manager):
    # Crear tabla de prueba
    database_manager.execute_query("""
        CREATE TABLE test_info (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            value INTEGER DEFAULT 0
        )
    """)
    
    try:
        # Obtener información
        info = database_manager.get_table_info('test_info')
        
        # Verificar información
        assert info['table_name'] == 'test_info'
        assert len(info['columns']) == 3
        
        # Verificar columnas
        columns = {col['column_name']: col for col in info['columns']}
        assert columns['id']['data_type'] == 'integer'
        assert columns['name']['is_nullable'] == 'NO'
        assert columns['value']['column_default'] == '0'
        
    finally:
        # Limpiar
        database_manager.execute_query("DROP TABLE test_info")

def test_get_database_stats(database_manager):
    # Obtener estadísticas
    stats = database_manager.get_database_stats()
    
    # Verificar estadísticas
    assert stats['database'] == 'test_db'
    assert 'stats' in stats
    assert 'metrics' in stats
    assert stats['metrics']['total_queries'] >= 0
    assert stats['metrics']['successful_queries'] >= 0
    assert stats['metrics']['failed_queries'] >= 0
    assert stats['metrics']['connection_errors'] >= 0
    assert stats['metrics']['query_time'] >= 0

def test_get_status(database_manager):
    # Obtener estado
    status = database_manager.get_status()
    
    # Verificar propiedades
    assert isinstance(status, dict)
    assert 'host' in status
    assert 'port' in status
    assert 'database' in status
    assert 'user' in status
    assert 'min_conn' in status
    assert 'max_conn' in status
    assert 'conn_timeout' in status
    assert 'stats' in status

def test_init_database_manager(database_manager, db_config):
    # Verificar configuración
    assert database_manager.host == db_config['host']
    assert database_manager.port == db_config['port']
    assert database_manager.database == db_config['database']
    assert database_manager.user == db_config['user']
    assert database_manager.password == db_config['password']
    assert database_manager.min_conn == db_config['min_conn']
    assert database_manager.max_conn == db_config['max_conn']
    assert database_manager.conn_timeout == db_config['conn_timeout']
    
    # Verificar pool
    assert database_manager.pool is not None
    
    # Verificar métricas iniciales
    assert database_manager.metrics['total_queries'] == 1  # Creación de tabla
    assert database_manager.metrics['successful_queries'] == 1
    assert database_manager.metrics['failed_queries'] == 0
    assert database_manager.metrics['connection_errors'] == 0
    assert database_manager.metrics['query_time'] > 0

def test_get_release_connection(database_manager):
    # Obtener conexión
    conn = database_manager.get_connection()
    assert conn is not None
    
    # Liberar conexión
    database_manager.release_connection(conn)
    
    # Verificar métricas
    assert database_manager.metrics['connection_errors'] == 0

def test_execute_query(database_manager):
    # Insertar datos
    database_manager.execute_query(
        "INSERT INTO test_table (name, value) VALUES (%s, %s)",
        ('test1', 100)
    )
    
    # Consultar datos
    results = database_manager.execute_query(
        "SELECT * FROM test_table WHERE name = %s",
        ('test1',)
    )
    
    # Verificar resultados
    assert len(results) == 1
    assert results[0]['name'] == 'test1'
    assert results[0]['value'] == 100
    
    # Verificar métricas
    assert database_manager.metrics['total_queries'] == 3  # Incluye creación de tabla
    assert database_manager.metrics['successful_queries'] == 3
    assert database_manager.metrics['failed_queries'] == 0

def test_execute_transaction(database_manager):
    # Preparar transacción
    queries = [
        ("INSERT INTO test_table (name, value) VALUES (%s, %s)", ('test1', 100)),
        ("INSERT INTO test_table (name, value) VALUES (%s, %s)", ('test2', 200)),
        ("UPDATE test_table SET value = %s WHERE name = %s", (300, 'test1'))
    ]
    
    # Ejecutar transacción
    database_manager.execute_transaction(queries)
    
    # Verificar resultados
    results = database_manager.execute_query("SELECT * FROM test_table ORDER BY name")
    assert len(results) == 2
    assert results[0]['name'] == 'test1'
    assert results[0]['value'] == 300
    assert results[1]['name'] == 'test2'
    assert results[1]['value'] == 200
    
    # Verificar métricas
    assert database_manager.metrics['total_queries'] == 4  # Incluye creación de tabla
    assert database_manager.metrics['successful_queries'] == 4
    assert database_manager.metrics['failed_queries'] == 0

def test_execute_migration(database_manager):
    # Crear archivo de migración
    migration_file = 'test_migration.sql'
    with open(migration_file, 'w') as f:
        f.write("""
            CREATE TABLE migration_test (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100)
            );
            
            INSERT INTO migration_test (name) VALUES ('test');
        """)
    
    # Ejecutar migración
    database_manager.execute_migration(migration_file)
    
    # Verificar resultados
    results = database_manager.execute_query("SELECT * FROM migration_test")
    assert len(results) == 1
    assert results[0]['name'] == 'test'
    
    # Limpiar
    os.remove(migration_file)

def test_get_table_info(database_manager):
    # Obtener información de tabla
    table_info = database_manager.get_table_info('test_table')
    
    # Verificar información
    assert table_info['table_name'] == 'test_table'
    assert len(table_info['columns']) == 4
    
    # Verificar columnas
    columns = {col['column_name']: col for col in table_info['columns']}
    assert 'id' in columns
    assert 'name' in columns
    assert 'value' in columns
    assert 'created_at' in columns
    
    assert columns['id']['data_type'] == 'integer'
    assert columns['name']['data_type'] == 'character varying'
    assert columns['value']['data_type'] == 'integer'
    assert columns['created_at']['data_type'] == 'timestamp without time zone'

def test_get_database_stats(database_manager):
    # Insertar datos de prueba
    database_manager.execute_query(
        "INSERT INTO test_table (name, value) VALUES (%s, %s)",
        ('test1', 100)
    )
    
    # Obtener estadísticas
    stats = database_manager.get_database_stats()
    
    # Verificar estadísticas
    assert 'tables' in stats
    assert 'indexes' in stats
    assert 'metrics' in stats
    
    # Verificar tabla
    tables = [t for t in stats['tables'] if t['table_name'] == 'test_table']
    assert len(tables) == 1
    assert tables[0]['row_count'] == 1

def test_get_status(database_manager):
    # Obtener estado
    status = database_manager.get_status()
    
    # Verificar propiedades
    assert status['host'] == 'localhost'
    assert status['port'] == 5432
    assert status['database'] == 'test_db'
    assert status['user'] == 'postgres'
    assert status['min_conn'] == 1
    assert status['max_conn'] == 5
    assert status['conn_timeout'] == 30
    assert 'metrics' in status

def test_connection_error():
    # Configuración inválida
    config = {
        'host': 'invalid_host',
        'port': 5432,
        'database': 'test_db',
        'user': 'postgres',
        'password': 'postgres'
    }
    
    # Intentar crear gestor
    with pytest.raises(DatabaseManagerError):
        DatabaseManager(config)

def test_query_error(database_manager):
    # Intentar ejecutar consulta inválida
    with pytest.raises(DatabaseManagerError):
        database_manager.execute_query("INVALID SQL")
    
    # Verificar métricas
    assert database_manager.metrics['total_queries'] == 2  # Incluye creación de tabla
    assert database_manager.metrics['successful_queries'] == 1
    assert database_manager.metrics['failed_queries'] == 1 