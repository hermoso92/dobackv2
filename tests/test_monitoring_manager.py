import pytest
import os
import json
import time
from datetime import datetime, timedelta
from src.app.services.monitoring_manager import MonitoringManager, Metric, Alert
from src.app.exceptions import MonitoringError

@pytest.fixture
def monitoring_manager():
    config = {
        'metrics_dir': 'test_metrics',
        'metrics_file': 'test_metrics.json',
        'alerts_dir': 'test_alerts',
        'alerts_file': 'test_alerts.json',
        'metrics_retention': 3600,
        'alerts_retention': 86400
    }
    return MonitoringManager(config)

@pytest.fixture(autouse=True)
def cleanup():
    # Limpiar directorios de prueba
    yield
    for dir_name in ['test_metrics', 'test_alerts']:
        if os.path.exists(dir_name):
            import shutil
            shutil.rmtree(dir_name)

def test_init_monitoring_manager(monitoring_manager):
    # Verificar directorios
    assert os.path.exists(monitoring_manager.metrics_dir)
    assert os.path.exists(monitoring_manager.alerts_dir)
    
    # Verificar configuración
    assert monitoring_manager.metrics_file == 'test_metrics.json'
    assert monitoring_manager.alerts_file == 'test_alerts.json'
    assert monitoring_manager.metrics_retention == 3600
    assert monitoring_manager.alerts_retention == 86400
    
    # Verificar métricas iniciales
    assert monitoring_manager.metrics_stats['total_metrics'] == 0
    assert monitoring_manager.metrics_stats['total_alerts'] == 0
    assert monitoring_manager.metrics_stats['active_alerts'] == 0

def test_record_metric(monitoring_manager):
    # Registrar métrica
    metric = monitoring_manager.record_metric(
        name='test_metric',
        value=42.0,
        tags={'key': 'value'}
    )
    
    # Verificar métrica
    assert metric.name == 'test_metric'
    assert metric.value == 42.0
    assert metric.tags == {'key': 'value'}
    
    # Verificar archivo
    metrics_path = os.path.join(monitoring_manager.metrics_dir, monitoring_manager.metrics_file)
    assert os.path.exists(metrics_path)
    
    # Verificar contenido
    with open(metrics_path, 'r') as f:
        metrics_data = json.load(f)
        assert len(metrics_data) == 1
        assert metrics_data[0]['name'] == 'test_metric'
    
    # Verificar métricas
    assert monitoring_manager.metrics_stats['total_metrics'] == 1
    assert monitoring_manager.metrics_stats['metrics_by_name']['test_metric'] == 1

def test_create_alert(monitoring_manager):
    # Crear alerta
    alert = monitoring_manager.create_alert(
        name='test_alert',
        message='Test alert',
        severity='critical',
        source='test',
        details={'key': 'value'}
    )
    
    # Verificar alerta
    assert alert.name == 'test_alert'
    assert alert.message == 'Test alert'
    assert alert.severity == 'critical'
    assert alert.source == 'test'
    assert alert.details == {'key': 'value'}
    assert alert.status == 'active'
    
    # Verificar archivo
    alerts_path = os.path.join(monitoring_manager.alerts_dir, monitoring_manager.alerts_file)
    assert os.path.exists(alerts_path)
    
    # Verificar contenido
    with open(alerts_path, 'r') as f:
        alerts_data = json.load(f)
        assert len(alerts_data) == 1
        assert alerts_data[0]['name'] == 'test_alert'
    
    # Verificar métricas
    assert monitoring_manager.metrics_stats['total_alerts'] == 1
    assert monitoring_manager.metrics_stats['active_alerts'] == 1
    assert monitoring_manager.metrics_stats['alerts_by_severity']['critical'] == 1
    assert monitoring_manager.metrics_stats['alerts_by_source']['test'] == 1

def test_resolve_alert(monitoring_manager):
    # Crear alerta
    alert = monitoring_manager.create_alert(
        name='test_alert',
        message='Test alert',
        severity='critical',
        source='test'
    )
    
    # Resolver alerta
    monitoring_manager.resolve_alert('test_alert')
    
    # Verificar estado
    assert alert.status == 'resolved'
    
    # Verificar métricas
    assert monitoring_manager.metrics_stats['active_alerts'] == 0

