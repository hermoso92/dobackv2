import pytest
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from src.automation.validations.data_validation import (
    validate_data_types,
    validate_data_ranges,
    validate_data_consistency,
    validate_data_completeness,
    validate_data_quality
)

# Fixtures para pruebas de datos
@pytest.fixture
def valid_data():
    """Fixture que proporciona datos válidos"""
    return {
        'numeric': {
            'integers': [1, 2, 3, 4, 5],
            'floats': [1.1, 2.2, 3.3, 4.4, 5.5],
            'percentages': [0.1, 0.2, 0.3, 0.4, 0.5]
        },
        'text': {
            'names': ['John', 'Jane', 'Bob'],
            'emails': ['john@example.com', 'jane@example.com', 'bob@example.com'],
            'phones': ['+1234567890', '+0987654321', '+5555555555']
        },
        'dates': {
            'timestamps': [
                '2024-01-01T00:00:00',
                '2024-01-02T00:00:00',
                '2024-01-03T00:00:00'
            ],
            'dates': ['2024-01-01', '2024-01-02', '2024-01-03'],
            'times': ['00:00:00', '12:00:00', '23:59:59']
        }
    }

@pytest.fixture
def valid_dataframe():
    """Fixture que proporciona un DataFrame válido"""
    return pd.DataFrame({
        'id': [1, 2, 3],
        'name': ['John', 'Jane', 'Bob'],
        'age': [25, 30, 35],
        'email': ['john@example.com', 'jane@example.com', 'bob@example.com'],
        'created_at': pd.date_range(start='2024-01-01', periods=3)
    })

# Tests para validate_data_types
def test_validate_data_types_success(valid_data):
    """Test para validar tipos de datos válidos"""
    success, messages = validate_data_types(valid_data)
    assert success
    assert "Tipos de datos válidos" in messages[0]

def test_validate_data_types_invalid_numeric():
    """Test para validar tipos de datos numéricos inválidos"""
    data = valid_data.copy()
    data['numeric']['integers'] = ['1', '2', '3']  # Strings en lugar de integers
    
    success, messages = validate_data_types(data)
    assert not success
    assert "Tipo numérico inválido" in messages[0]

def test_validate_data_types_invalid_date():
    """Test para validar tipos de datos de fecha inválidos"""
    data = valid_data.copy()
    data['dates']['timestamps'] = ['invalid-date', '2024-01-02', '2024-01-03']
    
    success, messages = validate_data_types(data)
    assert not success
    assert "Tipo de fecha inválido" in messages[0]

# Tests para validate_data_ranges
def test_validate_data_ranges_success(valid_data):
    """Test para validar rangos de datos válidos"""
    ranges = {
        'numeric': {
            'integers': {'min': 0, 'max': 10},
            'floats': {'min': 0.0, 'max': 10.0},
            'percentages': {'min': 0.0, 'max': 1.0}
        }
    }
    
    success, messages = validate_data_ranges(valid_data, ranges)
    assert success
    assert "Rangos de datos válidos" in messages[0]

def test_validate_data_ranges_out_of_bounds():
    """Test para validar rangos de datos fuera de límites"""
    data = valid_data.copy()
    data['numeric']['integers'] = [1, 2, 3, 4, 15]  # 15 está fuera del rango
    
    ranges = {
        'numeric': {
            'integers': {'min': 0, 'max': 10}
        }
    }
    
    success, messages = validate_data_ranges(data, ranges)
    assert not success
    assert "Valor fuera de rango" in messages[0]

def test_validate_data_ranges_invalid_range():
    """Test para validar rangos de datos inválidos"""
    data = valid_data.copy()
    ranges = {
        'numeric': {
            'integers': {'min': 10, 'max': 0}  # min > max
        }
    }
    
    success, messages = validate_data_ranges(data, ranges)
    assert not success
    assert "Rango inválido" in messages[0]

