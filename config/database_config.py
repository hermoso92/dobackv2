"""
Configuración centralizada para la base de datos PostgreSQL.
"""

# Configuración de la base de datos
DB_CONFIG = {
    'dbname': 'DobackSoft_v2_new',
    'user': 'postgres',
    'password': 'cosigein',  # Contraseña del usuario postgres
    'host': 'localhost',
    'port': '5432'
}

# URI de conexión para SQLAlchemy
SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}"

# Configuración de conexión para psycopg2
def get_connection_params():
    """Retorna los parámetros de conexión para psycopg2"""
    return DB_CONFIG.copy() 