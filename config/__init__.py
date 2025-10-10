"""
Configuración de la aplicación.
"""

import os
from .development import DevelopmentConfig
from .production import ProductionConfig
from .testing import TestingConfig

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """
    Obtiene la configuración según el entorno.
    
    Returns:
        Config: Clase de configuración
    """
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default']) 