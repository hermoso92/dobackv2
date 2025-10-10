#!/usr/bin/env python3
"""
Script para crear la tabla RotativoMeasurement manualmente.
Se usa cuando la migración de Prisma falla.
"""

import os
import psycopg2
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_rotativo_table():
    """Crea la tabla RotativoMeasurement manualmente."""
    
    # Configuración de la base de datos
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'dobacksoft'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'cosigein'),
    }
    
    # SQL para crear la tabla
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS "RotativoMeasurement" (
        id TEXT PRIMARY KEY,
        "sessionId" TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        state TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    # SQL para crear índices
    create_indexes_sql = """
    CREATE INDEX IF NOT EXISTS "RotativoMeasurement_sessionId_idx" ON "RotativoMeasurement"("sessionId");
    CREATE INDEX IF NOT EXISTS "RotativoMeasurement_timestamp_idx" ON "RotativoMeasurement"(timestamp);
    """
    
    # SQL para agregar foreign key
    add_foreign_key_sql = """
    ALTER TABLE "RotativoMeasurement" 
    ADD CONSTRAINT "RotativoMeasurement_sessionId_fkey" 
    FOREIGN KEY ("sessionId") REFERENCES "Session"(id) ON DELETE CASCADE;
    """
    
    try:
        logger.info("🔧 Creando tabla RotativoMeasurement manualmente...")
        
        # Conectar a la base de datos
        conn = psycopg2.connect(**db_config)
        conn.autocommit = True  # Para DDL statements
        cur = conn.cursor()
        
        # Verificar si la tabla ya existe
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'RotativoMeasurement'
            );
        """)
        
        table_exists = cur.fetchone()[0]
        
        if table_exists:
            logger.info("ℹ️ La tabla RotativoMeasurement ya existe")
        else:
            # Crear la tabla
            logger.info("📋 Creando tabla...")
            cur.execute(create_table_sql)
            logger.info("✅ Tabla creada")
            
            # Crear índices
            logger.info("📊 Creando índices...")
            cur.execute(create_indexes_sql)
            logger.info("✅ Índices creados")
            
            # Agregar foreign key
            logger.info("🔗 Agregando foreign key...")
            try:
                cur.execute(add_foreign_key_sql)
                logger.info("✅ Foreign key agregado")
            except Exception as e:
                logger.warning(f"⚠️ No se pudo agregar foreign key: {e}")
        
        # Verificar la estructura final
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'RotativoMeasurement'
            ORDER BY ordinal_position;
        """)
        
        columns = cur.fetchall()
        logger.info("📋 Estructura final de la tabla:")
        for col in columns:
            logger.info(f"   - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
        
        # Verificar que la tabla está vacía
        cur.execute("SELECT COUNT(*) FROM \"RotativoMeasurement\";")
        count = cur.fetchone()[0]
        logger.info(f"📊 Registros en la tabla: {count}")
        
        cur.close()
        conn.close()
        
        logger.info("🎉 Tabla RotativoMeasurement creada exitosamente")
        return True
        
    except Exception as e:
        logger.error(f"💥 Error creando tabla: {e}")
        return False

def test_rotativo_insertion():
    """Test de inserción de datos ROTATIVO."""
    logger.info("🧪 Probando inserción de datos ROTATIVO...")
    
    # Configuración de la base de datos
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'dobacksoft'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'postgres'),
    }
    
    try:
        conn = psycopg2.connect(**db_config)
        cur = conn.cursor()
        
        # Insertar un registro de prueba
        test_data = {
            'id': 'test-rotativo-001',
            'sessionId': 'test-session-001',
            'timestamp': '2024-01-15 08:00:00',
            'state': 'ON'
        }
        
        cur.execute("""
            INSERT INTO "RotativoMeasurement" (id, "sessionId", timestamp, state)
            VALUES (%s, %s, %s, %s)
        """, (test_data['id'], test_data['sessionId'], test_data['timestamp'], test_data['state']))
        
        # Verificar que se insertó
        cur.execute("SELECT COUNT(*) FROM \"RotativoMeasurement\" WHERE id = %s;", (test_data['id'],))
        count = cur.fetchone()[0]
        
        if count > 0:
            logger.info("✅ Inserción de prueba exitosa")
            
            # Limpiar datos de prueba
            cur.execute("DELETE FROM \"RotativoMeasurement\" WHERE id = %s;", (test_data['id'],))
            logger.info("🧹 Datos de prueba eliminados")
        else:
            logger.error("❌ La inserción de prueba falló")
        
        conn.commit()
        cur.close()
        conn.close()
        
        return True
        
    except Exception as e:
        logger.error(f"💥 Error en test de inserción: {e}")
        return False

def main():
    """Función principal."""
    logger.info("🚀 Creando tabla RotativoMeasurement...")
    
    # Crear la tabla
    success = create_rotativo_table()
    
    if success:
        # Probar inserción
        test_success = test_rotativo_insertion()
        
        if test_success:
            logger.info("\n🎉 RESULTADO: Tabla RotativoMeasurement lista para usar")
            logger.info("💡 Próximos pasos:")
            logger.info("   1. Ejecutar el procesador con archivos ROTATIVO reales")
            logger.info("   2. Verificar que los datos se insertan correctamente")
            logger.info("   3. Validar que el dashboard puede mostrar los datos")
        else:
            logger.error("\n⚠️ RESULTADO: Tabla creada pero hay problemas con inserciones")
    else:
        logger.error("\n💥 RESULTADO: No se pudo crear la tabla")

if __name__ == "__main__":
    main() 