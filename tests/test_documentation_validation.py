import pytest
import json
from datetime import datetime, timedelta
from src.automation.validations.documentation_validation import (
    validate_code_documentation,
    validate_api_documentation,
    validate_user_manual,
    validate_installation_guide,
    validate_api_reference,
    validate_code_examples,
    validate_diagrams,
    validate_changelog,
    validate_contributing_guide,
    validate_security_policy
)

# Fixtures para pruebas de documentación
@pytest.fixture
def valid_code_documentation():
    """Fixture que proporciona documentación de código válida"""
    return {
        'module': 'src/app/services/auth_service.py',
        'docstring': '''
        Servicio de autenticación y autorización.
        
        Este servicio maneja la autenticación de usuarios, gestión de sesiones
        y control de acceso basado en roles.
        
        Args:
            db_session: Sesión de base de datos
            config: Configuración del servicio
            
        Returns:
            AuthService: Instancia del servicio de autenticación
        ''',
        'functions': [
            {
                'name': 'authenticate_user',
                'docstring': '''
                Autentica un usuario con credenciales.
                
                Args:
                    username: Nombre de usuario
                    password: Contraseña
                    
                Returns:
                    dict: Token de acceso y datos del usuario
                    
                Raises:
                    AuthenticationError: Si las credenciales son inválidas
                ''',
                'params': [
                    {
                        'name': 'username',
                        'type': 'str',
                        'description': 'Nombre de usuario'
                    },
                    {
                        'name': 'password',
                        'type': 'str',
                        'description': 'Contraseña'
                    }
                ],
                'returns': {
                    'type': 'dict',
                    'description': 'Token de acceso y datos del usuario'
                },
                'raises': [
                    {
                        'type': 'AuthenticationError',
                        'description': 'Si las credenciales son inválidas'
                    }
                ]
            }
        ],
        'classes': [
            {
                'name': 'AuthService',
                'docstring': '''
                Servicio de autenticación.
                
                Proporciona métodos para autenticación de usuarios y gestión
                de sesiones.
                ''',
                'methods': [
                    {
                        'name': 'login',
                        'docstring': '''
                        Inicia sesión de usuario.
                        
                        Args:
                            credentials: Credenciales de usuario
                            
                        Returns:
                            dict: Token de acceso
                        ''',
                        'params': [
                            {
                                'name': 'credentials',
                                'type': 'dict',
                                'description': 'Credenciales de usuario'
                            }
                        ],
                        'returns': {
                            'type': 'dict',
                            'description': 'Token de acceso'
                        }
                    }
                ]
            }
        ]
    }

@pytest.fixture
def valid_api_documentation():
    """Fixture que proporciona documentación de API válida"""
    return {
        'version': 'v2',
        'base_url': 'https://api.DobackSoft.com',
        'endpoints': [
            {
                'path': '/auth/login',
                'method': 'POST',
                'description': 'Iniciar sesión de usuario',
                'parameters': [
                    {
                        'name': 'username',
                        'type': 'string',
                        'required': True,
                        'description': 'Nombre de usuario'
                    },
                    {
                        'name': 'password',
                        'type': 'string',
                        'required': True,
                        'description': 'Contraseña'
                    }
                ],
                'responses': [
                    {
                        'code': 200,
                        'description': 'Login exitoso',
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'token': {
                                    'type': 'string',
                                    'description': 'Token de acceso'
                                },
                                'user': {
                                    'type': 'object',
                                    'properties': {
                                        'id': {'type': 'string'},
                                        'username': {'type': 'string'}
                                    }
                                }
                            }
                        }
                    },
                    {
                        'code': 401,
                        'description': 'Credenciales inválidas'
                    }
                ]
            }
        ],
        'authentication': {
            'type': 'Bearer',
            'description': 'Token JWT en header Authorization'
        },
        'rate_limits': {
            'requests_per_minute': 100,
            'burst': 20
        }
    }

@pytest.fixture
def valid_user_manual():
    """Fixture que proporciona manual de usuario válido"""
    return {
        'title': 'Manual de Usuario DobackSoft V2',
        'version': '2.0.0',
        'sections': [
            {
                'title': 'Introducción',
                'content': '''
                DobackSoft V2 es una plataforma de monitoreo y control
                de estabilidad para vehículos.
                ''',
                'subsections': [
                    {
                        'title': 'Características',
                        'content': '''
                        - Monitoreo en tiempo real
                        - Análisis de datos
                        - Reportes personalizados
                        '''
                    }
                ]
            },
            {
                'title': 'Primeros Pasos',
                'content': '''
                Guía rápida para comenzar a usar la plataforma.
                ''',
                'steps': [
                    {
                        'title': 'Crear cuenta',
                        'content': 'Registrarse en la plataforma'
                    },
                    {
                        'title': 'Configurar vehículo',
                        'content': 'Agregar vehículo al sistema'
                    }
                ]
            }
        ],
        'images': [
            {
                'path': 'images/dashboard.png',
                'alt': 'Vista del dashboard',
                'caption': 'Panel de control principal'
            }
        ],
        'tables': [
            {
                'title': 'Roles de Usuario',
                'headers': ['Rol', 'Permisos'],
                'rows': [
                    ['Admin', 'Acceso total'],
                    ['Operador', 'Acceso limitado']
                ]
            }
        ]
    }

