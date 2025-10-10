import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import sys

def clean_duplicate_sessions():
    """Limpiar sesiones duplicadas para permitir reprocesamiento"""
    
    # Configurar logging a archivo
    log_file = f"cleanup_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    
    def log(message):
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"{message}\n")
        print(message)  # También mostrar en pantalla
    
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(
            host='localhost',
            database='dobacksoft',
            user='postgres',
            password='cosigein',
            cursor_factory=RealDictCursor
        )
        
        cur = conn.cursor()
        
        log("=== LIMPIEZA DE SESIONES DUPLICADAS ===")
        log(f"Log guardado en: {log_file}")
        log("")
        
        # 1. Mostrar sesiones existentes antes de limpiar
        cur.execute("""
            SELECT s.id, s."startTime", s."endTime", 
                   o.name as empresa, v.name as vehiculo,
                   COUNT(sm.id) as mediciones_estabilidad,
                   COUNT(cm.id) as mediciones_can,
                   COUNT(gm.id) as mediciones_gps
            FROM "Session" s
            JOIN "Organization" o ON s."organizationId" = o.id
            JOIN "Vehicle" v ON s."vehicleId" = v.id
            LEFT JOIN "StabilityMeasurement" sm ON s.id = sm."sessionId"
            LEFT JOIN "CanMeasurement" cm ON s.id = cm."sessionId"
            LEFT JOIN "GpsMeasurement" gm ON s.id = gm."sessionId"
            GROUP BY s.id, s."startTime", s."endTime", o.name, v.name
            ORDER BY s."createdAt" DESC
        """)
        
        sessions = cur.fetchall()
        
        log(f"📊 Sesiones existentes antes de limpiar: {len(sessions)}")
        for session in sessions:
            log(f"   - {session['empresa']}/{session['vehiculo']} - {session['startTime']}")
            log(f"     Mediciones: Estabilidad={session['mediciones_estabilidad']}, CAN={session['mediciones_can']}, GPS={session['mediciones_gps']}")
        
        # 2. Identificar sesiones duplicadas por clave única
        cur.execute("""
            SELECT "vehicleId", "startTime", "sessionNumber", COUNT(*) as count
            FROM "Session"
            GROUP BY "vehicleId", "startTime", "sessionNumber"
            HAVING COUNT(*) > 1
            ORDER BY "startTime" DESC
        """)
        
        duplicates = cur.fetchall()
        
        if duplicates:
            log(f"\n⚠️ Sesiones duplicadas encontradas: {len(duplicates)}")
            for dup in duplicates:
                log(f"   - Vehículo: {dup['vehicleId']}, Fecha: {dup['startTime']}, Sesión: {dup['sessionNumber']} (Count: {dup['count']})")
            
            # 3. Eliminar mediciones de sesiones duplicadas
            log(f"\n🧹 Eliminando mediciones de sesiones duplicadas...")
            
            deleted_sessions = 0
            deleted_stability = 0
            deleted_can = 0
            deleted_gps = 0
            
            for dup in duplicates:
                # Obtener IDs de sesiones duplicadas (mantener la más reciente)
                cur.execute("""
                    SELECT id FROM "Session"
                    WHERE "vehicleId" = %s AND "startTime" = %s AND "sessionNumber" = %s
                    ORDER BY "createdAt" DESC
                """, (dup['vehicleId'], dup['startTime'], dup['sessionNumber']))
                
                session_ids = [row['id'] for row in cur.fetchall()]
                
                # Mantener la primera (más reciente) y eliminar las demás
                sessions_to_delete = session_ids[1:]
                
                for session_id in sessions_to_delete:
                    # Contar mediciones antes de eliminar
                    cur.execute('SELECT COUNT(*) as count FROM "StabilityMeasurement" WHERE "sessionId" = %s', (session_id,))
                    stability_count = cur.fetchone()['count']
                    
                    cur.execute('SELECT COUNT(*) as count FROM "CanMeasurement" WHERE "sessionId" = %s', (session_id,))
                    can_count = cur.fetchone()['count']
                    
                    cur.execute('SELECT COUNT(*) as count FROM "GpsMeasurement" WHERE "sessionId" = %s', (session_id,))
                    gps_count = cur.fetchone()['count']
                    
                    # Eliminar mediciones asociadas
                    cur.execute('DELETE FROM "StabilityMeasurement" WHERE "sessionId" = %s', (session_id,))
                    cur.execute('DELETE FROM "CanMeasurement" WHERE "sessionId" = %s', (session_id,))
                    cur.execute('DELETE FROM "GpsMeasurement" WHERE "sessionId" = %s', (session_id,))
                    
                    # Eliminar la sesión
                    cur.execute('DELETE FROM "Session" WHERE id = %s', (session_id,))
                    
                    deleted_sessions += 1
                    deleted_stability += stability_count
                    deleted_can += can_count
                    deleted_gps += gps_count
                    
                    log(f"     ✅ Eliminada sesión: {session_id[:8]}... (Estabilidad: {stability_count}, CAN: {can_count}, GPS: {gps_count})")
            
            conn.commit()
            log(f"\n✅ Limpieza completada:")
            log(f"   - Sesiones eliminadas: {deleted_sessions}")
            log(f"   - Mediciones de estabilidad eliminadas: {deleted_stability}")
            log(f"   - Mediciones CAN eliminadas: {deleted_can}")
            log(f"   - Mediciones GPS eliminadas: {deleted_gps}")
            
        else:
            log(f"\n✅ No se encontraron sesiones duplicadas")
        
        # 4. Mostrar estado final
        cur.execute("""
            SELECT COUNT(*) as total_sessions FROM "Session"
        """)
        total_sessions = cur.fetchone()['total_sessions']
        
        cur.execute("""
            SELECT COUNT(*) as total_stability FROM "StabilityMeasurement"
        """)
        total_stability = cur.fetchone()['total_stability']
        
        cur.execute("""
            SELECT COUNT(*) as total_can FROM "CanMeasurement"
        """)
        total_can = cur.fetchone()['total_can']
        
        cur.execute("""
            SELECT COUNT(*) as total_gps FROM "GpsMeasurement"
        """)
        total_gps = cur.fetchone()['total_gps']
        
        log(f"\n📊 ESTADO FINAL:")
        log(f"   - Sesiones: {total_sessions}")
        log(f"   - Mediciones de estabilidad: {total_stability}")
        log(f"   - Mediciones CAN: {total_can}")
        log(f"   - Mediciones GPS: {total_gps}")
        
        log(f"\n✅ Proceso completado. Log guardado en: {log_file}")
        
        conn.close()
        
    except Exception as e:
        error_msg = f"❌ Error durante la limpieza: {e}"
        log(error_msg)
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    clean_duplicate_sessions() 