def test_get_metrics(monitoring_manager):
    # Registrar métricas
    monitoring_manager.record_metric('metric1', 1.0, {'tag1': 'value1'})
    monitoring_manager.record_metric('metric2', 2.0, {'tag2': 'value2'})
    
    # Obtener todas las métricas
    all_metrics = monitoring_manager.get_metrics()
    assert len(all_metrics) == 2
    
    # Filtrar por nombre
    metric1 = monitoring_manager.get_metrics(name='metric1')
    assert len(metric1) == 1
    assert metric1[0].value == 1.0
    
    # Filtrar por tags
    tagged_metrics = monitoring_manager.get_metrics(tags={'tag1': 'value1'})
    assert len(tagged_metrics) == 1
    assert tagged_metrics[0].name == 'metric1'

def test_get_alerts(monitoring_manager):
    # Crear alertas
    monitoring_manager.create_alert(
        name='alert1',
        message='Alert 1',
        severity='critical',
        source='test1'
    )
    monitoring_manager.create_alert(
        name='alert2',
        message='Alert 2',
        severity='warning',
        source='test2'
    )
    
    # Obtener todas las alertas
    all_alerts = monitoring_manager.get_alerts()
    assert len(all_alerts) == 2
    
    # Filtrar por estado
    active_alerts = monitoring_manager.get_alerts(status='active')
    assert len(active_alerts) == 2
    
    # Filtrar por severidad
    critical_alerts = monitoring_manager.get_alerts(severity='critical')
    assert len(critical_alerts) == 1
    assert critical_alerts[0].name == 'alert1'
    
    # Filtrar por fuente
    test1_alerts = monitoring_manager.get_alerts(source='test1')
    assert len(test1_alerts) == 1
    assert test1_alerts[0].name == 'alert1'

def test_get_system_metrics(monitoring_manager):
    # Obtener métricas del sistema
    system_metrics = monitoring_manager.get_system_metrics()
    
    # Verificar estructura
    assert 'cpu' in system_metrics
    assert 'memory' in system_metrics
    assert 'disk' in system_metrics
    
    # Verificar valores
    assert 'percent' in system_metrics['cpu']
    assert 'count' in system_metrics['cpu']
    assert 'percent' in system_metrics['memory']
    assert 'used' in system_metrics['memory']
    assert 'total' in system_metrics['memory']
    assert 'percent' in system_metrics['disk']
    assert 'used' in system_metrics['disk']
    assert 'total' in system_metrics['disk']

def test_get_monitoring_stats(monitoring_manager):
    # Registrar métricas y alertas
    monitoring_manager.record_metric('metric1', 1.0)
    monitoring_manager.record_metric('metric2', 2.0)
    monitoring_manager.create_alert(
        name='alert1',
        message='Alert 1',
        severity='critical',
        source='test1'
    )
    monitoring_manager.create_alert(
        name='alert2',
        message='Alert 2',
        severity='warning',
        source='test2'
    )
    
    # Obtener estadísticas
    stats = monitoring_manager.get_monitoring_stats()
    
    # Verificar estadísticas
    assert stats['metrics']['total'] == 2
    assert stats['metrics']['by_name']['metric1'] == 1
    assert stats['metrics']['by_name']['metric2'] == 1
    assert stats['alerts']['total'] == 2
    assert stats['alerts']['active'] == 2
    assert stats['alerts']['by_severity']['critical'] == 1
    assert stats['alerts']['by_severity']['warning'] == 1
    assert stats['alerts']['by_source']['test1'] == 1
    assert stats['alerts']['by_source']['test2'] == 1

