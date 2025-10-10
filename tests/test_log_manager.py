import pytest
import os
import logging
from datetime import datetime
from src.app.services.log_manager import LogManager
from src.app.exceptions import LogError, LogManagerError

@pytest.fixture
def log_manager():
    config = {
        'log_dir': 'test_logs',
        'log_file': 'test.log',
        'max_size': 1024,  # 1KB
        'backup_count': 3,
        'rotation': 'size',
        'rotation_interval': 'midnight',
        'log_level': 'DEBUG'
    }
    return LogManager(config)

@pytest.fixture(autouse=True)
def cleanup():
    yield
    # Limpiar archivos de test
    if os.path.exists('test_logs'):
        for file in os.listdir('test_logs'):
            os.remove(os.path.join('test_logs', file))
        os.rmdir('test_logs')

def test_init_log_manager(log_manager):
    # Verificar configuración
    assert log_manager.log_dir == 'test_logs'
    assert log_manager.log_file == 'test.log'
    assert log_manager.max_size == 1024
    assert log_manager.backup_count == 3
    assert log_manager.rotation == 'size'
    assert log_manager.rotation_interval == 'midnight'
    assert log_manager.log_level == 'DEBUG'
    
    # Verificar que se creó el directorio
    assert os.path.exists('test_logs')
    
    # Verificar métricas iniciales
    assert log_manager.metrics['total_logs'] == 0
    assert log_manager.metrics['logs_by_level']['DEBUG'] == 0
    assert log_manager.metrics['logs_by_level']['INFO'] == 0
    assert log_manager.metrics['logs_by_level']['WARNING'] == 0
    assert log_manager.metrics['logs_by_level']['ERROR'] == 0
    assert log_manager.metrics['logs_by_level']['CRITICAL'] == 0
    assert log_manager.metrics['log_files'] == ['test.log']
    assert log_manager.metrics['errors'] == 0

def test_setup_main_logger(log_manager):
    # Verificar logger principal
    assert log_manager.main_logger.name == 'DobackSoft'
    assert log_manager.main_logger.level == logging.DEBUG
    
    # Verificar archivo de log
    assert os.path.exists('test_logs/test.log')
    
    # Verificar handler
    assert len(log_manager.main_logger.handlers) == 1
    assert isinstance(log_manager.main_logger.handlers[0], logging.handlers.RotatingFileHandler)

def test_get_logger(log_manager):
    # Obtener logger específico
    logger = log_manager.get_logger('test_component')
    
    # Verificar logger
    assert logger.name == 'DobackSoft.test_component'
    assert logger.level == logging.DEBUG
    
    # Verificar archivo de log
    assert os.path.exists('test_logs/test_component.log')
    
    # Verificar handler
    assert len(logger.handlers) == 1
    assert isinstance(logger.handlers[0], logging.handlers.RotatingFileHandler)
    
    # Verificar métricas
    assert 'test_component.log' in log_manager.metrics['log_files']

def test_log_messages(log_manager):
    # Registrar mensajes
    log_manager.debug('Debug message')
    log_manager.info('Info message')
    log_manager.warning('Warning message')
    log_manager.error('Error message')
    log_manager.critical('Critical message')
    
    # Verificar métricas
    assert log_manager.metrics['total_logs'] == 5
    assert log_manager.metrics['logs_by_level']['DEBUG'] == 1
    assert log_manager.metrics['logs_by_level']['INFO'] == 1
    assert log_manager.metrics['logs_by_level']['WARNING'] == 1
    assert log_manager.metrics['logs_by_level']['ERROR'] == 1
    assert log_manager.metrics['logs_by_level']['CRITICAL'] == 1
    
    # Verificar archivo de log
    with open('test_logs/test.log', 'r') as f:
        log_content = f.read()
        
        assert 'Debug message' in log_content
        assert 'Info message' in log_content
        assert 'Warning message' in log_content
        assert 'Error message' in log_content
        assert 'Critical message' in log_content

def test_log_with_data(log_manager):
    # Registrar mensaje con datos
    log_manager.info('Test message', extra={'data': {'key': 'value'}})
    
    # Verificar archivo de log
    with open('test_logs/test.log', 'r') as f:
        log_content = f.read()
        assert 'Test message' in log_content
        assert 'key' in log_content
        assert 'value' in log_content

def test_log_rotation_by_size(log_manager):
    # Crear mensaje grande
    large_message = 'x' * 1024  # 1KB
    
    # Registrar mensajes hasta que se rote el archivo
    for _ in range(2):
        log_manager.info(large_message)
    
    # Verificar archivos de log
    log_files = os.listdir('test_logs')
    assert len(log_files) == 2  # Archivo actual + backup
    
    # Verificar que el backup tiene el sufijo correcto
    backup_file = [f for f in log_files if f != 'test.log'][0]
    assert backup_file.startswith('test.log.')

def test_log_rotation_by_time(log_manager):
    # Cambiar a rotación por tiempo
    log_manager.rotation = 'time'
    log_manager.rotation_interval = 'S'  # Por segundo para testing
    
    # Registrar mensaje
    log_manager.info('Test message')
    
    # Esperar un segundo
    import time
    time.sleep(1)
    
    # Registrar otro mensaje
    log_manager.info('Another message')
    
    # Verificar archivos de log
    log_files = os.listdir('test_logs')
    assert len(log_files) == 2  # Archivo actual + backup
    
    # Verificar que el backup tiene el sufijo correcto
    backup_file = [f for f in log_files if f != 'test.log'][0]
    assert backup_file.startswith('test.log.')

def test_get_log_files(log_manager):
    # Crear algunos loggers
    log_manager.get_logger('component1')
    log_manager.get_logger('component2')
    
    # Obtener archivos de log
    log_files = log_manager.get_log_files()
    
    # Verificar archivos
    assert 'test.log' in log_files
    assert 'component1.log' in log_files
    assert 'component2.log' in log_files

def test_get_log_stats(log_manager):
    # Registrar algunos mensajes
    log_manager.debug('Debug message')
    log_manager.info('Info message')
    log_manager.warning('Warning message')
    
    # Obtener estadísticas
    stats = log_manager.get_log_stats()
    
    # Verificar estadísticas
    assert stats['total_logs'] == 3
    assert stats['logs_by_level']['DEBUG'] == 1
    assert stats['logs_by_level']['INFO'] == 1
    assert stats['logs_by_level']['WARNING'] == 1
    assert 'test.log' in stats['log_files']
    assert stats['errors'] == 0

def test_get_status(log_manager):
    # Obtener estado
    status = log_manager.get_status()
    
    # Verificar propiedades
    assert status['log_dir'] == 'test_logs'
    assert status['log_file'] == 'test.log'
    assert status['max_size'] == 1024
    assert status['backup_count'] == 3
    assert status['rotation'] == 'size'
    assert status['rotation_interval'] == 'midnight'
    assert status['log_level'] == 'DEBUG'
    assert 'metrics' in status

def test_invalid_log_level(log_manager):
    # Intentar configurar nivel de log inválido
    with pytest.raises(LogManagerError):
        log_manager.log_level = 'INVALID_LEVEL'
        log_manager._setup_main_logger()

def test_file_permission_error(log_manager):
    # Crear directorio sin permisos de escritura
    os.chmod('test_logs', 0o444)
    
    # Intentar registrar mensaje
    with pytest.raises(LogManagerError):
        log_manager.info('Test message')
    
    # Restaurar permisos
    os.chmod('test_logs', 0o755) 