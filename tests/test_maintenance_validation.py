import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from src.automation.validations.maintenance_validation import (
    validate_maintenance_data,
    validate_maintenance_schedule,
    validate_maintenance_costs,
    validate_maintenance_technicians,
    validate_maintenance_history
)

# Fixtures para pruebas de mantenimiento
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
        'parts_used': [
            ['oil_filter', 'engine_oil'],
            ['tire_balancing_weights'],
            ['brake_pads'],
            ['air_filter', 'fuel_filter'],
            ['inspection_kit']
        ],
        'labor_hours': [2, 1, 1.5, 1, 3],
        'mileage': [1000, 1050, 1100, 1150, 1200],
        'next_maintenance': [
            datetime(2024, 2, 1),
            datetime(2024, 2, 15),
            datetime(2024, 3, 1),
            datetime(2024, 3, 15),
            datetime(2024, 4, 1)
        ],
        'notes': [
            'Regular maintenance',
            'Regular maintenance',
            'Regular maintenance',
            'Regular maintenance',
            'Regular maintenance'
        ]
    })

@pytest.fixture
def valid_maintenance_schedule():
    """Fixture que proporciona un programa de mantenimiento válido"""
    return {
        'oil_change': {
            'interval_days': 30,
            'interval_mileage': 5000,
            'priority': 'high',
            'required_parts': ['oil_filter', 'engine_oil'],
            'estimated_hours': 2
        },
        'tire_rotation': {
            'interval_days': 90,
            'interval_mileage': 10000,
            'priority': 'medium',
            'required_parts': ['tire_balancing_weights'],
            'estimated_hours': 1
        },
        'brake_check': {
            'interval_days': 60,
            'interval_mileage': 8000,
            'priority': 'high',
            'required_parts': ['brake_pads'],
            'estimated_hours': 1.5
        },
        'filter_change': {
            'interval_days': 45,
            'interval_mileage': 6000,
            'priority': 'medium',
            'required_parts': ['air_filter', 'fuel_filter'],
            'estimated_hours': 1
        },
        'inspection': {
            'interval_days': 180,
            'interval_mileage': 20000,
            'priority': 'high',
            'required_parts': ['inspection_kit'],
            'estimated_hours': 3
        }
    }

@pytest.fixture
def valid_maintenance_costs():
    """Fixture que proporciona costos de mantenimiento válidos"""
    return {
        'parts': {
            'oil_filter': 20,
            'engine_oil': 40,
            'tire_balancing_weights': 10,
            'brake_pads': 50,
            'air_filter': 15,
            'fuel_filter': 25,
            'inspection_kit': 30
        },
        'labor_rate': 50,
        'overhead_rate': 0.2,
        'tax_rate': 0.16
    }

# Tests para validate_maintenance_data
def test_validate_maintenance_data_success(valid_maintenance_data):
    """Test para validar datos de mantenimiento válidos"""
    success, messages = validate_maintenance_data(valid_maintenance_data)
    assert success
    assert "Datos de mantenimiento válidos" in messages[0]

def test_validate_maintenance_data_missing_columns():
    """Test para validar datos de mantenimiento con columnas faltantes"""
    df = valid_maintenance_data.copy()
    df = df.drop('maintenance_type', axis=1)
    
    success, messages = validate_maintenance_data(df)
    assert not success
    assert "Columnas requeridas faltantes" in messages[0]

def test_validate_maintenance_data_invalid_types():
    """Test para validar datos de mantenimiento con tipos inválidos"""
    df = valid_maintenance_data.copy()
    df['cost'] = df['cost'].astype(str)
    
    success, messages = validate_maintenance_data(df)
    assert not success
    assert "Tipos de datos inválidos" in messages[0]

# Tests para validate_maintenance_schedule
def test_validate_maintenance_schedule_success(valid_maintenance_schedule):
    """Test para validar programa de mantenimiento válido"""
    success, messages = validate_maintenance_schedule(valid_maintenance_schedule)
    assert success
    assert "Programa de mantenimiento válido" in messages[0]