def test_get_status(monitoring_manager):
    # Obtener estado
    status = monitoring_manager.get_status()
    
    # Verificar propiedades
    assert isinstance(status, dict)
    assert status['metrics_dir'] == 'test_metrics'
    assert status['metrics_file'] == 'test_metrics.json'
    assert status['alerts_dir'] == 'test_alerts'
    assert status['alerts_file'] == 'test_alerts.json'
    assert status['metrics_retention'] == 3600
    assert status['alerts_retention'] == 86400
    assert 'stats' in status

def test_metric_creation():
    # Crear métrica
    metric = Metric('test_metric', 42.0, {'tag1': 'value1'})
    
    # Verificar propiedades
    assert metric.name == 'test_metric'
    assert metric.value == 42.0
    assert metric.tags == {'tag1': 'value1'}
    assert metric.timestamp is not None

def test_metric_to_dict():
    # Crear métrica
    metric = Metric('test_metric', 42.0, {'tag1': 'value1'})
    
    # Convertir a diccionario
    metric_dict = metric.to_dict()
    
    # Verificar propiedades
    assert metric_dict['name'] == 'test_metric'
    assert metric_dict['value'] == 42.0
    assert metric_dict['tags'] == {'tag1': 'value1'}
    assert metric_dict['timestamp'] is not None

def test_alert_creation():
    # Crear alerta
    alert = Alert('test_alert', 'Test message', 'warning', {'tag1': 'value1'})
    
    # Verificar propiedades
    assert alert.name == 'test_alert'
    assert alert.message == 'Test message'
    assert alert.severity == 'warning'
    assert alert.tags == {'tag1': 'value1'}
    assert alert.timestamp is not None
    assert alert.is_active

def test_alert_to_dict():
    # Crear alerta
    alert = Alert('test_alert', 'Test message', 'warning', {'tag1': 'value1'})
    
    # Convertir a diccionario
    alert_dict = alert.to_dict()
    
    # Verificar propiedades
    assert alert_dict['name'] == 'test_alert'
    assert alert_dict['message'] == 'Test message'
    assert alert_dict['severity'] == 'warning'
    assert alert_dict['tags'] == {'tag1': 'value1'}
    assert alert_dict['timestamp'] is not None
    assert alert_dict['is_active']

def test_get_metrics_with_filters(monitoring_manager):
    # Registrar métricas
    monitoring_manager.record_metric('metric1', 42.0, {'tag1': 'value1'})
    monitoring_manager.record_metric('metric1', 43.0, {'tag1': 'value2'})
    monitoring_manager.record_metric('metric2', 44.0, {'tag1': 'value1'})
    
    # Obtener métricas filtradas
    metrics = monitoring_manager.get_metrics(
        name='metric1',
        tags={'tag1': 'value1'}
    )
    
    # Verificar filtros
    assert len(metrics) == 1
    assert metrics[0].name == 'metric1'
    assert metrics[0].tags == {'tag1': 'value1'}

def test_alert_thresholds(monitoring_manager):
    # Registrar métrica por encima del umbral crítico
    monitoring_manager.record_metric('cpu_usage', 95.0)
    
    # Obtener alertas críticas
    critical_alerts = monitoring_manager.get_alerts(severity='critical')
    
    # Verificar que se creó la alerta
    assert len(critical_alerts) == 1
    assert critical_alerts[0].name == 'cpu_usage_critical'
    assert 'Valor crítico: 95.0' in critical_alerts[0].message

def test_cleanup_metrics(monitoring_manager):
    # Configurar retención corta
    monitoring_manager.metrics_retention = 1
    
    # Registrar métrica
    monitoring_manager.record_metric('test_metric', 42.0)
    
    # Esperar a que expire
    time.sleep(2)
    
    # Limpiar métricas
    monitoring_manager._cleanup_metrics()
    
    # Verificar que se limpió
    metrics = monitoring_manager.get_metrics()
    assert len(metrics) == 0

def test_cleanup_alerts(monitoring_manager):
    # Configurar retención corta
    monitoring_manager.alert_retention = 1
    
    # Crear alerta
    monitoring_manager.create_alert('test_alert', 'Test message', 'warning')
    
    # Esperar a que expire
    time.sleep(2)
    
    # Limpiar alertas
    monitoring_manager._cleanup_alerts()
    
    # Verificar que se limpió
    alerts = monitoring_manager.get_alerts()
    assert len(alerts) == 0

