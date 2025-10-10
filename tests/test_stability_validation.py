import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from src.automation.validations.stability_validation import (
    validate_stability_data,
    validate_stability_events,
    validate_stability_thresholds,
    validate_stability_alerts,
    validate_stability_consistency
)

# Fixtures para pruebas de estabilidad
@pytest.fixture
def valid_stability_data():
    """Fixture que proporciona datos de estabilidad válidos"""
    return pd.DataFrame({
        'timestamp': pd.date_range(start='2024-01-01', periods=5, freq='H'),
        'vehicle_id': ['V001', 'V001', 'V001', 'V001', 'V001'],
        'lateral_acceleration': [0.1, 0.2, 0.15, 0.25, 0.3],
        'longitudinal_acceleration': [0.05, 0.1, 0.08, 0.12, 0.15],
        'roll_angle': [1.0, 1.5, 2.0, 1.8, 2.2],
        'pitch_angle': [0.5, 0.8, 1.0, 0.9, 1.1],
        'speed': [30, 35, 40, 45, 50],
        'load_weight': [5000, 5100, 5200, 5300, 5400],
        'center_of_gravity': [1.2, 1.3, 1.4, 1.5, 1.6],
        'tire_pressure': [32, 31.5, 31, 30.5, 30],
        'suspension_status': ['normal', 'normal', 'normal', 'normal', 'normal']
    })

@pytest.fixture
def valid_stability_events():
    """Fixture que proporciona eventos de estabilidad válidos"""
    return pd.DataFrame({
        'timestamp': pd.date_range(start='2024-01-01', periods=3, freq='H'),
        'vehicle_id': ['V001', 'V001', 'V001'],
        'event_type': ['warning', 'critical', 'normal'],
        'severity': ['medium', 'high', 'low'],
        'description': [
            'Lateral acceleration threshold exceeded',
            'Critical roll angle detected',
            'Normal operation resumed'
        ],
        'triggered_by': ['lateral_acceleration', 'roll_angle', 'system'],
        'threshold_value': [0.25, 2.5, 0.0],
        'actual_value': [0.3, 2.8, 0.1]
    })

@pytest.fixture
def valid_stability_thresholds():
    """Fixture que proporciona umbrales de estabilidad válidos"""
    return {
        'lateral_acceleration': {'warning': 0.2, 'critical': 0.3},
        'longitudinal_acceleration': {'warning': 0.15, 'critical': 0.25},
        'roll_angle': {'warning': 2.0, 'critical': 2.5},
        'pitch_angle': {'warning': 1.0, 'critical': 1.5},
        'speed': {'warning': 80, 'critical': 100},
        'load_weight': {'warning': 5500, 'critical': 6000},
        'center_of_gravity': {'warning': 1.8, 'critical': 2.0},
        'tire_pressure': {'warning': 25, 'critical': 20}
    }

# Tests para validate_stability_data
def test_validate_stability_data_success(valid_stability_data):
    """Test para validar datos de estabilidad válidos"""
    success, messages = validate_stability_data(valid_stability_data)
    assert success
    assert "Datos de estabilidad válidos" in messages[0]

def test_validate_stability_data_missing_columns():
    """Test para validar datos de estabilidad con columnas faltantes"""
    df = valid_stability_data.copy()
    df = df.drop('lateral_acceleration', axis=1)
    
    success, messages = validate_stability_data(df)
    assert not success
    assert "Columnas requeridas faltantes" in messages[0]

def test_validate_stability_data_invalid_types():
    """Test para validar datos de estabilidad con tipos inválidos"""
    df = valid_stability_data.copy()
    df['lateral_acceleration'] = df['lateral_acceleration'].astype(str)
    
    success, messages = validate_stability_data(df)
    assert not success
    assert "Tipos de datos inválidos" in messages[0]

# Tests para validate_stability_events
def test_validate_stability_events_success(valid_stability_events):
    """Test para validar eventos de estabilidad válidos"""
    success, messages = validate_stability_events(valid_stability_events)
    assert success
    assert "Eventos de estabilidad válidos" in messages[0]

