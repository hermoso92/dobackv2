import pytest
import os
import json
import time
from datetime import datetime, timedelta
from src.app.services.metrics_manager import MetricsManager, Metric
from src.app.exceptions import MetricsManagerError

@pytest.fixture
def config():
    """Fixture para la configuración de pruebas."""
    return {
        'metrics_dir': 'test_metrics',
        'metrics_file': 'test_metrics.json',
        'max_metrics': 100,
        'retention_period': 3600  # 1 hora
    }

@pytest.fixture
def metrics_manager(config):
    """Fixture para el gestor de métricas."""
    manager = MetricsManager(config)
    yield manager
    # Limpiar después de las pruebas
    if os.path.exists(os.path.join(config['metrics_dir'], config['metrics_file'])):
        os.remove(os.path.join(config['metrics_dir'], config['metrics_file']))
    if os.path.exists(config['metrics_dir']):
        os.rmdir(config['metrics_dir'])

def test_init_metrics_manager(metrics_manager, config):
    """Prueba la inicialización del gestor de métricas."""
    assert metrics_manager.metrics_dir == config['metrics_dir']
    assert metrics_manager.metrics_file == config['metrics_file']
    assert metrics_manager.max_metrics == config['max_metrics']
    assert metrics_manager.retention_period == config['retention_period']
    assert metrics_manager.metrics == []
    assert metrics_manager.metrics_stats['total_metrics'] == 0

def test_load_metrics(metrics_manager):
    # Crear archivo de métricas
    metrics_data = {
        'test_metric_1': [
            {
                'name': 'test_metric_1',
                'value': 100,
                'timestamp': '2023-01-01T00:00:00'
            }
        ]
    }
    
    os.makedirs('test_metrics', exist_ok=True)
    with open('test_metrics/test_metrics.json', 'w') as f:
        json.dump(metrics_data, f)
    
    # Cargar métricas
    metrics_manager._load_metrics()
    
    # Verificar métricas
    assert len(metrics_manager.metrics) == 1
    assert len(metrics_manager.metrics['test_metric_1']) == 1
    assert metrics_manager.metrics['test_metric_1'][0].name == 'test_metric_1'
    assert metrics_manager.metrics['test_metric_1'][0].value == 100
    assert metrics_manager.metrics['test_metric_1'][0].timestamp == datetime.fromisoformat('2023-01-01T00:00:00')

def test_save_metrics(metrics_manager):
    # Crear métricas
    metric = Metric('test_metric_1', 100, datetime.fromisoformat('2023-01-01T00:00:00'))
    metrics_manager.metrics['test_metric_1'] = [metric]
    
    # Guardar métricas
    metrics_manager._save_metrics()
    
    # Verificar archivo
    assert os.path.exists('test_metrics/test_metrics.json')
    
    with open('test_metrics/test_metrics.json', 'r') as f:
        saved_metrics = json.load(f)
    
    assert len(saved_metrics) == 1
    assert len(saved_metrics['test_metric_1']) == 1
    assert saved_metrics['test_metric_1'][0]['name'] == 'test_metric_1'
    assert saved_metrics['test_metric_1'][0]['value'] == 100
    assert saved_metrics['test_metric_1'][0]['timestamp'] == '2023-01-01T00:00:00'

def test_update_system_metrics(metrics_manager):
    # Crear métricas
    metric1 = Metric('test_metric_1', 100, datetime.fromisoformat('2023-01-01T00:00:00'))
    metric2 = Metric('test_metric_1', 200, datetime.fromisoformat('2023-01-02T00:00:00'))
    metric3 = Metric('test_metric_2', 300, datetime.fromisoformat('2023-01-03T00:00:00'))
    
    metrics_manager.metrics = {
        'test_metric_1': [metric1, metric2],
        'test_metric_2': [metric3]
    }
    
    # Actualizar métricas del sistema
    metrics_manager._update_system_metrics()
    
    # Verificar métricas
    assert metrics_manager.system_metrics['total_metrics'] == 3
    assert metrics_manager.system_metrics['metrics_by_name']['test_metric_1'] == 2
    assert metrics_manager.system_metrics['metrics_by_name']['test_metric_2'] == 1
    assert metrics_manager.system_metrics['oldest_metric'] == metric1
    assert metrics_manager.system_metrics['newest_metric'] == metric3

def test_cleanup_old_metrics(metrics_manager):
    # Crear métricas
    old_metric = Metric('test_metric_1', 100, datetime.now() - timedelta(days=31))
    new_metric = Metric('test_metric_1', 200, datetime.now())
    
    metrics_manager.metrics = {
        'test_metric_1': [old_metric, new_metric]
    }
    
    # Limpiar métricas antiguas
    metrics_manager._cleanup_old_metrics()
    
    # Verificar métricas
    assert len(metrics_manager.metrics['test_metric_1']) == 1
    assert metrics_manager.metrics['test_metric_1'][0] == new_metric

