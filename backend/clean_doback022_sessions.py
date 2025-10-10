#!/usr/bin/env python3
"""
Script para limpiar sesiones de DOBACK022 en 2025-07-08
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_doback022_sessions():
    """Limpia las sesiones de DOBACK022 en 2025-07-08"""
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            database="dobacksoft",
            user="postgres",
            password="cosigein",
            client_encoding='utf8'
        )
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Buscar el vehículo DOBACK022
            cur.execute("""
                SELECT id FROM "Vehicle" 
                WHERE name = 'DOBACK022'
            """)
            vehicle_result = cur.fetchone()
            
            if not vehicle_result:
                logger.error("No se encontró el vehículo DOBACK022")
                return False
            
            vehicle_id = vehicle_result['id']
            logger.info(f"Vehículo DOBACK022 encontrado: {vehicle_id}")
            
            # Buscar sesiones de DOBACK022 en 2025-07-08
            cur.execute("""
                SELECT id, "sessionNumber", "startTime", "endTime"
                FROM "Session"
                WHERE "vehicleId" = %s 
                AND DATE("startTime") = DATE('2025-07-08')
                ORDER BY "sessionNumber"
            """, (vehicle_id,))
            
            sessions = cur.fetchall()
            logger.info(f"Encontradas {len(sessions)} sesiones de DOBACK022 en 2025-07-08")
            
            if not sessions:
                logger.info("No hay sesiones para limpiar")
                return True
            
            # Mostrar sesiones que se van a eliminar
            for session in sessions:
                logger.info(f"Sesión a eliminar: {session['id']} - Número: {session['sessionNumber']} - Inicio: {session['startTime']}")
            
            # Eliminar mediciones asociadas primero
            for session in sessions:
                cur.execute("""
                    DELETE FROM "StabilityMeasurement"
                    WHERE "sessionId" = %s
                """, (session['id'],))
                logger.info(f"Eliminadas mediciones de sesión {session['id']}")
            
            # Eliminar sesiones
            cur.execute("""
                DELETE FROM "Session"
                WHERE "vehicleId" = %s 
                AND DATE("startTime") = DATE('2025-07-08')
            """, (vehicle_id,))
            
            deleted_count = cur.rowcount
            logger.info(f"Eliminadas {deleted_count} sesiones de DOBACK022 en 2025-07-08")
            
            # Confirmar cambios
            conn.commit()
            
            logger.info("Limpieza completada exitosamente")
            return True
            
    except Exception as e:
        logger.error(f"Error limpiando sesiones: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
        return False
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    print("Limpiando sesiones de DOBACK022 en 2025-07-08...")
    success = clean_doback022_sessions()
    if success:
        print("✅ Limpieza completada exitosamente")
    else:
        print("❌ Error en la limpieza") 