# Tests para validate_code_documentation
def test_validate_code_documentation_success(valid_code_documentation):
    """Test para validar documentación de código exitosa"""
    success, messages = validate_code_documentation(valid_code_documentation)
    assert success
    assert "Documentación de código válida" in messages[0]

def test_validate_code_documentation_missing_docstring():
    """Test para validar documentación de código sin docstring"""
    doc = valid_code_documentation.copy()
    doc['docstring'] = ''
    
    success, messages = validate_code_documentation(doc)
    assert not success
    assert "Docstring faltante" in messages[0]

def test_validate_code_documentation_invalid_params():
    """Test para validar documentación de código con parámetros inválidos"""
    doc = valid_code_documentation.copy()
    doc['functions'][0]['params'][0]['type'] = 'invalid'
    
    success, messages = validate_code_documentation(doc)
    assert not success
    assert "Tipo de parámetro inválido" in messages[0]

# Tests para validate_api_documentation
def test_validate_api_documentation_success(valid_api_documentation):
    """Test para validar documentación de API exitosa"""
    success, messages = validate_api_documentation(valid_api_documentation)
    assert success
    assert "Documentación de API válida" in messages[0]

def test_validate_api_documentation_missing_endpoints():
    """Test para validar documentación de API sin endpoints"""
    doc = valid_api_documentation.copy()
    doc['endpoints'] = []
    
    success, messages = validate_api_documentation(doc)
    assert not success
    assert "Endpoints faltantes" in messages[0]

def test_validate_api_documentation_invalid_response():
    """Test para validar documentación de API con respuesta inválida"""
    doc = valid_api_documentation.copy()
    doc['endpoints'][0]['responses'][0]['code'] = 'invalid'
    
    success, messages = validate_api_documentation(doc)
    assert not success
    assert "Código de respuesta inválido" in messages[0]

# Tests para validate_user_manual
def test_validate_user_manual_success(valid_user_manual):
    """Test para validar manual de usuario exitoso"""
    success, messages = validate_user_manual(valid_user_manual)
    assert success
    assert "Manual de usuario válido" in messages[0]

def test_validate_user_manual_missing_sections():
    """Test para validar manual de usuario sin secciones"""
    manual = valid_user_manual.copy()
    manual['sections'] = []
    
    success, messages = validate_user_manual(manual)
    assert not success
    assert "Secciones faltantes" in messages[0]

def test_validate_user_manual_invalid_image():
    """Test para validar manual de usuario con imagen inválida"""
    manual = valid_user_manual.copy()
    manual['images'][0]['path'] = ''
    
    success, messages = validate_user_manual(manual)
    assert not success
    assert "Ruta de imagen inválida" in messages[0]

# Tests para validate_installation_guide
def test_validate_installation_guide_success():
    """Test para validar guía de instalación exitosa"""
    guide = {
        'title': 'Guía de Instalación DobackSoft V2',
        'version': '2.0.0',
        'requirements': {
            'system': [
                'Python 3.8+',
                'PostgreSQL 12+',
                'Redis 6+'
            ],
            'python_packages': [
                'flask==2.0.1',
                'sqlalchemy==1.4.23',
                'redis==4.0.2'
            ]
        },
        'steps': [
            {
                'title': 'Preparar entorno',
                'commands': [
                    'python -m venv venv',
                    'source venv/bin/activate',
                    'pip install -r requirements.txt'
                ]
            },
            {
                'title': 'Configurar base de datos',
                'commands': [
                    'createdb DobackSoft',
                    'python manage.py db upgrade'
                ]
            }
        ],
        'configuration': {
            'files': [
                {
                    'name': '.env',
                    'template': '.env.example',
                    'required': True
                },
                {
                    'name': 'config.py',
                    'template': 'config.example.py',
                    'required': True
                }
            ]
        },
        'verification': {
            'steps': [
                {
                    'title': 'Verificar instalación',
                    'command': 'python manage.py check'
                },
                {
                    'title': 'Ejecutar tests',
                    'command': 'pytest'
                }
            ]
        }
    }
    
    success, messages = validate_installation_guide(guide)
    assert success
    assert "Guía de instalación válida" in messages[0]