def test_validate_stability_events_invalid_severity():
    """Test para validar eventos de estabilidad con severidad inválida"""
    df = valid_stability_events.copy()
    df.loc[0, 'severity'] = 'invalid'
    
    success, messages = validate_stability_events(df)
    assert not success
    assert "Severidad inválida" in messages[0]

def test_validate_stability_events_missing_trigger():
    """Test para validar eventos de estabilidad con disparador faltante"""
    df = valid_stability_events.copy()
    df.loc[0, 'triggered_by'] = None
    
    success, messages = validate_stability_events(df)
    assert not success
    assert "Disparador faltante" in messages[0]

# Tests para validate_stability_thresholds
def test_validate_stability_thresholds_success(valid_stability_thresholds):
    """Test para validar umbrales de estabilidad válidos"""
    success, messages = validate_stability_thresholds(valid_stability_thresholds)
    assert success
    assert "Umbrales de estabilidad válidos" in messages[0]

def test_validate_stability_thresholds_invalid_values():
    """Test para validar umbrales de estabilidad con valores inválidos"""
    thresholds = valid_stability_thresholds.copy()
    thresholds['lateral_acceleration']['warning'] = -0.1
    
    success, messages = validate_stability_thresholds(thresholds)
    assert not success
    assert "Valores de umbral inválidos" in messages[0]

def test_validate_stability_thresholds_missing_levels():
    """Test para validar umbrales de estabilidad con niveles faltantes"""
    thresholds = valid_stability_thresholds.copy()
    del thresholds['lateral_acceleration']['critical']
    
    success, messages = validate_stability_thresholds(thresholds)
    assert not success
    assert "Niveles de umbral faltantes" in messages[0]

# Tests para validate_stability_alerts
def test_validate_stability_alerts_success(valid_stability_data, valid_stability_thresholds):
    """Test para validar alertas de estabilidad válidas"""
    success, messages = validate_stability_alerts(valid_stability_data, valid_stability_thresholds)
    assert success
    assert "Alertas de estabilidad válidas" in messages[0]

def test_validate_stability_alerts_threshold_exceeded():
    """Test para validar alertas de estabilidad con umbral excedido"""
    data = valid_stability_data.copy()
    data.loc[0, 'lateral_acceleration'] = 0.4  # Excede umbral crítico
    
    success, messages = validate_stability_alerts(data, valid_stability_thresholds)
    assert not success
    assert "Umbral crítico excedido" in messages[0]

def test_validate_stability_alerts_invalid_combination():
    """Test para validar alertas de estabilidad con combinación inválida"""
    data = valid_stability_data.copy()
    data.loc[0, 'speed'] = 120  # Velocidad alta
    data.loc[0, 'roll_angle'] = 3.0  # Ángulo de inclinación crítico
    
    success, messages = validate_stability_alerts(data, valid_stability_thresholds)
    assert not success
    assert "Combinación de alertas inválida" in messages[0]

# Tests para validate_stability_consistency
def test_validate_stability_consistency_success(valid_stability_data):
    """Test para validar consistencia de estabilidad válida"""
    success, messages = validate_stability_consistency(valid_stability_data)
    assert success
    assert "Consistencia de estabilidad válida" in messages[0]

def test_validate_stability_consistency_inconsistent_acceleration():
    """Test para validar consistencia de estabilidad con aceleración inconsistente"""
    df = valid_stability_data.copy()
    df.loc[0, 'lateral_acceleration'] = 1.0  # Aceleración lateral muy alta
    
    success, messages = validate_stability_consistency(df)
    assert not success
    assert "Inconsistencia en aceleración" in messages[0]

def test_validate_stability_consistency_inconsistent_angles():
    """Test para validar consistencia de estabilidad con ángulos inconsistentes"""
    df = valid_stability_data.copy()
    df.loc[0, 'roll_angle'] = 45.0  # Ángulo de inclinación muy alto
    
    success, messages = validate_stability_consistency(df)
    assert not success
    assert "Inconsistencia en ángulos" in messages[0] 