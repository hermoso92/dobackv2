import pytest
import json
from pathlib import Path
from datetime import datetime, timedelta
from src.automation.validations.api_validation import (
    validate_api_endpoints,
    validate_api_parameters,
    validate_api_responses,
    validate_api_rate_limits
)

# Fixtures para pruebas de API
@pytest.fixture
def valid_api_endpoints():
    """Fixture que proporciona endpoints de API válidos"""
    return {
        'vehicles': {
            'base_url': '/api/v1/vehicles',
            'methods': ['GET', 'POST', 'PUT', 'DELETE'],
            'parameters': {
                'GET': ['id', 'company_id', 'status'],
                'POST': ['plate_number', 'make', 'model', 'year', 'type'],
                'PUT': ['id', 'status', 'driver_id'],
                'DELETE': ['id']
            },
            'responses': {
                '200': 'Success',
                '201': 'Created',
                '400': 'Bad Request',
                '401': 'Unauthorized',
                '404': 'Not Found',
                '500': 'Internal Server Error'
            }
        },
        'maintenance': {
            'base_url': '/api/v1/maintenance',
            'methods': ['GET', 'POST', 'PUT'],
            'parameters': {
                'GET': ['vehicle_id', 'start_date', 'end_date'],
                'POST': ['vehicle_id', 'type', 'description', 'cost'],
                'PUT': ['id', 'status', 'completion_date']
            },
            'responses': {
                '200': 'Success',
                '201': 'Created',
                '400': 'Bad Request',
                '401': 'Unauthorized',
                '404': 'Not Found',
                '500': 'Internal Server Error'
            }
        }
    }

@pytest.fixture
def valid_api_parameters():
    """Fixture que proporciona parámetros de API válidos"""
    return {
        'vehicle_id': {
            'type': 'string',
            'format': 'uuid',
            'required': True,
            'description': 'ID único del vehículo'
        },
        'company_id': {
            'type': 'string',
            'format': 'uuid',
            'required': True,
            'description': 'ID único de la compañía'
        },
        'status': {
            'type': 'string',
            'enum': ['active', 'inactive', 'maintenance'],
            'required': True,
            'description': 'Estado del vehículo'
        },
        'plate_number': {
            'type': 'string',
            'pattern': '^[A-Z0-9]{6}$',
            'required': True,
            'description': 'Número de placa del vehículo'
        }
    }

@pytest.fixture
def valid_api_responses():
    """Fixture que proporciona respuestas de API válidas"""
    return {
        '200': {
            'type': 'object',
            'properties': {
                'status': {'type': 'string', 'enum': ['success']},
                'data': {'type': 'object'},
                'message': {'type': 'string'}
            },
            'required': ['status', 'data']
        },
        '400': {
            'type': 'object',
            'properties': {
                'status': {'type': 'string', 'enum': ['error']},
                'error': {'type': 'string'},
                'details': {'type': 'object'}
            },
            'required': ['status', 'error']
        }
    }

# Tests para validate_api_endpoints
def test_validate_api_endpoints_success(valid_api_endpoints):
    """Test para validar endpoints de API válidos"""
    success, messages = validate_api_endpoints(valid_api_endpoints)
    assert success
    assert "Endpoints de API válidos" in messages[0]

def test_validate_api_endpoints_invalid_methods():
    """Test para validar endpoints de API con métodos inválidos"""
    endpoints = valid_api_endpoints.copy()
    endpoints['vehicles']['methods'] = ['INVALID']
    
    success, messages = validate_api_endpoints(endpoints)
    assert not success
    assert "Métodos inválidos" in messages[0]

def test_validate_api_endpoints_missing_required():
    """Test para validar endpoints de API con campos requeridos faltantes"""
    endpoints = valid_api_endpoints.copy()
    del endpoints['vehicles']['base_url']
    
    success, messages = validate_api_endpoints(endpoints)
    assert not success
    assert "Campos requeridos faltantes" in messages[0]

# Tests para validate_api_parameters
def test_validate_api_parameters_success(valid_api_parameters):
    """Test para validar parámetros de API válidos"""
    success, messages = validate_api_parameters(valid_api_parameters)
    assert success
    assert "Parámetros de API válidos" in messages[0]

def test_validate_api_parameters_invalid_types():
    """Test para validar parámetros de API con tipos inválidos"""
    parameters = valid_api_parameters.copy()
    parameters['vehicle_id']['type'] = 'invalid'
    
    success, messages = validate_api_parameters(parameters)
    assert not success
    assert "Tipos inválidos" in messages[0]

def test_validate_api_parameters_invalid_patterns():
    """Test para validar parámetros de API con patrones inválidos"""
    parameters = valid_api_parameters.copy()
    parameters['plate_number']['pattern'] = 'invalid'
    
    success, messages = validate_api_parameters(parameters)
    assert not success
    assert "Patrones inválidos" in messages[0]

# Tests para validate_api_responses
def test_validate_api_responses_success(valid_api_responses):
    """Test para validar respuestas de API válidas"""
    success, messages = validate_api_responses(valid_api_responses)
    assert success
    assert "Respuestas de API válidas" in messages[0]

def test_validate_api_responses_invalid_schema():
    """Test para validar respuestas de API con esquema inválido"""
    responses = valid_api_responses.copy()
    responses['200']['type'] = 'invalid'
    
    success, messages = validate_api_responses(responses)
    assert not success
    assert "Esquema inválido" in messages[0]

def test_validate_api_responses_missing_required():
    """Test para validar respuestas de API con campos requeridos faltantes"""
    responses = valid_api_responses.copy()
    del responses['200']['required']
    
    success, messages = validate_api_responses(responses)
    assert not success
    assert "Campos requeridos faltantes" in messages[0]

# Tests para validate_api_rate_limits
def test_validate_api_rate_limits_success():
    """Test para validar límites de tasa de API válidos"""
    rate_limits = {
        'global': {
            'requests_per_minute': 100,
            'burst': 20
        },
        'per_user': {
            'requests_per_minute': 10,
            'burst': 5
        },
        'per_endpoint': {
            '/api/v1/vehicles': {
                'requests_per_minute': 50,
                'burst': 10
            }
        }
    }
    
    success, messages = validate_api_rate_limits(rate_limits)
    assert success
    assert "Límites de tasa de API válidos" in messages[0]

def test_validate_api_rate_limits_invalid_values():
    """Test para validar límites de tasa de API con valores inválidos"""
    rate_limits = {
        'global': {
            'requests_per_minute': -1,
            'burst': 20
        }
    }
    
    success, messages = validate_api_rate_limits(rate_limits)
    assert not success
    assert "Valores inválidos" in messages[0]

def test_validate_api_rate_limits_missing_required():
    """Test para validar límites de tasa de API con campos requeridos faltantes"""
    rate_limits = {
        'global': {
            'requests_per_minute': 100
            # Falta burst
        }
    }
    
    success, messages = validate_api_rate_limits(rate_limits)
    assert not success
    assert "Campos requeridos faltantes" in messages[0] 