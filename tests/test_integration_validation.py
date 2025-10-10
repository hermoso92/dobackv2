import pytest
import json
import requests
from pathlib import Path
from datetime import datetime, timedelta
from src.automation.validations.integration_validation import (
    validate_api_integration,
    validate_database_integration,
    validate_file_integration,
    validate_service_integration,
    validate_webhook_integration,
    validate_module_integration,
    validate_service_communication,
    validate_data_flow,
    validate_dependency_chain,
    validate_error_propagation,
    validate_state_management,
    validate_event_handling,
    validate_transaction_flow
)

# Fixtures para pruebas de integración
@pytest.fixture
def valid_api():
    """Fixture que proporciona una integración de API válida"""
    return {
        'name': 'Test API',
        'base_url': 'https://api.example.com',
        'endpoints': [
            {
                'path': '/v1/users',
                'method': 'GET',
                'headers': {
                    'Authorization': 'Bearer token',
                    'Content-Type': 'application/json'
                }
            }
        ],
        'timeout': 30,
        'retry_attempts': 3
    }

@pytest.fixture
def valid_database():
    """Fixture que proporciona una integración de base de datos válida"""
    return {
        'name': 'Test Database',
        'type': 'postgresql',
        'host': 'localhost',
        'port': 5432,
        'database': 'test_db',
        'user': 'test_user',
        'password': 'test_password',
        'max_connections': 10,
        'timeout': 30
    }

@pytest.fixture
def valid_file():
    """Fixture que proporciona una integración de archivo válida"""
    return {
        'name': 'Test File',
        'type': 'csv',
        'path': '/data/files',
        'format': {
            'delimiter': ',',
            'encoding': 'utf-8',
            'has_header': True
        },
        'permissions': {
            'read': True,
            'write': True
        }
    }

@pytest.fixture
def valid_module_integration():
    """Fixture que proporciona integración de módulos válida"""
    return {
        'source_module': 'auth',
        'target_module': 'vehicles',
        'integration_type': 'api',
        'endpoints': [
            {
                'path': '/api/vehicles',
                'method': 'GET',
                'required_permissions': ['read:vehicles']
            },
            {
                'path': '/api/vehicles/{id}',
                'method': 'PUT',
                'required_permissions': ['write:vehicles']
            }
        ],
        'data_mapping': {
            'user_id': 'driver_id',
            'company_id': 'company_id'
        }
    }

@pytest.fixture
def valid_service_communication():
    """Fixture que proporciona comunicación entre servicios válida"""
    return {
        'source_service': 'notification',
        'target_service': 'email',
        'protocol': 'http',
        'endpoint': 'http://email-service/api/send',
        'timeout_ms': 5000,
        'retry_attempts': 3,
        'retry_delay_ms': 1000,
        'expected_response': {
            'status': 'success',
            'message_id': 'string'
        }
    }

@pytest.fixture
def valid_data_flow():
    """Fixture que proporciona flujo de datos válido"""
    return {
        'source': 'telemetry',
        'destination': 'analysis',
        'data_type': 'vehicle_data',
        'transformation_rules': [
            {
                'field': 'speed',
                'operation': 'convert',
                'from_unit': 'km/h',
                'to_unit': 'm/s'
            },
            {
                'field': 'timestamp',
                'operation': 'format',
                'format': 'ISO8601'
            }
        ],
        'validation_rules': [
            {
                'field': 'speed',
                'type': 'numeric',
                'min': 0,
                'max': 200
            },
            {
                'field': 'location',
                'type': 'coordinates',
                'required': True
            }
        ]
    }

# Tests para validate_api_integration
def test_validate_api_integration_success(valid_api):
    """Test para validar una integración de API válida"""
    success, messages = validate_api_integration(valid_api)
    assert success
    assert "Integración de API válida" in messages[0]

def test_validate_api_integration_invalid_url():
    """Test para validar una integración de API con URL inválida"""
    api = valid_api.copy()
    api['base_url'] = 'invalid-url'
    
    success, messages = validate_api_integration(api)
    assert not success
    assert "URL inválida" in messages[0]

def test_validate_api_integration_missing_endpoints():
    """Test para validar una integración de API sin endpoints"""
    api = valid_api.copy()
    api['endpoints'] = []
    
    success, messages = validate_api_integration(api)
    assert not success
    assert "Endpoints faltantes" in messages[0]

# Tests para validate_database_integration
def test_validate_database_integration_success(valid_database):
    """Test para validar una integración de base de datos válida"""
    success, messages = validate_database_integration(valid_database)
    assert success
    assert "Integración de base de datos válida" in messages[0]

