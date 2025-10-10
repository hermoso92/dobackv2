import pytest
import json
from pathlib import Path
from src.automation.validations.role_validation import (
    validate_role_structure,
    validate_permission_structure,
    validate_role_hierarchy,
    validate_permission_conflicts,
    validate_role_permissions,
    validate_role_definition,
    validate_permission_definition,
    validate_user_roles
)
from datetime import datetime

# Fixtures para datos de prueba
@pytest.fixture
def valid_role():
    """Fixture que proporciona un rol válido"""
    return {
        'id': 'test_role',
        'name': 'Test Role',
        'description': 'Role for testing',
        'permissions': [
            {
                'id': 'test_perm',
                'name': 'Test Permission',
                'resource': 'test_resource',
                'action': 'read'
            }
        ]
    }

@pytest.fixture
def valid_permission():
    """Fixture que proporciona un permiso válido"""
    return {
        'id': 'test_perm',
        'name': 'Test Permission',
        'resource': 'test_resource',
        'action': 'read'
    }

@pytest.fixture
def valid_roles():
    """Fixture que proporciona una lista de roles válidos"""
    return [
        {
            'id': 'admin',
            'name': 'Administrator',
            'description': 'System administrator',
            'permissions': [
                {
                    'id': 'admin_all',
                    'name': 'All Permissions',
                    'resource': '*',
                    'action': '*'
                }
            ]
        },
        {
            'id': 'manager',
            'name': 'Manager',
            'description': 'Department manager',
            'permissions': [
                {
                    'id': 'manage_dept',
                    'name': 'Manage Department',
                    'resource': 'department',
                    'action': '*'
                }
            ],
            'inherits': ['user']
        },
        {
            'id': 'user',
            'name': 'User',
            'description': 'Regular user',
            'permissions': [
                {
                    'id': 'view_profile',
                    'name': 'View Profile',
                    'resource': 'profile',
                    'action': 'read'
                }
            ]
        }
    ]

# Fixtures para pruebas de roles
@pytest.fixture
def valid_role_definition():
    """Fixture que proporciona una definición de rol válida"""
    return {
        'name': 'admin',
        'description': 'Administrador del sistema',
        'permissions': [
            'create:company',
            'read:company',
            'update:company',
            'delete:company',
            'create:user',
            'read:user',
            'update:user',
            'delete:user'
        ],
        'metadata': {
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'version': '1.0'
        }
    }

@pytest.fixture
def valid_permission_definition():
    """Fixture que proporciona una definición de permiso válida"""
    return {
        'name': 'create:company',
        'description': 'Crear una nueva compañía',
        'resource': 'company',
        'action': 'create',
        'conditions': {
            'requires_approval': True,
            'max_companies': 10
        }
    }

@pytest.fixture
def valid_role_hierarchy():
    """Fixture que proporciona una jerarquía de roles válida"""
    return {
        'admin': ['company_admin', 'operator'],
        'company_admin': ['operator', 'viewer'],
        'operator': ['viewer'],
        'viewer': []
    }

# Tests para validate_role_structure
def test_validate_role_structure_success(valid_role):
    """Test para validar un rol con estructura válida"""
    success, messages = validate_role_structure(valid_role)
    assert success
    assert not messages

def test_validate_role_structure_missing_fields():
    """Test para validar un rol con campos faltantes"""
    role = {
        'id': 'test_role',
        'name': 'Test Role'
    }
    success, messages = validate_role_structure(role)
    assert not success
    assert "Faltan campos requeridos" in messages[0]

def test_validate_role_structure_invalid_types():
    """Test para validar un rol con tipos de datos inválidos"""
    role = {
        'id': 123,  # Debe ser string
        'name': 'Test Role',
        'description': 'Role for testing',
        'permissions': 'invalid'  # Debe ser lista
    }
    success, messages = validate_role_structure(role)
    assert not success
    assert any("debe ser una cadena" in msg for msg in messages)
    assert any("debe ser una lista" in msg for msg in messages)

# Tests para validate_permission_structure
def test_validate_permission_structure_success(valid_permission):
    """Test para validar un permiso con estructura válida"""
    success, messages = validate_permission_structure(valid_permission)
    assert success
    assert not messages

def test_validate_permission_structure_missing_fields():
    """Test para validar un permiso con campos faltantes"""
    permission = {
        'id': 'test_perm',
        'name': 'Test Permission'
    }
    success, messages = validate_permission_structure(permission)
    assert not success
    assert "Faltan campos requeridos" in messages[0]

def test_validate_permission_structure_invalid_types():
    """Test para validar un permiso con tipos de datos inválidos"""
    permission = {
        'id': 123,  # Debe ser string
        'name': 'Test Permission',
        'resource': 456,  # Debe ser string
        'action': ['read']  # Debe ser string
    }
    success, messages = validate_permission_structure(permission)
    assert not success
    assert any("debe ser una cadena" in msg for msg in messages)

