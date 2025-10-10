import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from src.automation.validations.vehicle_validation import (
    validate_vehicle_data,
    validate_vehicle_specifications,
    validate_vehicle_state,
    validate_vehicle_history,
    validate_vehicle_assignments
)

# Fixtures para pruebas de vehículos
@pytest.fixture
def valid_vehicle_data():
    """Fixture que proporciona datos de vehículo válidos"""
    return pd.DataFrame({
        'vehicle_id': ['V001', 'V002', 'V003', 'V004', 'V005'],
        'plate_number': ['ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345'],
        'make': ['Toyota', 'Ford', 'Chevrolet', 'Honda', 'Nissan'],
        'model': ['Camry', 'F-150', 'Silverado', 'Civic', 'Altima'],
        'year': [2020, 2021, 2022, 2023, 2024],
        'vin': [
            '1HGCM82633A123456',
            '2HGES16575H123456',
            '3HGCM82633A123456',
            '4HGES16575H123456',
            '5HGCM82633A123456'
        ],
        'type': ['sedan', 'truck', 'truck', 'sedan', 'sedan'],
        'status': ['active', 'active', 'maintenance', 'active', 'inactive'],
        'company_id': ['C001', 'C001', 'C002', 'C002', 'C003'],
        'driver_id': ['D001', 'D002', 'D003', 'D004', None],
        'purchase_date': [
            datetime(2020, 1, 1),
            datetime(2021, 1, 1),
            datetime(2022, 1, 1),
            datetime(2023, 1, 1),
            datetime(2024, 1, 1)
        ],
        'last_maintenance': [
            datetime(2023, 12, 1),
            datetime(2023, 12, 15),
            datetime(2023, 12, 30),
            datetime(2024, 1, 15),
            None
        ],
        'mileage': [50000, 30000, 20000, 10000, 0]
    })

@pytest.fixture
def valid_vehicle_specifications():
    """Fixture que proporciona especificaciones de vehículo válidas"""
    return {
        'Toyota Camry': {
            'type': 'sedan',
            'weight': 1500,
            'max_load': 500,
            'fuel_capacity': 50,
            'engine_power': 200,
            'transmission': 'automatic',
            'tire_size': '215/55R17',
            'safety_features': [
                'ABS',
                'ESP',
                'airbags',
                'traction_control'
            ]
        },
        'Ford F-150': {
            'type': 'truck',
            'weight': 2500,
            'max_load': 1500,
            'fuel_capacity': 80,
            'engine_power': 400,
            'transmission': 'automatic',
            'tire_size': '275/65R18',
            'safety_features': [
                'ABS',
                'ESP',
                'airbags',
                'traction_control',
                'hill_assist'
            ]
        }
    }

@pytest.fixture
def valid_vehicle_state():
    """Fixture que proporciona estado de vehículo válido"""
    return {
        'V001': {
            'status': 'active',
            'location': {
                'latitude': 19.4326,
                'longitude': -99.1332,
                'altitude': 2240
            },
            'fuel_level': 75,
            'battery_voltage': 12.5,
            'tire_pressure': [32, 32, 32, 32],
            'engine_status': 'running',
            'speed': 0,
            'odometer': 50000,
            'last_update': datetime.now()
        }
    }

# Tests para validate_vehicle_data
def test_validate_vehicle_data_success(valid_vehicle_data):
    """Test para validar datos de vehículo válidos"""
    success, messages = validate_vehicle_data(valid_vehicle_data)
    assert success
    assert "Datos de vehículo válidos" in messages[0]

def test_validate_vehicle_data_missing_columns():
    """Test para validar datos de vehículo con columnas faltantes"""
    df = valid_vehicle_data.copy()
    df = df.drop('plate_number', axis=1)
    
    success, messages = validate_vehicle_data(df)
    assert not success
    assert "Columnas requeridas faltantes" in messages[0]

def test_validate_vehicle_data_invalid_types():
    """Test para validar datos de vehículo con tipos inválidos"""
    df = valid_vehicle_data.copy()
    df['year'] = df['year'].astype(str)
    
    success, messages = validate_vehicle_data(df)
    assert not success
    assert "Tipos de datos inválidos" in messages[0]