def test_validate_database_integration_invalid_type():
    """Test para validar una integración de base de datos con tipo inválido"""
    db = valid_database.copy()
    db['type'] = 'invalid_type'
    
    success, messages = validate_database_integration(db)
    assert not success
    assert "Tipo de base de datos inválido" in messages[0]

def test_validate_database_integration_invalid_credentials():
    """Test para validar una integración de base de datos con credenciales inválidas"""
    db = valid_database.copy()
    db['user'] = ''
    db['password'] = ''
    
    success, messages = validate_database_integration(db)
    assert not success
    assert "Credenciales inválidas" in messages[0]

# Tests para validate_file_integration
def test_validate_file_integration_success(valid_file):
    """Test para validar una integración de archivo válida"""
    success, messages = validate_file_integration(valid_file)
    assert success
    assert "Integración de archivo válida" in messages[0]

def test_validate_file_integration_invalid_type():
    """Test para validar una integración de archivo con tipo inválido"""
    file = valid_file.copy()
    file['type'] = 'invalid_type'
    
    success, messages = validate_file_integration(file)
    assert not success
    assert "Tipo de archivo inválido" in messages[0]

def test_validate_file_integration_invalid_path():
    """Test para validar una integración de archivo con ruta inválida"""
    file = valid_file.copy()
    file['path'] = '/nonexistent/path'
    
    success, messages = validate_file_integration(file)
    assert not success
    assert "Ruta inválida" in messages[0]

# Tests para validate_service_integration
def test_validate_service_integration_success():
    """Test para validar una integración de servicio válida"""
    service = {
        'name': 'Test Service',
        'type': 'rest',
        'endpoint': 'http://localhost:8000',
        'methods': ['GET', 'POST'],
        'timeout': 30,
        'retry_attempts': 3
    }
    
    success, messages = validate_service_integration(service)
    assert success
    assert "Integración de servicio válida" in messages[0]

def test_validate_service_integration_invalid_type():
    """Test para validar una integración de servicio con tipo inválido"""
    service = {
        'name': 'Test Service',
        'type': 'invalid_type',
        'endpoint': 'http://localhost:8000',
        'methods': ['GET', 'POST'],
        'timeout': 30,
        'retry_attempts': 3
    }
    
    success, messages = validate_service_integration(service)
    assert not success
    assert "Tipo de servicio inválido" in messages[0]

def test_validate_service_integration_invalid_methods():
    """Test para validar una integración de servicio con métodos inválidos"""
    service = {
        'name': 'Test Service',
        'type': 'rest',
        'endpoint': 'http://localhost:8000',
        'methods': ['INVALID'],
        'timeout': 30,
        'retry_attempts': 3
    }
    
    success, messages = validate_service_integration(service)
    assert not success
    assert "Métodos inválidos" in messages[0]

# Tests para validate_webhook_integration
def test_validate_webhook_integration_success():
    """Test para validar una integración de webhook válida"""
    webhook = {
        'name': 'Test Webhook',
        'url': 'https://webhook.example.com',
        'events': ['create', 'update', 'delete'],
        'secret': 'webhook-secret',
        'timeout': 30,
        'retry_attempts': 3
    }
    
    success, messages = validate_webhook_integration(webhook)
    assert success
    assert "Integración de webhook válida" in messages[0]

def test_validate_webhook_integration_invalid_url():
    """Test para validar una integración de webhook con URL inválida"""
    webhook = {
        'name': 'Test Webhook',
        'url': 'invalid-url',
        'events': ['create', 'update', 'delete'],
        'secret': 'webhook-secret',
        'timeout': 30,
        'retry_attempts': 3
    }
    
    success, messages = validate_webhook_integration(webhook)
    assert not success
    assert "URL inválida" in messages[0]

def test_validate_webhook_integration_invalid_events():
    """Test para validar una integración de webhook con eventos inválidos"""
    webhook = {
        'name': 'Test Webhook',
        'url': 'https://webhook.example.com',
        'events': ['invalid_event'],
        'secret': 'webhook-secret',
        'timeout': 30,
        'retry_attempts': 3
    }
    
    success, messages = validate_webhook_integration(webhook)
    assert not success
    assert "Eventos inválidos" in messages[0]

# Tests para validate_module_integration
def test_validate_module_integration_success(valid_module_integration):
    """Test para validar integración de módulos exitosa"""
    success, messages = validate_module_integration(valid_module_integration)
    assert success
    assert "Integración de módulos válida" in messages[0]