# Tests para validate_data_consistency
def test_validate_data_consistency_success(valid_dataframe):
    """Test para validar consistencia de datos válida"""
    rules = {
        'id': {'unique': True, 'not_null': True},
        'name': {'not_null': True, 'min_length': 2},
        'age': {'min': 0, 'max': 120},
        'email': {'pattern': r'^[^@]+@[^@]+\.[^@]+$'},
        'created_at': {'not_null': True}
    }
    
    success, messages = validate_data_consistency(valid_dataframe, rules)
    assert success
    assert "Consistencia de datos válida" in messages[0]

def test_validate_data_consistency_duplicate_id():
    """Test para validar consistencia con ID duplicado"""
    df = valid_dataframe.copy()
    df.loc[3] = [1, 'Alice', 40, 'alice@example.com', '2024-01-04']  # ID duplicado
    
    rules = {
        'id': {'unique': True, 'not_null': True}
    }
    
    success, messages = validate_data_consistency(df, rules)
    assert not success
    assert "ID duplicado" in messages[0]

def test_validate_data_consistency_invalid_email():
    """Test para validar consistencia con email inválido"""
    df = valid_dataframe.copy()
    df.loc[0, 'email'] = 'invalid-email'  # Email inválido
    
    rules = {
        'email': {'pattern': r'^[^@]+@[^@]+\.[^@]+$'}
    }
    
    success, messages = validate_data_consistency(df, rules)
    assert not success
    assert "Email inválido" in messages[0]

# Tests para validate_data_completeness
def test_validate_data_completeness_success(valid_dataframe):
    """Test para validar completitud de datos válida"""
    required_columns = ['id', 'name', 'age', 'email', 'created_at']
    
    success, messages = validate_data_completeness(valid_dataframe, required_columns)
    assert success
    assert "Completitud de datos válida" in messages[0]

def test_validate_data_completeness_missing_columns():
    """Test para validar completitud con columnas faltantes"""
    df = valid_dataframe.copy()
    df = df.drop('email', axis=1)
    
    required_columns = ['id', 'name', 'age', 'email', 'created_at']
    
    success, messages = validate_data_completeness(df, required_columns)
    assert not success
    assert "Columnas faltantes" in messages[0]

def test_validate_data_completeness_null_values():
    """Test para validar completitud con valores nulos"""
    df = valid_dataframe.copy()
    df.loc[0, 'name'] = None
    
    required_columns = ['id', 'name', 'age', 'email', 'created_at']
    
    success, messages = validate_data_completeness(df, required_columns)
    assert not success
    assert "Valores nulos detectados" in messages[0]

# Tests para validate_data_quality
def test_validate_data_quality_success(valid_dataframe):
    """Test para validar calidad de datos válida"""
    quality_rules = {
        'completeness': 0.95,
        'accuracy': 0.90,
        'consistency': 0.95,
        'timeliness': 0.90
    }
    
    success, messages = validate_data_quality(valid_dataframe, quality_rules)
    assert success
    assert "Calidad de datos válida" in messages[0]

def test_validate_data_quality_low_completeness():
    """Test para validar calidad con baja completitud"""
    df = valid_dataframe.copy()
    df.loc[0:1, 'name'] = None
    
    quality_rules = {
        'completeness': 0.95,
        'accuracy': 0.90,
        'consistency': 0.95,
        'timeliness': 0.90
    }
    
    success, messages = validate_data_quality(df, quality_rules)
    assert not success
    assert "Completitud insuficiente" in messages[0]

def test_validate_data_quality_low_accuracy():
    """Test para validar calidad con baja precisión"""
    df = valid_dataframe.copy()
    df.loc[0, 'age'] = -1  # Edad inválida
    
    quality_rules = {
        'completeness': 0.95,
        'accuracy': 0.90,
        'consistency': 0.95,
        'timeliness': 0.90
    }
    
    success, messages = validate_data_quality(df, quality_rules)
    assert not success
    assert "Precisión insuficiente" in messages[0] 