def test_validate_permission_structure_invalid_action():
    """Test para validar un permiso con acción inválida"""
    permission = {
        'id': 'test_perm',
        'name': 'Test Permission',
        'resource': 'test_resource',
        'action': 'invalid_action'  # Acción no permitida
    }
    success, messages = validate_permission_structure(permission)
    assert not success
    assert "Acción inválida" in messages[0]

# Tests para validate_role_hierarchy
def test_validate_role_hierarchy_success(valid_roles):
    """Test para validar una jerarquía de roles válida"""
    success, messages = validate_role_hierarchy(valid_roles)
    assert success
    assert not messages

def test_validate_role_hierarchy_cycle():
    """Test para validar una jerarquía de roles con ciclo"""
    roles = [
        {
            'id': 'role1',
            'name': 'Role 1',
            'description': 'First role',
            'permissions': [],
            'inherits': ['role2']
        },
        {
            'id': 'role2',
            'name': 'Role 2',
            'description': 'Second role',
            'permissions': [],
            'inherits': ['role1']  # Ciclo detectado
        }
    ]
    success, messages = validate_role_hierarchy(roles)
    assert not success
    assert "Se detectó un ciclo" in messages[0]

# Tests para validate_permission_conflicts
def test_validate_permission_conflicts_success(valid_roles):
    """Test para validar permisos sin conflictos"""
    success, messages = validate_permission_conflicts(valid_roles)
    assert success
    assert not messages

def test_validate_permission_conflicts_detected():
    """Test para validar permisos con conflictos"""
    roles = [
        {
            'id': 'role1',
            'name': 'Role 1',
            'description': 'First role',
            'permissions': [
                {
                    'id': 'perm1',
                    'name': 'Permission 1',
                    'resource': 'test_resource',
                    'action': 'read'
                }
            ]
        },
        {
            'id': 'role2',
            'name': 'Role 2',
            'description': 'Second role',
            'permissions': [
                {
                    'id': 'perm2',
                    'name': 'Permission 2',
                    'resource': 'test_resource',
                    'action': 'read'  # Conflicto detectado
                }
            ]
        }
    ]
    success, messages = validate_permission_conflicts(roles)
    assert not success
    assert "Conflicto de permisos" in messages[0]

# Tests para validate_role_permissions
def test_validate_role_permissions_success(tmp_path):
    """Test para validar permisos de rol existente"""
    # Crear archivo de configuración temporal
    config_path = tmp_path / "roles.json"
    config_data = {
        'roles': [
            {
                'id': 'test_role',
                'name': 'Test Role',
                'description': 'Role for testing',
                'permissions': [
                    {
                        'id': 'test_perm',
                        'name': 'Test Permission',
                        'resource': 'test_resource',
                        'action': 'read'
                    }
                ]
            }
        ]
    }
    config_path.write_text(json.dumps(config_data))
    
    required_permissions = [
        {'resource': 'test_resource', 'action': 'read'}
    ]
    
    success, messages = validate_role_permissions('test_role', required_permissions)
    assert success
    assert not messages

def test_validate_role_permissions_missing_role(tmp_path):
    """Test para validar permisos de rol inexistente"""
    # Crear archivo de configuración temporal
    config_path = tmp_path / "roles.json"
    config_data = {'roles': []}
    config_path.write_text(json.dumps(config_data))
    
    required_permissions = [
        {'resource': 'test_resource', 'action': 'read'}
    ]
    
    success, messages = validate_role_permissions('nonexistent_role', required_permissions)
    assert not success
    assert "no encontrado" in messages[0]

def test_validate_role_permissions_missing_permission(tmp_path):
    """Test para validar permisos faltantes"""
    # Crear archivo de configuración temporal
    config_path = tmp_path / "roles.json"
    config_data = {
        'roles': [
            {
                'id': 'test_role',
                'name': 'Test Role',
                'description': 'Role for testing',
                'permissions': [
                    {
                        'id': 'test_perm',
                        'name': 'Test Permission',
                        'resource': 'test_resource',
                        'action': 'write'  # Permiso diferente al requerido
                    }
                ]
            }
        ]
    }
    config_path.write_text(json.dumps(config_data))
    
    required_permissions = [
        {'resource': 'test_resource', 'action': 'read'}
    ]
    
    success, messages = validate_role_permissions('test_role', required_permissions)
    assert not success
    assert "Falta permiso requerido" in messages[0]

# Tests para validate_role_definition
def test_validate_role_definition_success(valid_role_definition):
    """Test para validar definición de rol válida"""
    success, messages = validate_role_definition(valid_role_definition)
    assert success
    assert "Definición de rol válida" in messages[0]