def test_validate_module_integration_missing_endpoints():
    """Test para validar integración de módulos sin endpoints"""
    integration = valid_module_integration.copy()
    integration['endpoints'] = []
    
    success, messages = validate_module_integration(integration)
    assert not success
    assert "Endpoints faltantes" in messages[0]

def test_validate_module_integration_invalid_mapping():
    """Test para validar integración de módulos con mapeo inválido"""
    integration = valid_module_integration.copy()
    integration['data_mapping'] = {
        'invalid_field': 'target_field'
    }
    
    success, messages = validate_module_integration(integration)
    assert not success
    assert "Mapeo de datos inválido" in messages[0]

# Tests para validate_service_communication
def test_validate_service_communication_success(valid_service_communication):
    """Test para validar comunicación entre servicios exitosa"""
    success, messages = validate_service_communication(valid_service_communication)
    assert success
    assert "Comunicación entre servicios válida" in messages[0]

def test_validate_service_communication_invalid_protocol():
    """Test para validar comunicación entre servicios con protocolo inválido"""
    communication = valid_service_communication.copy()
    communication['protocol'] = 'invalid'
    
    success, messages = validate_service_communication(communication)
    assert not success
    assert "Protocolo inválido" in messages[0]

def test_validate_service_communication_missing_endpoint():
    """Test para validar comunicación entre servicios sin endpoint"""
    communication = valid_service_communication.copy()
    communication['endpoint'] = ''
    
    success, messages = validate_service_communication(communication)
    assert not success
    assert "Endpoint faltante" in messages[0]

# Tests para validate_data_flow
def test_validate_data_flow_success(valid_data_flow):
    """Test para validar flujo de datos exitoso"""
    success, messages = validate_data_flow(valid_data_flow)
    assert success
    assert "Flujo de datos válido" in messages[0]

def test_validate_data_flow_invalid_transformation():
    """Test para validar flujo de datos con transformación inválida"""
    data_flow = valid_data_flow.copy()
    data_flow['transformation_rules'].append({
        'field': 'invalid_field',
        'operation': 'invalid_operation'
    })
    
    success, messages = validate_data_flow(data_flow)
    assert not success
    assert "Transformación inválida" in messages[0]

def test_validate_data_flow_invalid_validation():
    """Test para validar flujo de datos con validación inválida"""
    data_flow = valid_data_flow.copy()
    data_flow['validation_rules'].append({
        'field': 'invalid_field',
        'type': 'invalid_type'
    })
    
    success, messages = validate_data_flow(data_flow)
    assert not success
    assert "Validación inválida" in messages[0]

# Tests para validate_dependency_chain
def test_validate_dependency_chain_success():
    """Test para validar cadena de dependencias exitosa"""
    dependency_chain = {
        'modules': [
            {
                'name': 'auth',
                'dependencies': []
            },
            {
                'name': 'vehicles',
                'dependencies': ['auth']
            },
            {
                'name': 'telemetry',
                'dependencies': ['vehicles']
            }
        ],
        'services': [
            {
                'name': 'notification',
                'dependencies': ['email', 'sms']
            },
            {
                'name': 'email',
                'dependencies': []
            },
            {
                'name': 'sms',
                'dependencies': []
            }
        ]
    }
    
    success, messages = validate_dependency_chain(dependency_chain)
    assert success
    assert "Cadena de dependencias válida" in messages[0]

def test_validate_dependency_chain_circular():
    """Test para validar cadena de dependencias circular"""
    dependency_chain = {
        'modules': [
            {
                'name': 'auth',
                'dependencies': ['vehicles']
            },
            {
                'name': 'vehicles',
                'dependencies': ['auth']
            }
        ]
    }
    
    success, messages = validate_dependency_chain(dependency_chain)
    assert not success
    assert "Dependencia circular detectada" in messages[0]

def test_validate_dependency_chain_missing():
    """Test para validar cadena de dependencias con dependencia faltante"""
    dependency_chain = {
        'modules': [
            {
                'name': 'vehicles',
                'dependencies': ['nonexistent']
            }
        ]
    }
    
    success, messages = validate_dependency_chain(dependency_chain)
    assert not success
    assert "Dependencia faltante" in messages[0]

