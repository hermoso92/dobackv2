import pytest
from src.app.services.alarm_system import AlarmSystem, AlarmThreshold

@pytest.fixture
def alarm_system():
    config = {
        'alarm_thresholds': {
            'ltr': {
                'warning': 0.6,
                'danger': 0.8,
                'critical': 0.9
            },
            'ssf': {
                'warning': 1.2,
                'danger': 1.0,
                'critical': 0.8
            },
            'drs': {
                'warning': 0.4,
                'danger': 0.2,
                'critical': 0.1
            }
        }
    }
    return AlarmSystem(config)

def test_check_alarms_no_alarms(alarm_system):
    metrics = {
        'ltr': 0.5,
        'ssf': 1.5,
        'drs': 0.5
    }
    alarms = alarm_system.check_alarms(metrics)
    assert len(alarms) == 0

def test_check_alarms_warning(alarm_system):
    metrics = {
        'ltr': 0.7,  # Por encima del umbral de warning
        'ssf': 1.5,
        'drs': 0.5
    }
    alarms = alarm_system.check_alarms(metrics)
    assert len(alarms) == 1
    assert alarms[0]['level'] == 'warning'
    assert alarms[0]['type'] == 'LTR'

def test_check_alarms_danger(alarm_system):
    metrics = {
        'ltr': 0.5,
        'ssf': 0.9,  # Por debajo del umbral de danger
        'drs': 0.5
    }
    alarms = alarm_system.check_alarms(metrics)
    assert len(alarms) == 1
    assert alarms[0]['level'] == 'danger'
    assert alarms[0]['type'] == 'SSF'

def test_check_alarms_critical(alarm_system):
    metrics = {
        'ltr': 0.5,
        'ssf': 1.5,
        'drs': 0.05  # Por debajo del umbral crítico
    }
    alarms = alarm_system.check_alarms(metrics)
    assert len(alarms) == 1
    assert alarms[0]['level'] == 'critical'
    assert alarms[0]['type'] == 'DRS'

def test_check_alarms_multiple(alarm_system):
    metrics = {
        'ltr': 0.7,  # Warning
        'ssf': 0.9,  # Danger
        'drs': 0.05  # Critical
    }
    alarms = alarm_system.check_alarms(metrics)
    assert len(alarms) == 3
    levels = {alarm['level'] for alarm in alarms}
    assert 'warning' in levels
    assert 'danger' in levels
    assert 'critical' in levels

def test_get_active_alarms(alarm_system):
    metrics = {
        'ltr': 0.7,
        'ssf': 0.9,
        'drs': 0.05
    }
    alarm_system.check_alarms(metrics)
    active_alarms = alarm_system.get_active_alarms()
    assert len(active_alarms) == 3

def test_clear_alarms(alarm_system):
    metrics = {
        'ltr': 0.7,
        'ssf': 0.9,
        'drs': 0.05
    }
    alarm_system.check_alarms(metrics)
    assert len(alarm_system.get_active_alarms()) > 0
    
    alarm_system.clear_alarms()
    assert len(alarm_system.get_active_alarms()) == 0

def test_update_thresholds(alarm_system):
    new_thresholds = {
        'ltr': {
            'warning': 0.7,
            'danger': 0.9,
            'critical': 1.0
        }
    }
    alarm_system.update_thresholds(new_thresholds)
    
    # Verificar que los umbrales se actualizaron
    assert alarm_system.thresholds['ltr'].warning == 0.7
    assert alarm_system.thresholds['ltr'].danger == 0.9
    assert alarm_system.thresholds['ltr'].critical == 1.0 