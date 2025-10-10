import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from src.automation.validations.telemetry_validation import (
    validate_telemetry_data,
    validate_telemetry_ranges,
    validate_telemetry_format,
    validate_telemetry_integrity,
    validate_telemetry_consistency
)

# Fixtures para pruebas de telemetría
@pytest.fixture
def valid_telemetry_data():
    """Fixture que proporciona datos de telemetría válidos"""
    return pd.DataFrame({
        'timestamp': pd.date_range(start='2024-01-01', periods=5, freq='H'),
        'vehicle_id': ['V001', 'V001', 'V001', 'V001', 'V001'],
        'engine_rpm': [1500, 2000, 2500, 3000, 3500],
        'fuel_level': [80, 75, 70, 65, 60],
        'engine_temperature': [85, 87, 90, 92, 95],
        'battery_voltage': [12.5, 12.4, 12.3, 12.2, 12.1],
        'tire_pressure': [32, 31.5, 31, 30.5, 30],
        'odometer': [1000, 1050, 1100, 1150, 1200],
        'speed': [30, 35, 40, 45, 50],
        'latitude': [19.4326, 19.4327, 19.4328, 19.4329, 19.4330],
        'longitude': [-99.1332, -99.1333, -99.1334, -99.1335, -99.1336],
        'altitude': [2240, 2241, 2242, 2243, 2244]
    })

@pytest.fixture
def valid_telemetry_ranges():
    """Fixture que proporciona rangos válidos para datos de telemetría"""
    return {
        'engine_rpm': {'min': 0, 'max': 8000},
        'fuel_level': {'min': 0, 'max': 100},
        'engine_temperature': {'min': 0, 'max': 150},
        'battery_voltage': {'min': 10, 'max': 15},
        'tire_pressure': {'min': 20, 'max': 40},
        'speed': {'min': 0, 'max': 200},
        'latitude': {'min': -90, 'max': 90},
        'longitude': {'min': -180, 'max': 180},
        'altitude': {'min': -1000, 'max': 10000}
    }

# Tests para validate_telemetry_data
def test_validate_telemetry_data_success(valid_telemetry_data):
    """Test para validar datos de telemetría válidos"""
    success, messages = validate_telemetry_data(valid_telemetry_data)
    assert success
    assert "Datos de telemetría válidos" in messages[0]

def test_validate_telemetry_data_missing_columns():
    """Test para validar datos de telemetría con columnas faltantes"""
    df = valid_telemetry_data.copy()
    df = df.drop('engine_rpm', axis=1)
    
    success, messages = validate_telemetry_data(df)
    assert not success
    assert "Columnas requeridas faltantes" in messages[0]

def test_validate_telemetry_data_invalid_types():
    """Test para validar datos de telemetría con tipos inválidos"""
    df = valid_telemetry_data.copy()
    df['engine_rpm'] = df['engine_rpm'].astype(str)
    
    success, messages = validate_telemetry_data(df)
    assert not success
    assert "Tipos de datos inválidos" in messages[0]

# Tests para validate_telemetry_ranges
def test_validate_telemetry_ranges_success(valid_telemetry_data, valid_telemetry_ranges):
    """Test para validar rangos de telemetría válidos"""
    success, messages = validate_telemetry_ranges(valid_telemetry_data, valid_telemetry_ranges)
    assert success
    assert "Rangos de telemetría válidos" in messages[0]

def test_validate_telemetry_ranges_out_of_bounds():
    """Test para validar rangos de telemetría fuera de límites"""
    df = valid_telemetry_data.copy()
    df.loc[0, 'engine_rpm'] = 9000  # Fuera del rango máximo
    
    success, messages = validate_telemetry_ranges(df, valid_telemetry_ranges)
    assert not success
    assert "Valores fuera de rango" in messages[0]

def test_validate_telemetry_ranges_invalid_ranges():
    """Test para validar rangos de telemetría inválidos"""
    ranges = valid_telemetry_ranges.copy()
    ranges['engine_rpm']['min'] = 8000  # min > max
    
    success, messages = validate_telemetry_ranges(valid_telemetry_data, ranges)
    assert not success
    assert "Rangos inválidos" in messages[0]

# Tests para validate_telemetry_format
def test_validate_telemetry_format_success(valid_telemetry_data):
    """Test para validar formato de telemetría válido"""
    success, messages = validate_telemetry_format(valid_telemetry_data)
    assert success
    assert "Formato de telemetría válido" in messages[0]

def test_validate_telemetry_format_invalid_timestamp():
    """Test para validar formato de telemetría con timestamp inválido"""
    df = valid_telemetry_data.copy()
    df.loc[0, 'timestamp'] = 'invalid-timestamp'
    
    success, messages = validate_telemetry_format(df)
    assert not success
    assert "Formato de timestamp inválido" in messages[0]

def test_validate_telemetry_format_invalid_coordinates():
    """Test para validar formato de telemetría con coordenadas inválidas"""
    df = valid_telemetry_data.copy()
    df.loc[0, 'latitude'] = 'invalid-latitude'
    
    success, messages = validate_telemetry_format(df)
    assert not success
    assert "Formato de coordenadas inválido" in messages[0]

# Tests para validate_telemetry_integrity
def test_validate_telemetry_integrity_success(valid_telemetry_data):
    """Test para validar integridad de telemetría válida"""
    success, messages = validate_telemetry_integrity(valid_telemetry_data)
    assert success
    assert "Integridad de telemetría válida" in messages[0]

def test_validate_telemetry_integrity_duplicate_timestamps():
    """Test para validar integridad de telemetría con timestamps duplicados"""
    df = valid_telemetry_data.copy()
    df.loc[1, 'timestamp'] = df.loc[0, 'timestamp']
    
    success, messages = validate_telemetry_integrity(df)
    assert not success
    assert "Timestamps duplicados" in messages[0]

def test_validate_telemetry_integrity_missing_values():
    """Test para validar integridad de telemetría con valores faltantes"""
    df = valid_telemetry_data.copy()
    df.loc[0, 'engine_rpm'] = None
    
    success, messages = validate_telemetry_integrity(df)
    assert not success
    assert "Valores faltantes" in messages[0]

# Tests para validate_telemetry_consistency
def test_validate_telemetry_consistency_success(valid_telemetry_data):
    """Test para validar consistencia de telemetría válida"""
    success, messages = validate_telemetry_consistency(valid_telemetry_data)
    assert success
    assert "Consistencia de telemetría válida" in messages[0]

def test_validate_telemetry_consistency_inconsistent_speed():
    """Test para validar consistencia de telemetría con velocidad inconsistente"""
    df = valid_telemetry_data.copy()
    df.loc[0, 'speed'] = 100  # Cambio brusco de velocidad
    
    success, messages = validate_telemetry_consistency(df)
    assert not success
    assert "Inconsistencia en velocidad" in messages[0]

def test_validate_telemetry_consistency_inconsistent_location():
    """Test para validar consistencia de telemetría con ubicación inconsistente"""
    df = valid_telemetry_data.copy()
    df.loc[0, 'latitude'] = 90.1  # Latitud fuera de rango
    
    success, messages = validate_telemetry_consistency(df)
    assert not success
    assert "Inconsistencia en ubicación" in messages[0] 