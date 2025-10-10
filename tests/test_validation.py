import pytest
from src.app.utils.validation import DataValidator, ValidationRule

@pytest.fixture
def validator():
    config = {
        'validation_rules': {
            'acceleration_x': {
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
        }
    }
    return DataValidator(config)

def test_validate_telemetry_data_valid(validator):
    data = {
        'acceleration_x': 1.0,
        'speed': 100,
        'timestamp': '2024-01-01T00:00:00'
    }
    is_valid, errors = validator.validate_telemetry_data(data)
    assert is_valid
    assert len(errors) == 0

def test_validate_telemetry_data_missing_field(validator):
    data = {
        'acceleration_x': 1.0,
        'speed': 100
        # Falta 'timestamp'
    }
    is_valid, errors = validator.validate_telemetry_data(data)
    assert not is_valid
    assert len(errors) > 0
    assert any('timestamp' in error for error in errors)

def test_validate_telemetry_data_invalid_type(validator):
    data = {
        'acceleration_x': '1.0',  # Debería ser float
        'speed': 100,
        'timestamp': '2024-01-01T00:00:00'
    }
    is_valid, errors = validator.validate_telemetry_data(data)
    assert not is_valid
    assert len(errors) > 0
    assert any('acceleration_x' in error for error in errors)

def test_validate_telemetry_data_out_of_range(validator):
    data = {
        'acceleration_x': 2.5,  # Por encima del máximo
        'speed': 100,
        'timestamp': '2024-01-01T00:00:00'
    }
    is_valid, errors = validator.validate_telemetry_data(data)
    assert not is_valid
    assert len(errors) > 0
    assert any('acceleration_x' in error for error in errors)

def test_validate_telemetry_data_field_relationships(validator):
    data = {
        'acceleration_x': 150,  # Mayor que la velocidad
        'speed': 100,
        'timestamp': '2024-01-01T00:00:00'
    }
    is_valid, errors = validator.validate_telemetry_data(data)
    assert not is_valid
    assert len(errors) > 0
    assert any('Aceleración excede la velocidad' in error for error in errors)

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

def test_validate_vehicle_data_exceeds_maximum(validator):
    data = {
        'track_width': 6.0,  # Excede el máximo
        'cg_height': 1.5,
        'wheelbase': 4.0,
        'mass': 2000.0
    }
    is_valid, errors = validator.validate_vehicle_data(data)
    assert not is_valid
    assert len(errors) > 0
    assert any('excede el ancho máximo' in error for error in errors)

def test_update_rules(validator):
    new_rules = {
        'acceleration_x': {
            'min_value': -3.0,
            'max_value': 3.0,
            'required': True,
            'data_type': 'float'
        }
    }
    validator.update_rules(new_rules)
    
    # Verificar que las reglas se actualizaron
    assert validator.rules['acceleration_x'].min_value == -3.0
    assert validator.rules['acceleration_x'].max_value == 3.0

def test_add_custom_validator(validator):
    def custom_validator(value: float) -> bool:
        return value % 2 == 0  # Solo valores pares
    
    validator.add_custom_validator('speed', custom_validator)
    
    # Probar con valor impar
    data = {
        'acceleration_x': 1.0,
        'speed': 101,  # Valor impar
        'timestamp': '2024-01-01T00:00:00'
    }
    is_valid, errors = validator.validate_telemetry_data(data)
    assert not is_valid
    assert len(errors) > 0
    assert any('Validación personalizada fallida' in error for error in errors)
    
    # Probar con valor par
    data['speed'] = 100  # Valor par
    is_valid, errors = validator.validate_telemetry_data(data)
    assert is_valid
    assert len(errors) == 0 