import pytest
import json
from datetime import datetime, timedelta
from src.automation.validations.usability_validation import (
    validate_ui_components,
    validate_user_flows,
    validate_accessibility,
    validate_responsive_design,
    validate_error_messages,
    validate_loading_states,
    validate_form_validation,
    validate_navigation,
    validate_feedback,
    validate_help_system
)

# Fixtures para pruebas de usabilidad
@pytest.fixture
def valid_ui_components():
    """Fixture que proporciona componentes de UI válidos"""
    return {
        'buttons': [
            {
                'id': 'submit_button',
                'text': 'Guardar',
                'type': 'primary',
                'icon': 'save',
                'disabled': False,
                'loading': False,
                'aria_label': 'Guardar cambios'
            },
            {
                'id': 'cancel_button',
                'text': 'Cancelar',
                'type': 'secondary',
                'icon': 'close',
                'disabled': False,
                'loading': False,
                'aria_label': 'Cancelar operación'
            }
        ],
        'inputs': [
            {
                'id': 'email_input',
                'type': 'email',
                'label': 'Correo electrónico',
                'placeholder': 'ejemplo@correo.com',
                'required': True,
                'validation': {
                    'pattern': '^[^@]+@[^@]+\\.[^@]+$',
                    'message': 'Ingrese un correo electrónico válido'
                }
            },
            {
                'id': 'password_input',
                'type': 'password',
                'label': 'Contraseña',
                'placeholder': 'Ingrese su contraseña',
                'required': True,
                'validation': {
                    'min_length': 8,
                    'message': 'La contraseña debe tener al menos 8 caracteres'
                }
            }
        ],
        'tables': [
            {
                'id': 'vehicles_table',
                'columns': [
                    {
                        'key': 'plate',
                        'title': 'Placa',
                        'sortable': True,
                        'filterable': True
                    },
                    {
                        'key': 'model',
                        'title': 'Modelo',
                        'sortable': True,
                        'filterable': True
                    }
                ],
                'pagination': {
                    'enabled': True,
                    'page_size': 10,
                    'page_sizes': [10, 20, 50]
                }
            }
        ]
    }

@pytest.fixture
def valid_user_flows():
    """Fixture que proporciona flujos de usuario válidos"""
    return {
        'login_flow': {
            'steps': [
                {
                    'name': 'ingresar_credenciales',
                    'components': ['email_input', 'password_input', 'submit_button'],
                    'validation': 'validate_credentials'
                },
                {
                    'name': 'verificar_autenticacion',
                    'components': ['loading_indicator'],
                    'validation': 'check_auth_status'
                },
                {
                    'name': 'redireccionar_dashboard',
                    'components': ['success_message'],
                    'validation': 'check_redirect'
                }
            ],
            'error_handling': {
                'invalid_credentials': {
                    'message': 'Credenciales inválidas',
                    'action': 'show_error'
                },
                'network_error': {
                    'message': 'Error de conexión',
                    'action': 'retry'
                }
            }
        },
        'vehicle_registration': {
            'steps': [
                {
                    'name': 'ingresar_datos_vehiculo',
                    'components': ['vehicle_form'],
                    'validation': 'validate_vehicle_data'
                },
                {
                    'name': 'subir_documentos',
                    'components': ['document_upload'],
                    'validation': 'validate_documents'
                },
                {
                    'name': 'confirmar_registro',
                    'components': ['confirmation_dialog'],
                    'validation': 'confirm_registration'
                }
            ]
        }
    }

@pytest.fixture
def valid_accessibility():
    """Fixture que proporciona configuración de accesibilidad válida"""
    return {
        'aria_labels': {
            'required': True,
            'components': [
                {
                    'id': 'main_nav',
                    'label': 'Navegación principal'
                },
                {
                    'id': 'search_input',
                    'label': 'Buscar vehículos'
                }
            ]
        },
        'keyboard_navigation': {
            'enabled': True,
            'tab_order': [
                'main_nav',
                'search_input',
                'filter_button',
                'results_table'
            ]
        },
        'color_contrast': {
            'enabled': True,
            'min_ratio': 4.5,
            'check_text': True,
            'check_backgrounds': True
        },
        'screen_reader': {
            'enabled': True,
            'announcements': [
                {
                    'event': 'page_load',
                    'message': 'Página de vehículos cargada'
                },
                {
                    'event': 'search_complete',
                    'message': 'Búsqueda completada'
                }
            ]
        }
    }