def test_get_monitoring_stats(monitoring_manager):
    # Registrar métricas y alertas
    monitoring_manager.record_metric('test_metric', 42.0)
    monitoring_manager.create_alert('test_alert', 'Test message', 'warning')
    
    # Obtener estadísticas
    stats = monitoring_manager.get_monitoring_stats()
    
    # Verificar estadísticas
    assert stats['total_metrics'] == 1
    assert stats['total_alerts'] == 1
    assert stats['active_alerts'] == 1
    assert 'system_metrics' in stats

def test_get_status(monitoring_manager):
    # Obtener estado
    status = monitoring_manager.get_status()
    
    # Verificar propiedades
    assert isinstance(status, dict)
    assert 'metrics_retention' in status
    assert 'metrics_interval' in status
    assert 'alert_retention' in status
    assert 'alert_thresholds' in status
    assert 'stats' in status

def test_get_metric_with_time_range(monitoring_manager):
    # Registrar métricas en diferentes tiempos
    current_time = time.time()
    
    # Métrica antigua
    old_metric = Metric('test_metric', 10.0, current_time - 7200)
    monitoring_manager.metrics['test_metric'].append(old_metric)
    
    # Métrica reciente
    new_metric = Metric('test_metric', 20.0, current_time - 1800)
    monitoring_manager.metrics['test_metric'].append(new_metric)
    
    # Obtener métricas en rango de tiempo
    metrics = monitoring_manager.get_metric(
        'test_metric',
        start_time=current_time - 3600,
        end_time=current_time
    )
    
    assert len(metrics) == 1
    assert metrics[0].value == 20.0

def test_get_metric_stats(monitoring_manager):
    # Registrar múltiples métricas
    monitoring_manager.record_metric('test_metric', 10.0)
    monitoring_manager.record_metric('test_metric', 20.0)
    monitoring_manager.record_metric('test_metric', 30.0)
    
    # Obtener estadísticas
    stats = monitoring_manager.get_metric_stats('test_metric')
    
    assert stats['count'] == 3
    assert stats['min'] == 10.0
    assert stats['max'] == 30.0
    assert stats['avg'] == 20.0

def test_get_alerts_with_filters(monitoring_manager):
    # Crear alertas de diferentes severidades
    monitoring_manager.create_alert('alert1', 'Warning message', 'warning')
    monitoring_manager.create_alert('alert2', 'Critical message', 'critical')
    
    # Filtrar por severidad
    warning_alerts = monitoring_manager.get_alerts(severity='warning')
    assert len(warning_alerts) == 1
    assert warning_alerts[0].name == 'alert1'
    
    critical_alerts = monitoring_manager.get_alerts(severity='critical')
    assert len(critical_alerts) == 1
    assert critical_alerts[0].name == 'alert2'

def test_check_alert_thresholds(monitoring_manager):
    # Registrar métrica que supera umbral de advertencia
    monitoring_manager.record_metric('cpu_usage', 75.0)
    
    # Verificar que se creó alerta
    alerts = monitoring_manager.get_alerts()
    assert len(alerts) == 1
    assert alerts[0].name == 'cpu_usage'
    assert alerts[0].severity == 'warning'
    
    # Registrar métrica que supera umbral crítico
    monitoring_manager.record_metric('cpu_usage', 95.0)
    
    # Verificar que se creó alerta crítica
    alerts = monitoring_manager.get_alerts()
    assert len(alerts) == 2
    assert any(a.severity == 'critical' for a in alerts)

def test_cleanup_old_metrics(monitoring_manager):
    # Registrar métrica antigua
    old_time = time.time() - 7200  # 2 horas atrás
    old_metric = Metric('test_metric', 10.0, old_time)
    monitoring_manager.metrics['test_metric'].append(old_metric)
    
    # Registrar métrica reciente
    new_metric = Metric('test_metric', 20.0, time.time())
    monitoring_manager.metrics['test_metric'].append(new_metric)
    
    # Limpiar métricas antiguas
    monitoring_manager._cleanup_old_metrics()
    
    # Verificar que solo quedó la métrica reciente
    metrics = monitoring_manager.get_metric('test_metric')
    assert len(metrics) == 1
    assert metrics[0].value == 20.0

