import pytest
import os
import json
from datetime import datetime
from src.app.services.error_manager import ErrorManager, Error
from src.app.exceptions import ErrorManagerError

@pytest.fixture
def error_manager():
    config = {
        'error_dir': 'test_errors',
        'error_file': 'test_errors.json',
        'max_errors': 5,
        'error_retention': 3600
    }
    return ErrorManager(config)

@pytest.fixture(autouse=True)
def cleanup():
    # Limpiar directorios de prueba
    yield
    for dir_name in ['test_errors']:
        if os.path.exists(dir_name):
            import shutil
            shutil.rmtree(dir_name)

def test_init_error_manager(error_manager):
    # Verificar directorio
    assert os.path.exists(error_manager.error_dir)
    
    # Verificar configuración
    assert error_manager.error_file == 'test_errors.json'
    assert error_manager.max_errors == 5
    assert error_manager.error_retention == 3600
    
    # Verificar métricas iniciales
    assert error_manager.metrics['total_errors'] == 0
    assert error_manager.metrics['active_errors'] == 0
    assert error_manager.metrics['resolved_errors'] == 0

def test_register_error(error_manager):
    # Registrar error
    error = error_manager.register_error(
        code='TEST001',
        message='Test error',
        source='test',
        details={'key': 'value'}
    )
    
    # Verificar error
    assert error.code == 'TEST001'
    assert error.message == 'Test error'
    assert error.source == 'test'
    assert error.details == {'key': 'value'}
    assert error.status == 'active'
    
    # Verificar archivo
    error_path = os.path.join(error_manager.error_dir, error_manager.error_file)
    assert os.path.exists(error_path)
    
    # Verificar contenido
    with open(error_path, 'r') as f:
        error_data = json.load(f)
        assert len(error_data) == 1
        assert error_data[0]['code'] == 'TEST001'
    
    # Verificar métricas
    assert error_manager.metrics['total_errors'] == 1
    assert error_manager.metrics['active_errors'] == 1
    assert error_manager.metrics['errors_by_source']['test'] == 1
    assert error_manager.metrics['errors_by_code']['TEST001'] == 1

def test_resolve_error(error_manager):
    # Registrar error
    error = error_manager.register_error(
        code='TEST001',
        message='Test error',
        source='test'
    )
    
    # Resolver error
    error_manager.resolve_error('TEST001')
    
    # Verificar estado
    assert error.status == 'resolved'
    
    # Verificar métricas
    assert error_manager.metrics['active_errors'] == 0
    assert error_manager.metrics['resolved_errors'] == 1

def test_get_errors(error_manager):
    # Registrar errores
    error1 = error_manager.register_error(
        code='TEST001',
        message='Test error 1',
        source='test1'
    )
    error2 = error_manager.register_error(
        code='TEST002',
        message='Test error 2',
        source='test2'
    )
    
    # Obtener todos los errores
    all_errors = error_manager.get_errors()
    assert len(all_errors) == 2
    
    # Filtrar por estado
    active_errors = error_manager.get_errors(status='active')
    assert len(active_errors) == 2
    
    # Filtrar por fuente
    test1_errors = error_manager.get_errors(source='test1')
    assert len(test1_errors) == 1
    assert test1_errors[0].code == 'TEST001'
    
    # Filtrar por código
    test002_errors = error_manager.get_errors(code='TEST002')
    assert len(test002_errors) == 1
    assert test002_errors[0].source == 'test2'

def test_max_errors(error_manager):
    # Registrar más errores que el máximo
    for i in range(10):
        error_manager.register_error(
            code=f'TEST{i:03d}',
            message=f'Test error {i}',
            source='test'
        )
    
    # Verificar número de errores
    assert len(error_manager.errors) == 5  # max_errors
    assert error_manager.errors[0].code == 'TEST005'  # Los más recientes

def test_get_error_stats(error_manager):
    # Registrar errores
    error_manager.register_error(
        code='TEST001',
        message='Test error 1',
        source='test1'
    )
    error_manager.register_error(
        code='TEST002',
        message='Test error 2',
        source='test2'
    )
    
    # Resolver un error
    error_manager.resolve_error('TEST001')
    
    # Obtener estadísticas
    stats = error_manager.get_error_stats()
    
    # Verificar estadísticas
    assert stats['total_errors'] == 2
    assert stats['active_errors'] == 1
    assert stats['resolved_errors'] == 1
    assert stats['errors_by_source']['test1'] == 1
    assert stats['errors_by_source']['test2'] == 1
    assert stats['errors_by_code']['TEST001'] == 1
    assert stats['errors_by_code']['TEST002'] == 1

def test_get_status(error_manager):
    # Obtener estado
    status = error_manager.get_status()
    
    # Verificar propiedades
    assert isinstance(status, dict)
    assert status['error_dir'] == 'test_errors'
    assert status['error_file'] == 'test_errors.json'
    assert status['max_errors'] == 5
    assert status['error_retention'] == 3600
    assert 'metrics' in status 