# Tests para validate_ui_components
def test_validate_ui_components_success(valid_ui_components):
    """Test para validar componentes de UI exitosos"""
    success, messages = validate_ui_components(valid_ui_components)
    assert success
    assert "Componentes de UI válidos" in messages[0]

def test_validate_ui_components_missing_aria():
    """Test para validar componentes de UI sin etiquetas ARIA"""
    components = valid_ui_components.copy()
    components['buttons'][0]['aria_label'] = ''
    
    success, messages = validate_ui_components(components)
    assert not success
    assert "Etiqueta ARIA faltante" in messages[0]

def test_validate_ui_components_invalid_validation():
    """Test para validar componentes de UI con validación inválida"""
    components = valid_ui_components.copy()
    components['inputs'][0]['validation']['pattern'] = 'invalid_pattern'
    
    success, messages = validate_ui_components(components)
    assert not success
    assert "Validación inválida" in messages[0]

# Tests para validate_user_flows
def test_validate_user_flows_success(valid_user_flows):
    """Test para validar flujos de usuario exitosos"""
    success, messages = validate_user_flows(valid_user_flows)
    assert success
    assert "Flujos de usuario válidos" in messages[0]

def test_validate_user_flows_missing_steps():
    """Test para validar flujos de usuario sin pasos"""
    flows = valid_user_flows.copy()
    flows['login_flow']['steps'] = []
    
    success, messages = validate_user_flows(flows)
    assert not success
    assert "Pasos faltantes" in messages[0]

def test_validate_user_flows_invalid_validation():
    """Test para validar flujos de usuario con validación inválida"""
    flows = valid_user_flows.copy()
    flows['login_flow']['steps'][0]['validation'] = 'invalid_validation'
    
    success, messages = validate_user_flows(flows)
    assert not success
    assert "Validación inválida" in messages[0]

# Tests para validate_accessibility
def test_validate_accessibility_success(valid_accessibility):
    """Test para validar accesibilidad exitosa"""
    success, messages = validate_accessibility(valid_accessibility)
    assert success
    assert "Accesibilidad válida" in messages[0]

def test_validate_accessibility_missing_aria():
    """Test para validar accesibilidad sin etiquetas ARIA"""
    accessibility = valid_accessibility.copy()
    accessibility['aria_labels']['required'] = False
    
    success, messages = validate_accessibility(accessibility)
    assert not success
    assert "Etiquetas ARIA requeridas" in messages[0]

def test_validate_accessibility_invalid_contrast():
    """Test para validar accesibilidad con contraste inválido"""
    accessibility = valid_accessibility.copy()
    accessibility['color_contrast']['min_ratio'] = 2.0  # Por debajo del mínimo
    
    success, messages = validate_accessibility(accessibility)
    assert not success
    assert "Contraste insuficiente" in messages[0]

# Tests para validate_responsive_design
def test_validate_responsive_design_success():
    """Test para validar diseño responsivo exitoso"""
    responsive_design = {
        'breakpoints': [
            {
                'name': 'mobile',
                'max_width': 768,
                'layout': 'stacked'
            },
            {
                'name': 'tablet',
                'min_width': 769,
                'max_width': 1024,
                'layout': 'grid'
            },
            {
                'name': 'desktop',
                'min_width': 1025,
                'layout': 'expanded'
            }
        ],
        'components': [
            {
                'id': 'navigation',
                'mobile': {
                    'type': 'drawer',
                    'position': 'left'
                },
                'desktop': {
                    'type': 'horizontal',
                    'position': 'top'
                }
            },
            {
                'id': 'data_table',
                'mobile': {
                    'type': 'cards',
                    'items_per_page': 5
                },
                'desktop': {
                    'type': 'table',
                    'items_per_page': 10
                }
            }
        ]
    }
    
    success, messages = validate_responsive_design(responsive_design)
    assert success
    assert "Diseño responsivo válido" in messages[0]

