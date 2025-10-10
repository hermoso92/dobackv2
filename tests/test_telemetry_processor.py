import pytest
from datetime import datetime
from src.app.services.telemetry_processor import TelemetryProcessor, TelemetryData

@pytest.fixture
def processor():
    config = {
        'window_size': 10,
        'validation_rules': {
            'acceleration_x': {
                'min_value': -2.0,
                'max_value': 2.0,
                'required': True,
                'data_type': 'float'
            },
            'acceleration_y': {
                'min_value': -2.0,
                'max_value': 2.0,
                'required': True,
                'data_type': 'float'
            },
            'acceleration_z': {
                'min_value': -2.0,
                'max_value': 2.0,
                'required': True,
                'data_type': 'float'
            },
            'speed': {
                'min_value': 0,
                'max_value': 200,
                'required': True,
                'data_type': 'float'
            },
            'timestamp': {
                'required': True,
                'data_type': 'str'
            }
        },
        'stability_config': {
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
    }
    return TelemetryProcessor(config)

def test_process_data_valid(processor):
    data = {
        'timestamp': '2024-01-01T00:00:00',
        'acceleration_x': 1.0,
        'acceleration_y': 0.5,
        'acceleration_z': 9.81,
        'gyro_x': 0.1,
        'gyro_y': 0.2,
        'gyro_z': 0.3,
        'speed': 100,
        'latitude': 40.4168,
        'longitude': -3.7038,
        'altitude': 100,
        'heading': 45
    }
    telemetry_data = processor.process_data(data)
    assert isinstance(telemetry_data, TelemetryData)
    assert isinstance(telemetry_data.timestamp, datetime)
    assert 'x' in telemetry_data.acceleration
    assert 'y' in telemetry_data.acceleration
    assert 'z' in telemetry_data.acceleration
    assert 'magnitude' in telemetry_data.acceleration
    assert telemetry_data.speed == 100

def test_process_data_invalid(processor):
    data = {
        'timestamp': '2024-01-01T00:00:00',
        'acceleration_x': 1.0,
        'acceleration_y': 0.5
        # Faltan campos requeridos
    }
    with pytest.raises(Exception):
        processor.process_data(data)

def test_process_acceleration(processor):
    data = {
        'acceleration_x': 1.0,
        'acceleration_y': 2.0,
        'acceleration_z': 3.0
    }
    acceleration = processor._process_acceleration(data)
    assert acceleration['x'] == 1.0
    assert acceleration['y'] == 2.0
    assert acceleration['z'] == 3.0
    assert acceleration['magnitude'] == pytest.approx(3.7416573867739413)

def test_process_gyro(processor):
    data = {
        'gyro_x': 0.1,
        'gyro_y': 0.2,
        'gyro_z': 0.3
    }
    gyro = processor._process_gyro(data)
    assert gyro['x'] == 0.1
    assert gyro['y'] == 0.2
    assert gyro['z'] == 0.3
    assert gyro['magnitude'] == pytest.approx(0.37416573867739413)

def test_process_position(processor):
    data = {
        'latitude': 40.4168,
        'longitude': -3.7038,
        'altitude': 100,
        'heading': 45
    }
    position = processor._process_position(data)
    assert position['latitude'] == 40.4168
    assert position['longitude'] == -3.7038
    assert position['altitude'] == 100
    assert position['heading'] == 45

def test_get_buffer_stats(processor):
    # Añadir datos al buffer
    for i in range(5):
        data = {
            'timestamp': f'2024-01-01T00:00:0{i}',
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

def test_get_processing_rate(processor):
    # Añadir datos al buffer
    for i in range(5):
        data = {
            'timestamp': f'2024-01-01T00:00:0{i}',
            'acceleration_x': i,
            'acceleration_y': i * 2,
            'acceleration_z': i * 3,
            'gyro_x': i * 0.1,
            'gyro_y': i * 0.2,
            'gyro_z': i * 0.3,
            'speed': i * 20
        }
        processor.process_data(data)
    
    rate = processor.get_processing_rate()
    assert rate > 0

def test_clear_buffer(processor):
    # Añadir datos al buffer
    data = {
        'timestamp': '2024-01-01T00:00:00',
        'acceleration_x': 1.0,
        'acceleration_y': 0.5,
        'acceleration_z': 9.81,
        'gyro_x': 0.1,
        'gyro_y': 0.2,
        'gyro_z': 0.3,
        'speed': 100
    }
    processor.process_data(data)
    assert len(processor.data_buffer) > 0
    
    processor.clear_buffer()
    assert len(processor.data_buffer) == 0 