# Tests para validate_vehicle_specifications
def test_validate_vehicle_specifications_success(valid_vehicle_specifications):
    """Test para validar especificaciones de vehículo válidas"""
    success, messages = validate_vehicle_specifications(valid_vehicle_specifications)
    assert success
    assert "Especificaciones de vehículo válidas" in messages[0]

def test_validate_vehicle_specifications_invalid_values():
    """Test para validar especificaciones de vehículo con valores inválidos"""
    specs = valid_vehicle_specifications.copy()
    specs['Toyota Camry']['weight'] = -1500
    
    success, messages = validate_vehicle_specifications(specs)
    assert not success
    assert "Valores inválidos" in messages[0]

def test_validate_vehicle_specifications_missing_required():
    """Test para validar especificaciones de vehículo con campos requeridos faltantes"""
    specs = valid_vehicle_specifications.copy()
    del specs['Toyota Camry']['safety_features']
    
    success, messages = validate_vehicle_specifications(specs)
    assert not success
    assert "Campos requeridos faltantes" in messages[0]

# Tests para validate_vehicle_state
def test_validate_vehicle_state_success(valid_vehicle_state):
    """Test para validar estado de vehículo válido"""
    success, messages = validate_vehicle_state(valid_vehicle_state)
    assert success
    assert "Estado de vehículo válido" in messages[0]

def test_validate_vehicle_state_invalid_location():
    """Test para validar estado de vehículo con ubicación inválida"""
    state = valid_vehicle_state.copy()
    state['V001']['location']['latitude'] = 91.0
    
    success, messages = validate_vehicle_state(state)
    assert not success
    assert "Ubicación inválida" in messages[0]

def test_validate_vehicle_state_invalid_measurements():
    """Test para validar estado de vehículo con mediciones inválidas"""
    state = valid_vehicle_state.copy()
    state['V001']['fuel_level'] = 150
    
    success, messages = validate_vehicle_state(state)
    assert not success
    assert "Mediciones inválidas" in messages[0]

# Tests para validate_vehicle_history
def test_validate_vehicle_history_success(valid_vehicle_data):
    """Test para validar historial de vehículo válido"""
    success, messages = validate_vehicle_history(valid_vehicle_data)
    assert success
    assert "Historial de vehículo válido" in messages[0]

def test_validate_vehicle_history_invalid_dates():
    """Test para validar historial de vehículo con fechas inválidas"""
    df = valid_vehicle_data.copy()
    df.loc[0, 'purchase_date'] = df.loc[0, 'last_maintenance'] + timedelta(days=1)
    
    success, messages = validate_vehicle_history(df)
    assert not success
    assert "Fechas inválidas" in messages[0]

def test_validate_vehicle_history_inconsistent_mileage():
    """Test para validar historial de vehículo con kilometraje inconsistente"""
    df = valid_vehicle_data.copy()
    df.loc[0, 'mileage'] = -1
    
    success, messages = validate_vehicle_history(df)
    assert not success
    assert "Kilometraje inconsistente" in messages[0]

# Tests para validate_vehicle_assignments
def test_validate_vehicle_assignments_success(valid_vehicle_data):
    """Test para validar asignaciones de vehículo válidas"""
    success, messages = validate_vehicle_assignments(valid_vehicle_data)
    assert success
    assert "Asignaciones de vehículo válidas" in messages[0]

def test_validate_vehicle_assignments_invalid_status():
    """Test para validar asignaciones de vehículo con estado inválido"""
    df = valid_vehicle_data.copy()
    df.loc[0, 'status'] = 'invalid'
    
    success, messages = validate_vehicle_assignments(df)
    assert not success
    assert "Estado inválido" in messages[0]

def test_validate_vehicle_assignments_invalid_driver():
    """Test para validar asignaciones de vehículo con conductor inválido"""
    df = valid_vehicle_data.copy()
    df.loc[0, 'driver_id'] = 'invalid_driver'
    
    success, messages = validate_vehicle_assignments(df)
    assert not success
    assert "Conductor inválido" in messages[0] 