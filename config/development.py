"""
Configuración de desarrollo.
"""

import os
from pathlib import Path
from .config import Config

class DevelopmentConfig(Config):
    """Configuración para desarrollo."""
    
    DEBUG = True
    TESTING = False
    
    # Configuración de base de datos
    root_dir = Path(__file__).parent.parent
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        f'sqlite:///{root_dir}/database/DobackSoft_dev.db'
    
    # Configuración de correo
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')
    
    # Configuración de CORS
    CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']
    
    # Configuración de procesamiento
    PROCESSING_BATCH_SIZE = 1000
    INTERPOLATION_FREQUENCY = 1  # Hz
    
    # Configuración de alarmas
    ALARM_CHECK_INTERVAL = 60  # segundos
    ALARM_NOTIFICATION_ENABLED = True
    
    # Flask-Limiter
    RATELIMIT_STORAGE_URI = 'memory://'
    RATELIMIT_STRATEGY = 'fixed-window'
    
    # Logging
    LOG_LEVEL = 'DEBUG'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S' 