def test_validate_responsive_design_missing_breakpoints():
    """Test para validar diseño responsivo sin breakpoints"""
    responsive_design = {
        'breakpoints': [],
        'components': []
    }
    
    success, messages = validate_responsive_design(responsive_design)
    assert not success
    assert "Breakpoints faltantes" in messages[0]

# Tests para validate_error_messages
def test_validate_error_messages_success():
    """Test para validar mensajes de error exitosos"""
    error_messages = {
        'validation_errors': [
            {
                'code': 'required_field',
                'message': 'Este campo es requerido',
                'severity': 'error',
                'icon': 'error'
            },
            {
                'code': 'invalid_format',
                'message': 'Formato inválido',
                'severity': 'warning',
                'icon': 'warning'
            }
        ],
        'system_errors': [
            {
                'code': 'network_error',
                'message': 'Error de conexión',
                'severity': 'error',
                'action': 'retry'
            },
            {
                'code': 'server_error',
                'message': 'Error del servidor',
                'severity': 'error',
                'action': 'contact_support'
            }
        ],
        'display_rules': {
            'position': 'top',
            'timeout': 5000,
            'dismissible': True
        }
    }
    
    success, messages = validate_error_messages(error_messages)
    assert success
    assert "Mensajes de error válidos" in messages[0]

def test_validate_error_messages_missing_code():
    """Test para validar mensajes de error sin código"""
    error_messages = {
        'validation_errors': [
            {
                'message': 'Este campo es requerido',
                'severity': 'error'
            }
        ]
    }
    
    success, messages = validate_error_messages(error_messages)
    assert not success
    assert "Código de error faltante" in messages[0]

# Tests para validate_loading_states
def test_validate_loading_states_success():
    """Test para validar estados de carga exitosos"""
    loading_states = {
        'global_loading': {
            'enabled': True,
            'type': 'spinner',
            'message': 'Cargando...',
            'overlay': True
        },
        'component_loading': [
            {
                'component_id': 'data_table',
                'type': 'skeleton',
                'rows': 5
            },
            {
                'component_id': 'form',
                'type': 'disabled',
                'message': 'Procesando...'
            }
        ],
        'progress_indicators': [
            {
                'id': 'upload_progress',
                'type': 'linear',
                'show_percentage': True
            },
            {
                'id': 'processing_progress',
                'type': 'circular',
                'show_percentage': False
            }
        ]
    }
    
    success, messages = validate_loading_states(loading_states)
    assert success
    assert "Estados de carga válidos" in messages[0]

def test_validate_loading_states_missing_type():
    """Test para validar estados de carga sin tipo"""
    loading_states = {
        'global_loading': {
            'enabled': True,
            'message': 'Cargando...'
        }
    }
    
    success, messages = validate_loading_states(loading_states)
    assert not success
    assert "Tipo de carga faltante" in messages[0]

# Tests para validate_form_validation
def test_validate_form_validation_success():
    """Test para validar validación de formularios exitosa"""
    form_validation = {
        'fields': [
            {
                'id': 'email',
                'type': 'email',
                'validations': [
                    {
                        'type': 'required',
                        'message': 'El correo es requerido'
                    },
                    {
                        'type': 'pattern',
                        'pattern': '^[^@]+@[^@]+\\.[^@]+$',
                        'message': 'Correo inválido'
                    }
                ]
            },
            {
                'id': 'password',
                'type': 'password',
                'validations': [
                    {
                        'type': 'required',
                        'message': 'La contraseña es requerida'
                    },
                    {
                        'type': 'min_length',
                        'value': 8,
                        'message': 'Mínimo 8 caracteres'
                    }
                ]
            }
        ],
        'submit_validation': {
            'type': 'all',
            'message': 'Por favor corrija los errores'
        }
    }
    
    success, messages = validate_form_validation(form_validation)
    assert success
    assert "Validación de formularios válida" in messages[0]

def test_validate_form_validation_missing_validations():
    """Test para validar validación de formularios sin validaciones"""
    form_validation = {
        'fields': [
            {
                'id': 'email',
                'type': 'email'
                # Falta validations
            }
        ]
    }
    
    success, messages = validate_form_validation(form_validation)
    assert not success
    assert "Validaciones faltantes" in messages[0]

