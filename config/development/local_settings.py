"""
Configuración local de DobackSoft V2.
Este archivo almacena todas las configuraciones del sistema para evitar verificaciones repetitivas.
"""

# Configuración de Python
PYTHON_VERSION = "3.9.13"
PYTHON_PATH = r"C:\Users\Cosigein SL\AppData\Local\Programs\Python\Python39"

# Configuración de PostgreSQL
POSTGRES_VERSION = "17.4"
POSTGRES_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "cosigein",
    "database": "DobackSoft"
}

# Configuración de la aplicación
APP_CONFIG = {
    "debug": True,
    "host": "localhost",
    "port": 5000,
    "secret_key": "DobackSoft-secret-key-2024"
}

# Configuración de rutas
PATHS = {
    "project_root": r"C:\Users\Cosigein SL\Desktop\DobackSoft-V2-Organized",
    "logs": r"C:\Users\Cosigein SL\Desktop\DobackSoft-V2-Organized\logs",
    "data": r"C:\Users\Cosigein SL\Desktop\DobackSoft-V2-Organized\data"
}

# Configuración de usuarios por defecto
DEFAULT_USERS = {
    "admin": {
        "username": "admin",
        "password": "admin123",
        "email": "admin@DobackSoft.com",
        "role": "admin"
    }
}

# Configuración de la base de datos
DATABASE_CONFIG = {
    "SQLALCHEMY_DATABASE_URI": f"postgresql://{POSTGRES_CONFIG['user']}:{POSTGRES_CONFIG['password']}@{POSTGRES_CONFIG['host']}:{POSTGRES_CONFIG['port']}/{POSTGRES_CONFIG['database']}",
    "SQLALCHEMY_TRACK_MODIFICATIONS": False
}

# Configuración de logging
LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": "DobackSoft.log"
}

# Configuración de verificación
VERIFICATION_CONFIG = {
    "check_interval": 3600,  # 1 hora
    "max_retries": 3,
    "timeout": 30
} 