def test_validate_installation_guide_missing_requirements():
    """Test para validar guía de instalación sin requisitos"""
    guide = {
        'title': 'Guía de Instalación',
        'version': '2.0.0'
        # Falta requirements, steps, etc.
    }
    
    success, messages = validate_installation_guide(guide)
    assert not success
    assert "Requisitos faltantes" in messages[0]

# Tests para validate_api_reference
def test_validate_api_reference_success():
    """Test para validar referencia de API exitosa"""
    reference = {
        'version': 'v2',
        'base_url': 'https://api.DobackSoft.com',
        'authentication': {
            'type': 'Bearer',
            'description': 'Token JWT en header Authorization'
        },
        'endpoints': [
            {
                'path': '/vehicles',
                'method': 'GET',
                'description': 'Listar vehículos',
                'parameters': [
                    {
                        'name': 'company_id',
                        'type': 'string',
                        'required': True,
                        'description': 'ID de la compañía'
                    }
                ],
                'responses': [
                    {
                        'code': 200,
                        'description': 'Lista de vehículos',
                        'schema': {
                            'type': 'array',
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'id': {'type': 'string'},
                                    'plate': {'type': 'string'}
                                }
                            }
                        }
                    }
                ]
            }
        ],
        'models': [
            {
                'name': 'Vehicle',
                'properties': [
                    {
                        'name': 'id',
                        'type': 'string',
                        'description': 'ID único del vehículo'
                    },
                    {
                        'name': 'plate',
                        'type': 'string',
                        'description': 'Placa del vehículo'
                    }
                ]
            }
        ],
        'errors': [
            {
                'code': 'VEHICLE_NOT_FOUND',
                'message': 'Vehículo no encontrado',
                'status': 404
            }
        ]
    }
    
    success, messages = validate_api_reference(reference)
    assert success
    assert "Referencia de API válida" in messages[0]

def test_validate_api_reference_missing_endpoints():
    """Test para validar referencia de API sin endpoints"""
    reference = {
        'version': 'v2',
        'base_url': 'https://api.DobackSoft.com'
        # Falta endpoints, models, etc.
    }
    
    success, messages = validate_api_reference(reference)
    assert not success
    assert "Endpoints faltantes" in messages[0]

# Tests para validate_code_examples
def test_validate_code_examples_success():
    """Test para validar ejemplos de código exitosos"""
    examples = {
        'language': 'python',
        'examples': [
            {
                'title': 'Autenticación de usuario',
                'description': 'Ejemplo de login de usuario',
                'code': '''
                from DobackSoft import AuthService
                
                auth = AuthService()
                token = auth.login({
                    'username': 'user@example.com',
                    'password': '********'
                })
                ''',
                'output': '''
                {
                    'token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                    'user': {
                        'id': '123',
                        'username': 'user@example.com'
                    }
                }
                '''
            }
        ],
        'dependencies': [
            {
                'name': 'DobackSoft',
                'version': '2.0.0'
            }
        ]
    }
    
    success, messages = validate_code_examples(examples)
    assert success
    assert "Ejemplos de código válidos" in messages[0]

def test_validate_code_examples_missing_code():
    """Test para validar ejemplos de código sin código"""
    examples = {
        'language': 'python',
        'examples': [
            {
                'title': 'Autenticación de usuario',
                'description': 'Ejemplo de login de usuario'
                # Falta code y output
            }
        ]
    }
    
    success, messages = validate_code_examples(examples)
    assert not success
    assert "Código faltante" in messages[0]

# Tests para validate_diagrams
def test_validate_diagrams_success():
    """Test para validar diagramas exitosos"""
    diagrams = {
        'architecture': {
            'title': 'Arquitectura del Sistema',
            'type': 'mermaid',
            'content': '''
            graph TD
                A[Cliente] --> B[API Gateway]
                B --> C[Servicios]
                C --> D[Base de Datos]
            ''',
            'description': 'Diagrama de arquitectura general'
        },
        'sequence': {
            'title': 'Flujo de Autenticación',
            'type': 'mermaid',
            'content': '''
            sequenceDiagram
                Client->>API: Login Request
                API->>Auth: Validate
                Auth->>DB: Check User
                DB-->>Auth: User Data
                Auth-->>API: Token
                API-->>Client: Response
            ''',
            'description': 'Diagrama de secuencia de autenticación'
        }
    }
    
    success, messages = validate_diagrams(diagrams)
    assert success
    assert "Diagramas válidos" in messages[0]

def test_validate_diagrams_missing_content():
    """Test para validar diagramas sin contenido"""
    diagrams = {
        'architecture': {
            'title': 'Arquitectura del Sistema',
            'type': 'mermaid'
            # Falta content y description
        }
    }
    
    success, messages = validate_diagrams(diagrams)
    assert not success
    assert "Contenido faltante" in messages[0]