def test_cleanup_old_alerts(monitoring_manager):
    # Crear alerta antigua
    old_time = time.time() - 172800  # 2 días atrás
    old_alert = Alert('old_alert', 'Old message', 'warning', old_time)
    monitoring_manager.alerts.append(old_alert)
    
    # Crear alerta reciente
    new_alert = Alert('new_alert', 'New message', 'warning', time.time())
    monitoring_manager.alerts.append(new_alert)
    
    # Limpiar alertas antiguas
    monitoring_manager._cleanup_old_alerts()
    
    # Verificar que solo quedó la alerta reciente
    alerts = monitoring_manager.get_alerts()
    assert len(alerts) == 1
    assert alerts[0].name == 'new_alert'

def test_update_system_metrics(monitoring_manager):
    # Actualizar métricas del sistema
    monitoring_manager.update_system_metrics()
    
    # Verificar que se registraron las métricas
    assert 'cpu_usage' in monitoring_manager.system_metrics
    assert 'memory_usage' in monitoring_manager.system_metrics
    assert 'disk_usage' in monitoring_manager.system_metrics
    assert 'network_io' in monitoring_manager.system_metrics

def test_start_monitoring(monitoring_manager):
    # Iniciar monitoreo
    monitoring_manager.start_monitoring()
    
    # Verificar estado
    assert monitoring_manager.is_monitoring is True
    assert monitoring_manager.monitoring_thread is not None
    assert monitoring_manager.monitoring_thread.is_alive()
    
    # Detener monitoreo
    monitoring_manager.stop_monitoring()

def test_stop_monitoring(monitoring_manager):
    # Iniciar monitoreo
    monitoring_manager.start_monitoring()
    
    # Detener monitoreo
    monitoring_manager.stop_monitoring()
    
    # Verificar estado
    assert monitoring_manager.is_monitoring is False
    assert not monitoring_manager.monitoring_thread.is_alive()

def test_collect_metrics(monitoring_manager):
    # Recolectar métricas
    monitoring_manager._collect_metrics()
    
    # Verificar métricas
    assert len(monitoring_manager.metrics['cpu']) > 0
    assert len(monitoring_manager.metrics['memory']) > 0
    assert len(monitoring_manager.metrics['disk']) > 0
    assert len(monitoring_manager.metrics['network']) > 0
    
    # Verificar contador
    assert monitoring_manager.metrics_count['total_metrics'] == 4

def test_check_alerts(monitoring_manager):
    # Configurar umbrales bajos para forzar alertas
    monitoring_manager.alert_thresholds = {
        'cpu_percent': 0,
        'memory_percent': 0,
        'disk_percent': 0
    }
    
    # Recolectar métricas
    monitoring_manager._collect_metrics()
    
    # Verificar alertas
    monitoring_manager._check_alerts()
    
    # Verificar que se crearon alertas
    assert len(monitoring_manager.alerts) > 0
    assert monitoring_manager.metrics_count['total_alerts'] > 0
    assert monitoring_manager.metrics_count['active_alerts'] > 0

def test_create_alert(monitoring_manager):
    # Crear alerta
    monitoring_manager._create_alert('cpu', 90)
    
    # Verificar alerta
    assert len(monitoring_manager.alerts) == 1
    alert = monitoring_manager.alerts[0]
    assert alert['metric'] == 'cpu'
    assert alert['value'] == 90
    assert alert['threshold'] == 80
    assert alert['status'] == 'active'
    
    # Verificar contador
    assert monitoring_manager.metrics_count['total_alerts'] == 1
    assert monitoring_manager.metrics_count['active_alerts'] == 1

