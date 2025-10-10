"""
Configuración para ambiente de desarrollo.
"""
from pathlib import Path

# Directorio base
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Configuración de la aplicación
DEBUG = True
TESTING = False
SECRET_KEY = "dev-secret-key-change-in-prod"

# Base de datos
SQLALCHEMY_DATABASE_URI = f"sqlite:///{BASE_DIR}/instance/DobackSoft.db"
SQLALCHEMY_TRACK_MODIFICATIONS = True

# Logging
LOG_LEVEL = "DEBUG"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_DIR = BASE_DIR / "logs"

# Telemetría
TELEMETRY_BATCH_SIZE = 1000
TELEMETRY_PROCESS_INTERVAL = 60

# Estabilidad
STABILITY_ALERT_THRESHOLD = 0.75
STABILITY_WARNING_THRESHOLD = 0.5

# Cache
CACHE_TYPE = "simple"
CACHE_DEFAULT_TIMEOUT = 300

# Servidor
HOST = "0.0.0.0"
PORT = 5000
WORKERS = 1

# Seguridad
CORS_ORIGINS = "*"
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = True
REMEMBER_COOKIE_SECURE = False
REMEMBER_COOKIE_HTTPONLY = True

# Email
MAIL_SERVER = "localhost"
MAIL_PORT = 1025
MAIL_USE_TLS = False
MAIL_USERNAME = None
MAIL_PASSWORD = None
MAIL_DEFAULT_SENDER = "noreply@DobackSoft.com" 