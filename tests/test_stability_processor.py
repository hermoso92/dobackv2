import pytest
import numpy as np
from src.app.services.stability_processor import StabilityProcessor, StabilityMetrics
from src.app.utils.validation import DataValidator

@pytest.fixture
def validator():
    config = {
        'validation_rules': {
            'acceleration_y': {
                'min_value': -2.0,
                'max_value': 2.0,
                'required': True,
                'data_type': 'float'
            },
            'roll_angle': {
                'min_value': -90,
                'max_value': 90,
                'required': True,
                'data_type': 'float'
            },
            'speed': {
                'min_value': 0,
                'max_value': 200,
                'required': True,
                'data_type': 'float'
            }
        }
    }
    return DataValidator(config)

@pytest.fixture
def processor(validator):
    config = {
        'window_size': 10,
        'track_width': 2.0,
        'cg_height': 1.5,
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
    return StabilityProcessor(config, validator)

def test_process_data_valid(processor):
    data = {
        'acceleration_y': 1.0,
        'roll_angle': 5.0,
        'speed': 100,
        'gyro_x': 0.1,
        'gyro_y': 0.2,
        'gyro_z': 0.3
    }
    metrics = processor.process_data(data)
    assert isinstance(metrics, StabilityMetrics)
    assert -1.0 <= metrics.ltr <= 1.0
    assert metrics.ssf >= 0
    assert metrics.danger_level >= 0 and metrics.danger_level <= 1.0

def test_process_data_invalid(processor):
    data = {
        'acceleration_y': 1.0,
        'roll_angle': 5.0
        # Falta 'speed'
    }
    with pytest.raises(Exception):
        processor.process_data(data)

def test_calculate_ltr(processor):
    data = {
        'acceleration_y': 1.0,
        'roll_angle': 5.0,
        'speed': 100,
        'gyro_z': 0.3
    }
    ltr = processor._calculate_ltr(data)
    assert -1.0 <= ltr <= 1.0

def test_calculate_ssf(processor):
    data = {
        'track_width': 2.0,
        'cg_height': 1.5,
        'inclination_sensor': 5.0
    }
    ssf = processor._calculate_ssf(data)
    assert ssf >= 0

def test_calculate_drs(processor):
    data = {
        'acceleration_y': 1.0,
        'roll_angle': 5.0,
        'speed': 100,
        'gyro_x': 0.1,
        'gyro_z': 0.3
    }
    drs = processor._calculate_drs(data)
    assert isinstance(drs, float)

def test_calculate_danger_level(processor):
    ltr = 0.7
    ssf = 1.0
    drs = 0.3
    danger_level = processor._calculate_danger_level(ltr, ssf, drs)
    assert 0 <= danger_level <= 1.0

def test_check_alarms_warning(processor):
    ltr = 0.7  # Por encima del umbral de warning
    ssf = 1.5
    drs = 0.5
    alarms = processor._check_alarms(ltr, ssf, drs)
    assert len(alarms) > 0
    assert any(alarm['type'] == 'LTR' and alarm['level'] == 'warning' for alarm in alarms)

def test_check_alarms_danger(processor):
    ltr = 0.5
    ssf = 0.9  # Por debajo del umbral de danger
    drs = 0.5
    alarms = processor._check_alarms(ltr, ssf, drs)
    assert len(alarms) > 0
    assert any(alarm['type'] == 'SSF' and alarm['level'] == 'danger' for alarm in alarms)

def test_check_alarms_critical(processor):
    ltr = 0.5
    ssf = 1.5
    drs = 0.05  # Por debajo del umbral crítico
    alarms = processor._check_alarms(ltr, ssf, drs)
    assert len(alarms) > 0
    assert any(alarm['type'] == 'DRS' and alarm['level'] == 'critical' for alarm in alarms)

def test_get_buffer_stats(processor):
    # Añadir datos al buffer
    for i in range(5):
        data = {
            'acceleration_x': i,
            'acceleration_y': i * 2,
            'acceleration_z': i * 3,
            'gyro_x': i * 0.1,
            'gyro_y': i * 0.2,
            'gyro_z': i * 0.3,
            'speed': i * 20
        }
        processor.process_data(data)
    
    stats = processor.get_buffer_stats()
    assert 'acceleration_x' in stats
    assert 'mean' in stats['acceleration_x']
    assert 'std' in stats['acceleration_x']
    assert 'min' in stats['acceleration_x']
    assert 'max' in stats['acceleration_x'] 