def test_add_metric(metrics_manager):
    """Prueba añadir una métrica."""
    metric = metrics_manager.add_metric('test_metric', 42.0, {'tag1': 'value1'})
    
    assert isinstance(metric, Metric)
    assert metric.name == 'test_metric'
    assert metric.value == 42.0
    assert metric.tags == {'tag1': 'value1'}
    assert len(metrics_manager.metrics) == 1
    assert metrics_manager.metrics_stats['total_metrics'] == 1

def test_add_metric_max_limit(metrics_manager):
    """Prueba el límite máximo de métricas."""
    # Añadir métricas hasta el límite
    for i in range(metrics_manager.max_metrics + 10):
        metrics_manager.add_metric(f'metric_{i}', float(i))
    
    assert len(metrics_manager.metrics) == metrics_manager.max_metrics
    assert metrics_manager.metrics_stats['total_metrics'] == metrics_manager.max_metrics

def test_get_metrics(metrics_manager):
    """Prueba obtener métricas."""
    # Añadir métricas de prueba
    metrics_manager.add_metric('metric1', 1.0, {'tag1': 'value1'})
    metrics_manager.add_metric('metric1', 2.0, {'tag1': 'value2'})
    metrics_manager.add_metric('metric2', 3.0, {'tag1': 'value1'})
    
    # Obtener todas las métricas
    all_metrics = metrics_manager.get_metrics()
    assert len(all_metrics) == 3
    
    # Filtrar por nombre
    metric1_metrics = metrics_manager.get_metrics(name='metric1')
    assert len(metric1_metrics) == 2
    
    # Filtrar por tags
    tagged_metrics = metrics_manager.get_metrics(tags={'tag1': 'value1'})
    assert len(tagged_metrics) == 2
    
    # Filtrar por tiempo
    now = datetime.utcnow()
    past_metrics = metrics_manager.get_metrics(start_time=now - timedelta(minutes=5))
    assert len(past_metrics) == 3

def test_get_metric_stats(metrics_manager):
    """Prueba obtener estadísticas de métricas."""
    # Añadir métricas de prueba
    metrics_manager.add_metric('test_metric', 1.0)
    metrics_manager.add_metric('test_metric', 2.0)
    metrics_manager.add_metric('test_metric', 3.0)
    
    # Obtener estadísticas
    stats = metrics_manager.get_metric_stats('test_metric')
    
    assert stats['count'] == 3
    assert stats['min'] == 1.0
    assert stats['max'] == 3.0
    assert stats['avg'] == 2.0
    assert stats['sum'] == 6.0

def test_get_metric_stats_empty(metrics_manager):
    # Obtener estadísticas sin métricas
    stats = metrics_manager.get_metric_stats('nonexistent_metric')
    
    # Verificar estadísticas
    assert stats['count'] == 0
    assert stats['min'] is None
    assert stats['max'] is None
    assert stats['avg'] is None
    assert stats['first'] is None
    assert stats['last'] is None

def test_clear_metrics(metrics_manager):
    """Prueba limpiar métricas."""
    # Añadir métricas
    metrics_manager.add_metric('metric1', 1.0)
    metrics_manager.add_metric('metric2', 2.0)
    
    # Limpiar métricas
    metrics_manager.clear_metrics()
    
    assert len(metrics_manager.metrics) == 0
    assert metrics_manager.metrics_stats['total_metrics'] == 0

def test_get_system_metrics(metrics_manager):
    """Prueba obtener métricas del sistema."""
    system_metrics = metrics_manager.get_system_metrics()
    
    assert 'cpu' in system_metrics
    assert 'memory' in system_metrics
    assert 'disk' in system_metrics
    
    assert 'percent' in system_metrics['cpu']
    assert 'count' in system_metrics['cpu']
    
    assert 'percent' in system_metrics['memory']
    assert 'used' in system_metrics['memory']
    assert 'total' in system_metrics['memory']
    
    assert 'percent' in system_metrics['disk']
    assert 'used' in system_metrics['disk']
    assert 'total' in system_metrics['disk']

def test_get_status(metrics_manager):
    """Prueba obtener el estado del gestor."""
    status = metrics_manager.get_status()
    
    assert status['metrics_dir'] == metrics_manager.metrics_dir
    assert status['metrics_file'] == metrics_manager.metrics_file
    assert status['max_metrics'] == metrics_manager.max_metrics
    assert status['retention_period'] == metrics_manager.retention_period
    assert 'metrics' in status

def test_load_save_metrics(metrics_manager):
    """Prueba cargar y guardar métricas."""
    # Añadir métricas
    metrics_manager.add_metric('metric1', 1.0)
    metrics_manager.add_metric('metric2', 2.0)
    
    # Crear nuevo gestor
    new_manager = MetricsManager(metrics_manager.config)
    
    # Verificar que las métricas se cargaron correctamente
    assert len(new_manager.metrics) == 2
    assert new_manager.metrics_stats['total_metrics'] == 2 