def test_cleanup_metrics(monitoring_manager):
    # Añadir métricas antiguas
    old_time = datetime.utcnow() - timedelta(seconds=3601)
    monitoring_manager.metrics['cpu'].append({
        'timestamp': old_time,
        'value': 50
    })
    
    # Limpiar métricas
    monitoring_manager._cleanup_metrics()
    
    # Verificar que se eliminaron las métricas antiguas
    assert len(monitoring_manager.metrics['cpu']) == 0

def test_get_metrics(monitoring_manager):
    # Añadir métricas de prueba
    monitoring_manager.metrics['cpu'] = [
        {
            'timestamp': datetime.utcnow(),
            'value': 50
        }
    ]
    
    # Obtener métricas
    metrics = monitoring_manager.get_metrics('cpu')
    
    # Verificar métricas
    assert len(metrics) == 1
    assert metrics[0]['value'] == 50

def test_get_metrics_with_time_range(monitoring_manager):
    # Añadir métricas de prueba
    now = datetime.utcnow()
    monitoring_manager.metrics['cpu'] = [
        {
            'timestamp': now - timedelta(minutes=2),
            'value': 50
        },
        {
            'timestamp': now - timedelta(minutes=1),
            'value': 60
        },
        {
            'timestamp': now,
            'value': 70
        }
    ]
    
    # Obtener métricas con rango de tiempo
    start_time = now - timedelta(minutes=1, 30)
    end_time = now - timedelta(minutes=30)
    metrics = monitoring_manager.get_metrics(
        'cpu',
        start_time=start_time,
        end_time=end_time
    )
    
    # Verificar métricas
    assert len(metrics) == 1
    assert metrics[0]['value'] == 60

def test_get_alerts(monitoring_manager):
    # Añadir alertas de prueba
    monitoring_manager.alerts = [
        {
            'id': 1,
            'metric': 'cpu',
            'value': 90,
            'threshold': 80,
            'timestamp': datetime.utcnow(),
            'status': 'active'
        },
        {
            'id': 2,
            'metric': 'memory',
            'value': 85,
            'threshold': 80,
            'timestamp': datetime.utcnow(),
            'status': 'resolved'
        }
    ]
    
    # Obtener todas las alertas
    all_alerts = monitoring_manager.get_alerts()
    assert len(all_alerts) == 2
    
    # Obtener alertas activas
    active_alerts = monitoring_manager.get_alerts(status='active')
    assert len(active_alerts) == 1
    assert active_alerts[0]['metric'] == 'cpu'
    
    # Obtener alertas resueltas
    resolved_alerts = monitoring_manager.get_alerts(status='resolved')
    assert len(resolved_alerts) == 1
    assert resolved_alerts[0]['metric'] == 'memory'

def test_resolve_alert(monitoring_manager):
    # Añadir alerta de prueba
    monitoring_manager.alerts = [
        {
            'id': 1,
            'metric': 'cpu',
            'value': 90,
            'threshold': 80,
            'timestamp': datetime.utcnow(),
            'status': 'active'
        }
    ]
    
    # Resolver alerta
    monitoring_manager.resolve_alert(1)
    
    # Verificar estado
    assert monitoring_manager.alerts[0]['status'] == 'resolved'
    assert monitoring_manager.metrics_count['active_alerts'] == 0

def test_resolve_nonexistent_alert(monitoring_manager):
    # Intentar resolver alerta inexistente
    with pytest.raises(MonitoringError) as exc:
        monitoring_manager.resolve_alert(999)
    
    assert "Alerta no encontrada" in str(exc.value)

def test_get_status(monitoring_manager):
    # Obtener estado
    status = monitoring_manager.get_status()
    
    # Verificar propiedades
    assert isinstance(status, dict)
    assert status['is_monitoring'] is False
    assert status['monitoring_interval'] == 1
    assert status['metrics_retention'] == 3600
    assert status['alert_thresholds']['cpu_percent'] == 80
    assert status['alert_thresholds']['memory_percent'] == 80
    assert status['alert_thresholds']['disk_percent'] == 80
    assert status['alert_thresholds']['response_time'] == 1000
    assert 'metrics_count' in status 