#!/usr/bin/env python3
"""
Script de debug para verificar sesiones en la base de datos
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_sessions():
    """Verificar sesiones existentes en la base de datos"""
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            database="dobacksoft",
            user="postgres",
            password="postgres",
            client_encoding='utf8'
        )
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verificar sesiones existentes para DOBACK022
            cur.execute("""
                SELECT id, "vehicleId", "startTime", "sessionNumber", "createdAt"
                FROM "Session"
                WHERE "vehicleId" = 'f762a308-c41e-45f1-925d-be78b06733b5'
                ORDER BY "startTime", "sessionNumber"
            """)
            
            sessions = cur.fetchall()
            logger.info(f"Encontradas {len(sessions)} sesiones para DOBACK022:")
            
            for session in sessions:
                logger.info(f"  ID: {session['id']}")
                logger.info(f"  StartTime: {session['startTime']}")
                logger.info(f"  SessionNumber: {session['sessionNumber']}")
                logger.info(f"  CreatedAt: {session['createdAt']}")
                logger.info("  ---")
            
            # Verificar sesiones por fecha
            cur.execute("""
                SELECT DATE("startTime") as fecha, COUNT(*) as total, 
                       MAX("sessionNumber") as max_session
                FROM "Session"
                WHERE "vehicleId" = 'f762a308-c41e-45f1-925d-be78b06733b5'
                GROUP BY DATE("startTime")
                ORDER BY fecha
            """)
            
            dates = cur.fetchall()
            logger.info("Resumen por fecha:")
            for date_info in dates:
                logger.info(f"  {date_info['fecha']}: {date_info['total']} sesiones, max sessionNumber: {date_info['max_session']}")
        
        conn.close()
        
    except Exception as e:
        logger.error(f"Error verificando sesiones: {e}")

def fix_session_numbers():
    """Corregir números de sesión duplicados"""
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            database="dobacksoft",
            user="postgres",
            password="postgres",
            client_encoding='utf8'
        )
        
        with conn.cursor() as cur:
            # Obtener todas las sesiones de DOBACK022 ordenadas por fecha y hora
            cur.execute("""
                SELECT id, "startTime", "sessionNumber"
                FROM "Session"
                WHERE "vehicleId" = 'f762a308-c41e-45f1-925d-be78b06733b5'
                ORDER BY "startTime", "createdAt"
            """)
            
            sessions = cur.fetchall()
            logger.info(f"Reordenando {len(sessions)} sesiones...")
            
            # Reasignar números de sesión secuencialmente
            current_date = None
            current_number = 1
            
            for session in sessions:
                session_date = session[1].date()
                
                if current_date != session_date:
                    current_date = session_date
                    current_number = 1
                else:
                    current_number += 1
                
                # Actualizar el número de sesión
                cur.execute("""
                    UPDATE "Session"
                    SET "sessionNumber" = %s
                    WHERE id = %s
                """, (current_number, session[0]))
                
                logger.info(f"  Sesión {session[0]}: fecha {session_date}, nuevo número {current_number}")
            
            conn.commit()
            logger.info("Números de sesión corregidos exitosamente")
        
        conn.close()
        
    except Exception as e:
        logger.error(f"Error corrigiendo números de sesión: {e}")

if __name__ == "__main__":
    logger.info("=== Verificando sesiones existentes ===")
    check_sessions()
    
    logger.info("\n=== Corrigiendo números de sesión ===")
    fix_session_numbers()
    
    logger.info("\n=== Verificando después de la corrección ===")
    check_sessions() 