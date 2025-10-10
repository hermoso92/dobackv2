"""
Configuración para el entorno de pruebas.
"""

import os
from datetime import timedelta

class TestingConfig:
    # Configuración básica
    DEBUG = True
    TESTING = True
    SECRET_KEY = 'test-secret-key'
    
    # Base de datos
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Redis
    REDIS_URL = 'redis://localhost:6379/1'  # Base de datos 1 para pruebas
    
    # JWT
    JWT_SECRET_KEY = 'test-jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=1)
    
    # CORS
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:8000']
    
    # Logging
    LOG_LEVEL = 'DEBUG'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Archivos
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tests', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    
    # Celery
    CELERY_BROKER_URL = 'redis://localhost:6379/1'
    CELERY_RESULT_BACKEND = 'redis://localhost:6379/1'
    
    # Email
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'test@example.com'
    MAIL_PASSWORD = 'test-password'
    MAIL_DEFAULT_SENDER = 'test@example.com'
    
    # Monitoreo
    PROMETHEUS_METRICS = False
    
    # Seguridad
    SESSION_COOKIE_SECURE = False
    REMEMBER_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "1000 per day;100 per hour"
    RATELIMIT_STORAGE_URL = 'redis://localhost:6379/1'
    
    # Cache
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300
    
    # AWS
    AWS_ACCESS_KEY_ID = 'test'
    AWS_SECRET_ACCESS_KEY = 'test'
    AWS_REGION = 'us-east-1'
    S3_BUCKET = 'test-bucket'
    
    # Backup
    BACKUP_ENABLED = False
    
    # Performance
    WORKERS = 1
    THREADS = 1
    TIMEOUT = 30 