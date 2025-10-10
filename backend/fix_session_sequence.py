#!/usr/bin/env python3
"""
Script para arreglar la secuencia de IDs de la tabla Session
"""
import os
import sys
import logging
import psycopg2
from psycopg2.extras import RealDictCursor

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuración de base de datos (igual que en complete_processor_ultimo.py)
DB_CONFIG = {
    'host': 'localhost',
    'database': 'dobacksoft',
    'user': 'postgres',
    'password': 'cosigein',
    'port': 5432
}

def fix_session_sequence():
    """Arreglar la secuencia de IDs de la tabla Session"""
    try:
        # Crear conexión a la base de datos
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        logger.info("🔧 Iniciando reparación de secuencia de Session...")
        
        # Verificar si la tabla Session existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'Session'
            );
        """)
        
        if not cursor.fetchone()[0]:
            logger.error("❌ La tabla Session no existe")
            return False
        
        # Obtener el máximo ID actual
        cursor.execute("SELECT MAX(id) FROM \"Session\";")
        result = cursor.fetchone()
        max_id = result[0] if result[0] is not None else 0
        
        if max_id == 0:
            logger.info("📊 No hay sesiones en la tabla, iniciando desde 1")
        else:
            logger.info(f"📊 ID máximo actual: {max_id}")
        
        # Verificar si la secuencia existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.sequences 
                WHERE sequence_schema = 'public' 
                AND sequence_name = 'Session_id_seq'
            );
        """)
        
        sequence_exists = cursor.fetchone()[0]
        
        if not sequence_exists:
            logger.info("📊 La secuencia no existe, creándola...")
            cursor.execute("CREATE SEQUENCE \"Session_id_seq\" START WITH 1;")
            logger.info("✅ Secuencia creada")
        else:
            # Reiniciar la secuencia existente
            next_id = max_id + 1
            cursor.execute(f"ALTER SEQUENCE \"Session_id_seq\" RESTART WITH {next_id};")
            logger.info(f"✅ Secuencia reiniciada a: {next_id}")
        
        # Verificar que la secuencia funciona correctamente
        cursor.execute("SELECT nextval('\"Session_id_seq\"');")
        test_value = cursor.fetchone()[0]
        logger.info(f"✅ Prueba de secuencia: {test_value}")
        
        # Commit de los cambios
        conn.commit()
        
        logger.info("✅ Reparación completada exitosamente")
        return True
            
    except Exception as e:
        logger.error(f"❌ Error reparando secuencia: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    success = fix_session_sequence()
    if success:
        logger.info("🎉 Base de datos lista para procesar sesiones")
    else:
        logger.error("💥 Error en la reparación")
        sys.exit(1) 