# Tests para validate_changelog
def test_validate_changelog_success():
    """Test para validar changelog exitoso"""
    changelog = {
        'version': '2.0.0',
        'date': '2024-01-01',
        'changes': [
            {
                'type': 'feature',
                'description': 'Nuevo sistema de autenticación',
                'details': [
                    'Soporte para JWT',
                    'Refresh tokens',
                    'Múltiples roles'
                ]
            },
            {
                'type': 'fix',
                'description': 'Corrección de errores',
                'details': [
                    'Arreglado problema de sesiones',
                    'Corregido error en validación'
                ]
            }
        ],
        'breaking_changes': [
            {
                'description': 'Nueva estructura de API',
                'migration_guide': 'docs/migration/v2.md'
            }
        ],
        'deprecations': [
            {
                'feature': 'API v1',
                'removal_date': '2024-12-31',
                'replacement': 'API v2'
            }
        ]
    }
    
    success, messages = validate_changelog(changelog)
    assert success
    assert "Changelog válido" in messages[0]

def test_validate_changelog_missing_changes():
    """Test para validar changelog sin cambios"""
    changelog = {
        'version': '2.0.0',
        'date': '2024-01-01'
        # Falta changes, breaking_changes, etc.
    }
    
    success, messages = validate_changelog(changelog)
    assert not success
    assert "Cambios faltantes" in messages[0]

# Tests para validate_contributing_guide
def test_validate_contributing_guide_success():
    """Test para validar guía de contribución exitosa"""
    guide = {
        'title': 'Guía de Contribución',
        'sections': [
            {
                'title': 'Cómo Contribuir',
                'content': '''
                Pasos para contribuir al proyecto.
                ''',
                'steps': [
                    {
                        'title': 'Fork del repositorio',
                        'content': 'Crear fork en GitHub'
                    },
                    {
                        'title': 'Crear rama',
                        'content': 'Crear rama para feature'
                    }
                ]
            }
        ],
        'code_standards': {
            'style': 'PEP 8',
            'docstring': 'Google style',
            'tests': 'pytest'
        },
        'workflow': {
            'branches': [
                {
                    'name': 'main',
                    'description': 'Rama principal'
                },
                {
                    'name': 'develop',
                    'description': 'Rama de desarrollo'
                }
            ],
            'pull_requests': {
                'template': '.github/PULL_REQUEST_TEMPLATE.md',
                'required_checks': [
                    'tests',
                    'lint',
                    'coverage'
                ]
            }
        }
    }
    
    success, messages = validate_contributing_guide(guide)
    assert success
    assert "Guía de contribución válida" in messages[0]

def test_validate_contributing_guide_missing_sections():
    """Test para validar guía de contribución sin secciones"""
    guide = {
        'title': 'Guía de Contribución'
        # Falta sections, code_standards, etc.
    }
    
    success, messages = validate_contributing_guide(guide)
    assert not success
    assert "Secciones faltantes" in messages[0]

# Tests para validate_security_policy
def test_validate_security_policy_success():
    """Test para validar política de seguridad exitosa"""
    policy = {
        'title': 'Política de Seguridad',
        'version': '1.0.0',
        'reporting': {
            'email': 'security@DobackSoft.com',
            'pgp_key': '-----BEGIN PGP PUBLIC KEY BLOCK-----',
            'response_time': '48 hours'
        },
        'vulnerabilities': {
            'severity_levels': [
                {
                    'level': 'critical',
                    'description': 'Vulnerabilidad crítica',
                    'response_time': '24 hours'
                },
                {
                    'level': 'high',
                    'description': 'Vulnerabilidad alta',
                    'response_time': '48 hours'
                }
            ],
            'scope': [
                'DobackSoft.com',
                'api.DobackSoft.com'
            ]
        },
        'rewards': {
            'enabled': True,
            'amounts': [
                {
                    'severity': 'critical',
                    'amount': '$1000'
                },
                {
                    'severity': 'high',
                    'amount': '$500'
                }
            ]
        },
        'disclosure': {
            'timeline': '90 days',
            'process': [
                'Reporte inicial',
                'Confirmación',
                'Investigación',
                'Resolución',
                'Disclosure público'
            ]
        }
    }
    
    success, messages = validate_security_policy(policy)
    assert success
    assert "Política de seguridad válida" in messages[0]

def test_validate_security_policy_missing_reporting():
    """Test para validar política de seguridad sin información de reporte"""
    policy = {
        'title': 'Política de Seguridad',
        'version': '1.0.0'
        # Falta reporting, vulnerabilities, etc.
    }
    
    success, messages = validate_security_policy(policy)
    assert not success
    assert "Información de reporte faltante" in messages[0] 