# Tests para validate_navigation
def test_validate_navigation_success():
    """Test para validar navegación exitosa"""
    navigation = {
        'main_menu': [
            {
                'id': 'dashboard',
                'label': 'Dashboard',
                'icon': 'home',
                'route': '/dashboard'
            },
            {
                'id': 'vehicles',
                'label': 'Vehículos',
                'icon': 'car',
                'route': '/vehicles',
                'submenu': [
                    {
                        'id': 'list',
                        'label': 'Lista',
                        'route': '/vehicles/list'
                    },
                    {
                        'id': 'add',
                        'label': 'Agregar',
                        'route': '/vehicles/add'
                    }
                ]
            }
        ],
        'breadcrumbs': {
            'enabled': True,
            'separator': '>',
            'show_home': True
        },
        'back_button': {
            'enabled': True,
            'position': 'top-left'
        }
    }
    
    success, messages = validate_navigation(navigation)
    assert success
    assert "Navegación válida" in messages[0]

def test_validate_navigation_missing_route():
    """Test para validar navegación sin ruta"""
    navigation = {
        'main_menu': [
            {
                'id': 'dashboard',
                'label': 'Dashboard',
                'icon': 'home'
                # Falta route
            }
        ]
    }
    
    success, messages = validate_navigation(navigation)
    assert not success
    assert "Ruta faltante" in messages[0]

# Tests para validate_feedback
def test_validate_feedback_success():
    """Test para validar sistema de feedback exitoso"""
    feedback = {
        'notifications': {
            'success': {
                'type': 'toast',
                'position': 'top-right',
                'duration': 3000,
                'icon': 'check'
            },
            'error': {
                'type': 'alert',
                'position': 'top',
                'duration': 5000,
                'icon': 'error'
            }
        },
        'confirmations': {
            'delete': {
                'type': 'dialog',
                'title': 'Confirmar eliminación',
                'message': '¿Está seguro de eliminar este elemento?',
                'buttons': [
                    {
                        'text': 'Cancelar',
                        'type': 'secondary'
                    },
                    {
                        'text': 'Eliminar',
                        'type': 'danger'
                    }
                ]
            }
        },
        'progress': {
            'type': 'linear',
            'show_percentage': True,
            'color': 'primary'
        }
    }
    
    success, messages = validate_feedback(feedback)
    assert success
    assert "Sistema de feedback válido" in messages[0]

def test_validate_feedback_missing_type():
    """Test para validar sistema de feedback sin tipo"""
    feedback = {
        'notifications': {
            'success': {
                'position': 'top-right',
                'duration': 3000
                # Falta type
            }
        }
    }
    
    success, messages = validate_feedback(feedback)
    assert not success
    assert "Tipo de notificación faltante" in messages[0]

# Tests para validate_help_system
def test_validate_help_system_success():
    """Test para validar sistema de ayuda exitoso"""
    help_system = {
        'tooltips': [
            {
                'id': 'email_tooltip',
                'text': 'Ingrese su correo electrónico',
                'position': 'right',
                'trigger': 'hover'
            },
            {
                'id': 'password_tooltip',
                'text': 'Mínimo 8 caracteres',
                'position': 'right',
                'trigger': 'hover'
            }
        ],
        'help_center': {
            'enabled': True,
            'articles': [
                {
                    'id': 'getting_started',
                    'title': 'Primeros pasos',
                    'content': 'Guía de inicio rápido...'
                },
                {
                    'id': 'faq',
                    'title': 'Preguntas frecuentes',
                    'content': 'Lista de preguntas...'
                }
            ],
            'search': {
                'enabled': True,
                'placeholder': 'Buscar en la ayuda'
            }
        },
        'context_help': {
            'enabled': True,
            'button': {
                'icon': 'help',
                'position': 'bottom-right'
            }
        }
    }
    
    success, messages = validate_help_system(help_system)
    assert success
    assert "Sistema de ayuda válido" in messages[0]

def test_validate_help_system_missing_content():
    """Test para validar sistema de ayuda sin contenido"""
    help_system = {
        'help_center': {
            'enabled': True,
            'articles': [
                {
                    'id': 'getting_started',
                    'title': 'Primeros pasos'
                    # Falta content
                }
            ]
        }
    }
    
    success, messages = validate_help_system(help_system)
    assert not success
    assert "Contenido de ayuda faltante" in messages[0] 