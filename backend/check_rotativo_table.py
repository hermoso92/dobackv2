#!/usr/bin/env python3
"""
Script para verificar si la tabla RotativoMeasurement existe en la base de datos.
"""

import os
import psycopg2
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_rotativo_table():
    """Verifica si la tabla RotativoMeasurement existe."""
    
    # Configuración de la base de datos
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'dobacksoft'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'postgres'),
    }
    
    try:
        logger.info("🔍 Verificando tabla RotativoMeasurement...")
        
        # Conectar a la base de datos
        conn = psycopg2.connect(**db_config)
        cur = conn.cursor()
        
        # Verificar si la tabla existe
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'RotativoMeasurement'
            );
        """)
        
        table_exists = cur.fetchone()[0]
        
        if table_exists:
            logger.info("✅ Tabla RotativoMeasurement EXISTE")
            
            # Verificar estructura de la tabla
            cur.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'RotativoMeasurement'
                ORDER BY ordinal_position;
            """)
            
            columns = cur.fetchall()
            logger.info("📋 Estructura de la tabla:")
            for col in columns:
                logger.info(f"   - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
            
            # Verificar relación con Session
            cur.execute("""
                SELECT 
                    tc.table_name, 
                    kcu.column_name, 
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name 
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                  AND tc.table_name='RotativoMeasurement';
            """)
            
            foreign_keys = cur.fetchall()
            logger.info("🔗 Relaciones de la tabla:")
            for fk in foreign_keys:
                logger.info(f"   - {fk[1]} -> {fk[2]}.{fk[3]}")
            
        else:
            logger.error("❌ Tabla RotativoMeasurement NO EXISTE")
            logger.info("💡 Posibles causas:")
            logger.info("   - La migración no se aplicó correctamente")
            logger.info("   - El schema no se sincronizó")
            logger.info("   - Error en la configuración de la BD")
            
            # Verificar qué tablas existen
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            
            existing_tables = [row[0] for row in cur.fetchall()]
            logger.info("📋 Tablas existentes en la BD:")
            for table in existing_tables:
                logger.info(f"   - {table}")
        
        cur.close()
        conn.close()
        
        return table_exists
        
    except Exception as e:
        logger.error(f"💥 Error verificando tabla: {e}")
        return False

def main():
    """Función principal."""
    logger.info("🚀 Verificando estado de la tabla RotativoMeasurement...")
    
    exists = check_rotativo_table()
    
    if exists:
        logger.info("\n🎉 RESULTADO: Tabla RotativoMeasurement está lista para usar")
        logger.info("💡 Próximos pasos:")
        logger.info("   1. Ejecutar el procesador con archivos ROTATIVO reales")
        logger.info("   2. Verificar que los datos se insertan correctamente")
        logger.info("   3. Validar que el dashboard puede mostrar los datos")
    else:
        logger.error("\n💥 RESULTADO: Tabla RotativoMeasurement NO está disponible")
        logger.info("💡 Acciones recomendadas:")
        logger.info("   1. Verificar que la migración se completó")
        logger.info("   2. Revisar logs de Prisma")
        logger.info("   3. Ejecutar 'npx prisma db push' manualmente")

if __name__ == "__main__":
    main() 