# Tests para validate_error_propagation
def test_validate_error_propagation_success():
    """Test para validar propagación de errores exitosa"""
    error_propagation = {
        'source': 'auth',
        'error_type': 'AuthenticationError',
        'propagation_chain': [
            {
                'module': 'vehicles',
                'handling': 'catch_and_log'
            },
            {
                'module': 'telemetry',
                'handling': 'catch_and_retry'
            }
        ],
        'final_handling': 'notify_admin'
    }
    
    success, messages = validate_error_propagation(error_propagation)
    assert success
    assert "Propagación de errores válida" in messages[0]

def test_validate_error_propagation_missing_handling():
    """Test para validar propagación de errores sin manejo"""
    error_propagation = {
        'source': 'auth',
        'error_type': 'AuthenticationError',
        'propagation_chain': [
            {
                'module': 'vehicles'
                # Falta handling
            }
        ]
    }
    
    success, messages = validate_error_propagation(error_propagation)
    assert not success
    assert "Manejo de error faltante" in messages[0]

# Tests para validate_state_management
def test_validate_state_management_success():
    """Test para validar gestión de estado exitosa"""
    state_management = {
        'module': 'vehicles',
        'states': [
            {
                'name': 'active',
                'transitions': ['maintenance', 'inactive'],
                'persistence': 'database'
            },
            {
                'name': 'maintenance',
                'transitions': ['active'],
                'persistence': 'database'
            }
        ],
        'state_changes': [
            {
                'from_state': 'active',
                'to_state': 'maintenance',
                'trigger': 'maintenance_request',
                'validation': 'check_permissions'
            }
        ]
    }
    
    success, messages = validate_state_management(state_management)
    assert success
    assert "Gestión de estado válida" in messages[0]

def test_validate_state_management_invalid_transition():
    """Test para validar gestión de estado con transición inválida"""
    state_management = {
        'module': 'vehicles',
        'states': [
            {
                'name': 'active',
                'transitions': ['invalid_state']
            }
        ]
    }
    
    success, messages = validate_state_management(state_management)
    assert not success
    assert "Transición inválida" in messages[0]

# Tests para validate_event_handling
def test_validate_event_handling_success():
    """Test para validar manejo de eventos exitoso"""
    event_handling = {
        'event_type': 'vehicle_status_change',
        'publishers': [
            {
                'module': 'vehicles',
                'event_data': ['status', 'timestamp']
            }
        ],
        'subscribers': [
            {
                'module': 'notification',
                'handling': 'send_alert'
            },
            {
                'module': 'analytics',
                'handling': 'update_statistics'
            }
        ],
        'event_schema': {
            'type': 'object',
            'properties': {
                'status': {'type': 'string'},
                'timestamp': {'type': 'string', 'format': 'date-time'}
            }
        }
    }
    
    success, messages = validate_event_handling(event_handling)
    assert success
    assert "Manejo de eventos válido" in messages[0]

def test_validate_event_handling_missing_schema():
    """Test para validar manejo de eventos sin esquema"""
    event_handling = {
        'event_type': 'vehicle_status_change',
        'publishers': [
            {
                'module': 'vehicles',
                'event_data': ['status', 'timestamp']
            }
        ],
        'subscribers': [
            {
                'module': 'notification',
                'handling': 'send_alert'
            }
        ]
        # Falta event_schema
    }
    
    success, messages = validate_event_handling(event_handling)
    assert not success
    assert "Esquema de evento faltante" in messages[0]

# Tests para validate_transaction_flow
def test_validate_transaction_flow_success():
    """Test para validar flujo de transacciones exitoso"""
    transaction_flow = {
        'transaction_type': 'vehicle_registration',
        'steps': [
            {
                'name': 'validate_data',
                'module': 'vehicles',
                'rollback_action': 'none'
            },
            {
                'name': 'create_record',
                'module': 'database',
                'rollback_action': 'delete_record'
            },
            {
                'name': 'send_notification',
                'module': 'notification',
                'rollback_action': 'none'
            }
        ],
        'timeout_seconds': 30,
        'retry_policy': {
            'max_attempts': 3,
            'delay_seconds': 5
        }
    }
    
    success, messages = validate_transaction_flow(transaction_flow)
    assert success
    assert "Flujo de transacciones válido" in messages[0]

def test_validate_transaction_flow_missing_rollback():
    """Test para validar flujo de transacciones sin acción de rollback"""
    transaction_flow = {
        'transaction_type': 'vehicle_registration',
        'steps': [
            {
                'name': 'create_record',
                'module': 'database'
                # Falta rollback_action
            }
        ]
    }
    
    success, messages = validate_transaction_flow(transaction_flow)
    assert not success
    assert "Acción de rollback faltante" in messages[0] 