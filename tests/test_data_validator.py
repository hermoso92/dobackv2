import pytest
from src.app.utils.data_validator import DataValidator, ValidationThresholds

@pytest.fixture
def validator():
    config = {
        'validation_thresholds': {
            'acceleration_x': {
                'min_value': -2.0,
                'max_value': 2.0,
                'warning_threshold': 1.5,
                'critical_threshold': 1.8
            },
            'speed': {
                'min_value': 0,
                'max_value': 200,
                'warning_threshold': 150,
                'critical_threshold': 180
            }
        }
    }
    return DataValidator(config)

def test_validate_telemetry_data_valid(validator):
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
    is_valid, errors = validator.validate_telemetry_data(data)
    assert is_valid
    assert len(errors) == 0

def test_validate_telemetry_data_missing_field(validator):
    data = {
        'timestamp': '2024-01-01T00:00:00',
        'acceleration_x': 1.0,
        'acceleration_y': 0.5,
        'acceleration_z': 9.81,
        'gyro_x': 0.1,
        'gyro_y': 0.2,
        'gyro_z': 0.3
        # Falta 'speed'
    }
    is_valid, errors = validator.validate_telemetry_data(data)
    assert not is_valid
    assert len(errors) > 0
    assert any('speed' in error for error in errors)

def test_validate_telemetry_data_invalid_type(validator):
    data = {
        'timestamp': '2024-01-01T00:00:00',
        'acceleration_x': '1.0',  # Debería ser float
        'acceleration_y': 0.5,
        'acceleration_z': 9.81,
        'gyro_x': 0.1,
        'gyro_y': 0.2,
        'gyro_z': 0.3,
        'speed': 100
    }
    is_valid, errors = validator.validate_telemetry_data(data)
    assert not is_valid
    assert len(errors) > 0
    assert any('acceleration_x' in error for error in errors)

def test_validate_telemetry_data_out_of_range(validator):
    data = {
        'timestamp': '2024-01-01T00:00:00',
        'acceleration_x': 2.5,  # Por encima del máximo
        'acceleration_y': 0.5,
        'acceleration_z': 9.81,
        'gyro_x': 0.1,
        'gyro_y': 0.2,
        'gyro_z': 0.3,
        'speed': 100
    }
    is_valid, errors = validator.validate_telemetry_data(data)
    assert not is_valid
    assert len(errors) > 0
    assert any('acceleration_x' in error for error in errors)

def test_validate_vehicle_data_valid(validator):
    data = {
        'track_width': 2.0,
        'cg_height': 1.5,
        'wheelbase': 4.0,
        'mass': 2000.0
    }
    is_valid, errors = validator.validate_vehicle_data(data)
    assert is_valid
    assert len(errors) == 0

def test_validate_vehicle_data_invalid(validator):
    data = {
        'track_width': -2.0,  # Valor negativo
        'cg_height': 1.5,
        'wheelbase': 4.0,
        'mass': 2000.0
    }
    is_valid, errors = validator.validate_vehicle_data(data)
    assert not is_valid
    assert len(errors) > 0
    assert any('track_width' in error for error in errors)

def test_update_thresholds(validator):
    new_thresholds = {
        'acceleration_x': {
            'min_value': -3.0,
            'max_value': 3.0,
            'warning_threshold': 2.0,
            'critical_threshold': 2.5
        }
    }
    validator.update_thresholds(new_thresholds)
    
    # Verificar que los umbrales se actualizaron
    assert validator.thresholds['acceleration_x'].min_value == -3.0
    assert validator.thresholds['acceleration_x'].max_value == 3.0
    assert validator.thresholds['acceleration_x'].warning_threshold == 2.0
    assert validator.thresholds['acceleration_x'].critical_threshold == 2.5 