def test_validate_maintenance_schedule_invalid_intervals():
    """Test para validar programa de mantenimiento con intervalos inválidos"""
    schedule = valid_maintenance_schedule.copy()
    schedule['oil_change']['interval_days'] = -1
    
    success, messages = validate_maintenance_schedule(schedule)
    assert not success
    assert "Intervalos inválidos" in messages[0]

def test_validate_maintenance_schedule_missing_required():
    """Test para validar programa de mantenimiento con campos requeridos faltantes"""
    schedule = valid_maintenance_schedule.copy()
    del schedule['oil_change']['required_parts']
    
    success, messages = validate_maintenance_schedule(schedule)
    assert not success
    assert "Campos requeridos faltantes" in messages[0]

# Tests para validate_maintenance_costs
def test_validate_maintenance_costs_success(valid_maintenance_costs):
    """Test para validar costos de mantenimiento válidos"""
    success, messages = validate_maintenance_costs(valid_maintenance_costs)
    assert success
    assert "Costos de mantenimiento válidos" in messages[0]

def test_validate_maintenance_costs_invalid_prices():
    """Test para validar costos de mantenimiento con precios inválidos"""
    costs = valid_maintenance_costs.copy()
    costs['parts']['oil_filter'] = -20
    
    success, messages = validate_maintenance_costs(costs)
    assert not success
    assert "Precios inválidos" in messages[0]

def test_validate_maintenance_costs_invalid_rates():
    """Test para validar costos de mantenimiento con tasas inválidas"""
    costs = valid_maintenance_costs.copy()
    costs['overhead_rate'] = 1.5  # Tasa mayor a 1
    
    success, messages = validate_maintenance_costs(costs)
    assert not success
    assert "Tasas inválidas" in messages[0]

# Tests para validate_maintenance_technicians
def test_validate_maintenance_technicians_success(valid_maintenance_data):
    """Test para validar técnicos de mantenimiento válidos"""
    success, messages = validate_maintenance_technicians(valid_maintenance_data)
    assert success
    assert "Técnicos de mantenimiento válidos" in messages[0]

def test_validate_maintenance_technicians_invalid_assignments():
    """Test para validar técnicos de mantenimiento con asignaciones inválidas"""
    df = valid_maintenance_data.copy()
    df.loc[0, 'technician'] = None
    
    success, messages = validate_maintenance_technicians(df)
    assert not success
    assert "Asignaciones inválidas" in messages[0]

def test_validate_maintenance_technicians_overlapping_schedule():
    """Test para validar técnicos de mantenimiento con horarios superpuestos"""
    df = valid_maintenance_data.copy()
    df.loc[1, 'timestamp'] = df.loc[0, 'timestamp']  # Mismo horario
    df.loc[1, 'technician'] = df.loc[0, 'technician']  # Mismo técnico
    
    success, messages = validate_maintenance_technicians(df)
    assert not success
    assert "Horarios superpuestos" in messages[0]

# Tests para validate_maintenance_history
def test_validate_maintenance_history_success(valid_maintenance_data):
    """Test para validar historial de mantenimiento válido"""
    success, messages = validate_maintenance_history(valid_maintenance_data)
    assert success
    assert "Historial de mantenimiento válido" in messages[0]

def test_validate_maintenance_history_invalid_sequence():
    """Test para validar historial de mantenimiento con secuencia inválida"""
    df = valid_maintenance_data.copy()
    df.loc[0, 'timestamp'] = df.loc[1, 'timestamp'] + timedelta(days=1)  # Secuencia incorrecta
    
    success, messages = validate_maintenance_history(df)
    assert not success
    assert "Secuencia inválida" in messages[0]

def test_validate_maintenance_history_missing_records():
    """Test para validar historial de mantenimiento con registros faltantes"""
    df = valid_maintenance_data.copy()
    df = df.drop(0)  # Elimina un registro
    
    success, messages = validate_maintenance_history(df)
    assert not success
    assert "Registros faltantes" in messages[0] 