def test_validate_role_definition_missing_required():
    """Test para validar definición de rol con campos requeridos faltantes"""
    role = valid_role_definition.copy()
    del role['name']
    
    success, messages = validate_role_definition(role)
    assert not success
    assert "Campos requeridos faltantes" in messages[0]

def test_validate_role_definition_invalid_permissions():
    """Test para validar definición de rol con permisos inválidos"""
    role = valid_role_definition.copy()
    role['permissions'] = ['invalid:permission']
    
    success, messages = validate_role_definition(role)
    assert not success
    assert "Permisos inválidos" in messages[0]

# Tests para validate_permission_definition
def test_validate_permission_definition_success(valid_permission_definition):
    """Test para validar definición de permiso válida"""
    success, messages = validate_permission_definition(valid_permission_definition)
    assert success
    assert "Definición de permiso válida" in messages[0]

def test_validate_permission_definition_missing_required():
    """Test para validar definición de permiso con campos requeridos faltantes"""
    permission = valid_permission_definition.copy()
    del permission['resource']
    
    success, messages = validate_permission_definition(permission)
    assert not success
    assert "Campos requeridos faltantes" in messages[0]

def test_validate_permission_definition_invalid_action():
    """Test para validar definición de permiso con acción inválida"""
    permission = valid_permission_definition.copy()
    permission['action'] = 'invalid_action'
    
    success, messages = validate_permission_definition(permission)
    assert not success
    assert "Acción inválida" in messages[0]

# Tests para validate_role_permissions
def test_validate_role_permissions_success(valid_role_definition, valid_permission_definition):
    """Test para validar permisos de rol válidos"""
    permissions = [valid_permission_definition]
    success, messages = validate_role_permissions(valid_role_definition, permissions)
    assert success
    assert "Permisos de rol válidos" in messages[0]

def test_validate_role_permissions_missing_permission():
    """Test para validar permisos de rol con permiso faltante"""
    role = valid_role_definition.copy()
    permissions = []
    
    success, messages = validate_role_permissions(role, permissions)
    assert not success
    assert "Permisos faltantes" in messages[0]

def test_validate_role_permissions_invalid_permission():
    """Test para validar permisos de rol con permiso inválido"""
    role = valid_role_definition.copy()
    permission = valid_permission_definition.copy()
    permission['name'] = 'invalid:permission'
    permissions = [permission]
    
    success, messages = validate_role_permissions(role, permissions)
    assert not success
    assert "Permisos inválidos" in messages[0]

# Tests para validate_user_roles
def test_validate_user_roles_success():
    """Test para validar roles de usuario válidos"""
    user_roles = {
        'user_id': 'U001',
        'roles': ['admin', 'company_admin'],
        'company_id': 'C001',
        'assigned_at': datetime.now()
    }
    
    success, messages = validate_user_roles(user_roles)
    assert success
    assert "Roles de usuario válidos" in messages[0]

def test_validate_user_roles_missing_required():
    """Test para validar roles de usuario con campos requeridos faltantes"""
    user_roles = {
        'user_id': 'U001',
        'roles': ['admin']
        # Falta company_id y assigned_at
    }
    
    success, messages = validate_user_roles(user_roles)
    assert not success
    assert "Campos requeridos faltantes" in messages[0]

def test_validate_user_roles_invalid_role():
    """Test para validar roles de usuario con rol inválido"""
    user_roles = {
        'user_id': 'U001',
        'roles': ['invalid_role'],
        'company_id': 'C001',
        'assigned_at': datetime.now()
    }
    
    success, messages = validate_user_roles(user_roles)
    assert not success
    assert "Roles inválidos" in messages[0]

# Tests para validate_role_hierarchy
def test_validate_role_hierarchy_success(valid_role_hierarchy):
    """Test para validar jerarquía de roles válida"""
    success, messages = validate_role_hierarchy(valid_role_hierarchy)
    assert success
    assert "Jerarquía de roles válida" in messages[0]

def test_validate_role_hierarchy_cyclic_dependency():
    """Test para validar jerarquía de roles con dependencia cíclica"""
    hierarchy = valid_role_hierarchy.copy()
    hierarchy['admin'].append('viewer')
    hierarchy['viewer'].append('admin')  # Crea un ciclo
    
    success, messages = validate_role_hierarchy(hierarchy)
    assert not success
    assert "Dependencia cíclica detectada" in messages[0]

def test_validate_role_hierarchy_invalid_role():
    """Test para validar jerarquía de roles con rol inválido"""
    hierarchy = valid_role_hierarchy.copy()
    hierarchy['invalid_role'] = ['admin']
    
    success, messages = validate_role_hierarchy(hierarchy)
    assert not success
    assert "Roles inválidos" in messages[0] 