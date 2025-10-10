import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from src.automation.validations.report_validation import (
    validate_stability_report,
    validate_telemetry_report,
    validate_maintenance_report,
    validate_report_format,
    validate_report_content
)

# Fixtures para pruebas de reportes
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
        'event_type': ['normal', 'warning', 'normal', 'warning', 'critical']
    })

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
        'odometer': [1000, 1050, 1100, 1150, 1200]
    })

@pytest.fixture
def valid_maintenance_data():
    """Fixture que proporciona datos de mantenimiento válidos"""
    return pd.DataFrame({
        'timestamp': pd.date_range(start='2024-01-01', periods=5, freq='D'),
        'vehicle_id': ['V001', 'V001', 'V001', 'V001', 'V001'],
        'maintenance_type': ['oil_change', 'tire_rotation', 'brake_check', 'filter_change', 'inspection'],
        'status': ['completed', 'completed', 'completed', 'completed', 'completed'],
        'cost': [100, 50, 75, 30, 200],
        'technician': ['John', 'Jane', 'Bob', 'Alice', 'Charlie'],
        'notes': ['Regular maintenance', 'Regular maintenance', 'Regular maintenance', 'Regular maintenance', 'Regular maintenance']
    })

# Tests para validate_stability_report
def test_validate_stability_report_success(valid_stability_data):
    """Test para validar reporte de estabilidad válido"""
    success, messages = validate_stability_report(valid_stability_data)
    assert success
    assert "Reporte de estabilidad válido" in messages[0]

def test_validate_stability_report_missing_columns():
    """Test para validar reporte de estabilidad con columnas faltantes"""
    df = valid_stability_data.copy()
    df = df.drop('lateral_acceleration', axis=1)
    
    success, messages = validate_stability_report(df)
    assert not success
    assert "Columnas requeridas faltantes" in messages[0]

def test_validate_stability_report_invalid_data():
    """Test para validar reporte de estabilidad con datos inválidos"""
    df = valid_stability_data.copy()
    df.loc[0, 'lateral_acceleration'] = 'invalid'  # Tipo de dato inválido
    
    success, messages = validate_stability_report(df)
    assert not success
    assert "Datos inválidos" in messages[0]

# Tests para validate_telemetry_report
def test_validate_telemetry_report_success(valid_telemetry_data):
    """Test para validar reporte de telemetría válido"""
    success, messages = validate_telemetry_report(valid_telemetry_data)
    assert success
    assert "Reporte de telemetría válido" in messages[0]

def test_validate_telemetry_report_missing_columns():
    """Test para validar reporte de telemetría con columnas faltantes"""
    df = valid_telemetry_data.copy()
    df = df.drop('engine_rpm', axis=1)
    
    success, messages = validate_telemetry_report(df)
    assert not success
    assert "Columnas requeridas faltantes" in messages[0]

def test_validate_telemetry_report_invalid_data():
    """Test para validar reporte de telemetría con datos inválidos"""
    df = valid_telemetry_data.copy()
    df.loc[0, 'engine_rpm'] = -1  # Valor inválido
    
    success, messages = validate_telemetry_report(df)
    assert not success
    assert "Datos inválidos" in messages[0]

# Tests para validate_maintenance_report
def test_validate_maintenance_report_success(valid_maintenance_data):
    """Test para validar reporte de mantenimiento válido"""
    success, messages = validate_maintenance_report(valid_maintenance_data)
    assert success
    assert "Reporte de mantenimiento válido" in messages[0]

def test_validate_maintenance_report_missing_columns():
    """Test para validar reporte de mantenimiento con columnas faltantes"""
    df = valid_maintenance_data.copy()
    df = df.drop('maintenance_type', axis=1)
    
    success, messages = validate_maintenance_report(df)
    assert not success
    assert "Columnas requeridas faltantes" in messages[0]

def test_validate_maintenance_report_invalid_data():
    """Test para validar reporte de mantenimiento con datos inválidos"""
    df = valid_maintenance_data.copy()
    df.loc[0, 'cost'] = -100  # Costo negativo inválido
    
    success, messages = validate_maintenance_report(df)
    assert not success
    assert "Datos inválidos" in messages[0]

# Tests para validate_report_format
def test_validate_report_format_success():
    """Test para validar formato de reporte válido"""
    report_format = {
        'type': 'pdf',
        'template': 'standard',
        'sections': ['header', 'data', 'summary', 'footer'],
        'style': {
            'font': 'Arial',
            'size': 12,
            'color': '#000000'
        }
    }
    
    success, messages = validate_report_format(report_format)
    assert success
    assert "Formato de reporte válido" in messages[0]

def test_validate_report_format_invalid_type():
    """Test para validar formato de reporte con tipo inválido"""
    report_format = {
        'type': 'invalid',
        'template': 'standard',
        'sections': ['header', 'data', 'summary', 'footer']
    }
    
    success, messages = validate_report_format(report_format)
    assert not success
    assert "Tipo de formato inválido" in messages[0]

def test_validate_report_format_missing_sections():
    """Test para validar formato de reporte con secciones faltantes"""
    report_format = {
        'type': 'pdf',
        'template': 'standard',
        'sections': ['header', 'footer']  # Falta 'data' y 'summary'
    }
    
    success, messages = validate_report_format(report_format)
    assert not success
    assert "Secciones requeridas faltantes" in messages[0]

# Tests para validate_report_content
def test_validate_report_content_success(valid_stability_data):
    """Test para validar contenido de reporte válido"""
    content = {
        'title': 'Stability Report',
        'data': valid_stability_data,
        'summary': {
            'total_events': 5,
            'critical_events': 1,
            'warning_events': 2,
            'normal_events': 2
        },
        'metadata': {
            'generated_at': datetime.now(),
            'version': '1.0',
            'author': 'System'
        }
    }
    
    success, messages = validate_report_content(content)
    assert success
    assert "Contenido de reporte válido" in messages[0]

def test_validate_report_content_missing_required():
    """Test para validar contenido de reporte con campos requeridos faltantes"""
    content = {
        'title': 'Stability Report',
        'data': valid_stability_data
        # Falta 'summary' y 'metadata'
    }
    
    success, messages = validate_report_content(content)
    assert not success
    assert "Campos requeridos faltantes" in messages[0]

def test_validate_report_content_invalid_summary():
    """Test para validar contenido de reporte con resumen inválido"""
    content = {
        'title': 'Stability Report',
        'data': valid_stability_data,
        'summary': {
            'total_events': 'invalid',  # Debería ser número
            'critical_events': 1,
            'warning_events': 2,
            'normal_events': 2
        },
        'metadata': {
            'generated_at': datetime.now(),
            'version': '1.0',
            'author': 'System'
        }
    }
    
    success, messages = validate_report_content(content)
    assert not success
    assert "Resumen inválido" in messages[0] 