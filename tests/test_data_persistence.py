import pytest
import os
import json
from datetime import datetime, timedelta
from src.app.services.data_persistence import DataPersistence

@pytest.fixture
def persistence():
    config = {
        'data_dir': 'test_data'
    }
    persistence = DataPersistence(config)
    yield persistence
    
    # Limpiar después de las pruebas
    if os.path.exists('test_data'):
        for root, dirs, files in os.walk('test_data', topdown=False):
            for name in files:
                os.remove(os.path.join(root, name))
            for name in dirs:
                os.rmdir(os.path.join(root, name))
        os.rmdir('test_data')

def test_save_and_load_config(persistence):
    config_name = 'test_config'
    config_data = {
        'param1': 'value1',
        'param2': 123,
        'param3': [1, 2, 3]
    }
    
    # Guardar configuración
    persistence.save_config(config_name, config_data)
    
    # Cargar configuración
    loaded_config = persistence.load_config(config_name)
    
    assert loaded_config == config_data

def test_save_and_get_alarms(persistence):
    alarm_data = {
        'type': 'LTR',
        'level': 'warning',
        'value': 0.7,
        'threshold': 0.6
    }
    
    # Guardar alarma
    persistence.save_alarm(alarm_data)
    
    # Obtener alarmas
    alarms = persistence.get_alarms()
    
    assert len(alarms) == 1
    assert alarms[0]['type'] == alarm_data['type']
    assert alarms[0]['level'] == alarm_data['level']
    assert alarms[0]['value'] == alarm_data['value']
    assert alarms[0]['threshold'] == alarm_data['threshold']
    assert 'timestamp' in alarms[0]

def test_get_alarms_date_range(persistence):
    # Crear alarmas en diferentes fechas
    alarm1 = {
        'type': 'LTR',
        'level': 'warning',
        'value': 0.7,
        'threshold': 0.6
    }
    alarm2 = {
        'type': 'SSF',
        'level': 'danger',
        'value': 0.9,
        'threshold': 1.0
    }
    
    # Guardar alarmas
    persistence.save_alarm(alarm1)
    persistence.save_alarm(alarm2)
    
    # Obtener alarmas en rango de fechas
    start_date = datetime.now() - timedelta(hours=1)
    end_date = datetime.now() + timedelta(hours=1)
    alarms = persistence.get_alarms(start_date, end_date)
    
    assert len(alarms) == 2

def test_save_and_get_telemetry(persistence):
    telemetry_data = {
        'acceleration_x': 1.0,
        'acceleration_y': 0.5,
        'acceleration_z': 9.81,
        'speed': 100
    }
    
    # Guardar telemetría
    persistence.save_telemetry(telemetry_data)
    
    # Obtener telemetría
    start_date = datetime.now() - timedelta(hours=1)
    end_date = datetime.now() + timedelta(hours=1)
    telemetry = persistence.get_telemetry(start_date, end_date)
    
    assert len(telemetry) == 1
    assert telemetry[0]['acceleration_x'] == telemetry_data['acceleration_x']
    assert telemetry[0]['acceleration_y'] == telemetry_data['acceleration_y']
    assert telemetry[0]['acceleration_z'] == telemetry_data['acceleration_z']
    assert telemetry[0]['speed'] == telemetry_data['speed']
    assert 'timestamp' in telemetry[0]

def test_cleanup_old_data(persistence):
    # Crear directorio antiguo
    old_date = datetime.now() - timedelta(days=31)
    old_date_str = old_date.strftime('%Y%m%d')
    old_dir = os.path.join('test_data', 'telemetry', old_date_str)
    os.makedirs(old_dir, exist_ok=True)
    
    # Crear archivo en directorio antiguo
    with open(os.path.join(old_dir, 'test.jsonl'), 'w') as f:
        f.write('{"test": "data"}\n')
    
    # Limpiar datos antiguos
    persistence.cleanup_old_data(days_to_keep=30)
    
    # Verificar que el directorio antiguo fue eliminado
    assert not os.path.exists(old_dir)

def test_error_handling(persistence):
    # Intentar cargar configuración inexistente
    with pytest.raises(Exception):
        persistence.load_config('nonexistent_config')
    
    # Intentar guardar datos inválidos
    with pytest.raises(Exception):
        persistence.save_config('test', {'invalid': object()})
    
    # Intentar obtener telemetría con fechas inválidas
    with pytest.raises(Exception):
        persistence.get_telemetry(
            datetime.now() + timedelta(days=1),
            datetime.now()
        ) 