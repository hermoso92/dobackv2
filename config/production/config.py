"""
Configuración para ambiente de producción.
"""
from pathlib import Path

# Directorio base
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Configuración de la aplicación
DEBUG = False
TESTING = False
SECRET_KEY = None  # Debe ser configurado en .env

# Base de datos
SQLALCHEMY_DATABASE_URI = None  # Debe ser configurado en .env
SQLALCHEMY_TRACK_MODIFICATIONS = False

# Logging
LOG_LEVEL = "WARNING"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_DIR = BASE_DIR / "logs"

# Telemetría
TELEMETRY_BATCH_SIZE = 5000
TELEMETRY_PROCESS_INTERVAL = 30

# Estabilidad
STABILITY_ALERT_THRESHOLD = 0.75
STABILITY_WARNING_THRESHOLD = 0.5

# Cache
CACHE_TYPE = "redis"
CACHE_DEFAULT_TIMEOUT = 600

# Servidor
HOST = "0.0.0.0"
PORT = 8000
WORKERS = 4

# Seguridad
CORS_ORIGINS = None  # Debe ser configurado en .env
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
REMEMBER_COOKIE_SECURE = True
REMEMBER_COOKIE_HTTPONLY = True

# Email
MAIL_SERVER = None  # Debe ser configurado en .env
MAIL_PORT = 587
MAIL_USE_TLS = True
MAIL_USERNAME = None  # Debe ser configurado en .env
MAIL_PASSWORD = None  # Debe ser configurado en .env
MAIL_DEFAULT_SENDER = None  # Debe ser configurado en .env 