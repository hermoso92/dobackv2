#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para procesar eventos de estabilidad directamente desde la base de datos.
"""

import psycopg2
import json
import logging
from datetime import datetime
from typing import List, Dict, Any

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuración de base de datos
DB_CONFIG = {
    'host': 'localhost',
    'database': 'dobacksoft',
    'user': 'postgres',
    'password': 'cosigein'
}

def get_sessions(conn):
    """Obtiene todas las sesiones de la base de datos."""
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT s.id, s."startTime", s."endTime", v.name as vehicle_name
            FROM "Session" s
            JOIN "Vehicle" v ON s."vehicleId" = v.id
            ORDER BY s."startTime" DESC
        """)
        sessions = []
        for row in cur.fetchall():
            sessions.append({
                'id': row[0],
                'startTime': row[1],
                'endTime': row[2],
                'vehicle_name': row[3]
            })
        return sessions
    finally:
        cur.close()

def get_session_data(conn, session_id: str) -> Dict[str, List]:
    """Obtiene todos los datos de una sesión."""
    cur = conn.cursor()
    try:
        # Obtener datos de estabilidad
        cur.execute("""
            SELECT timestamp, si, roll, pitch, ay, gz, accmag
            FROM "StabilityMeasurement"
            WHERE "sessionId" = %s
            ORDER BY timestamp ASC
        """, (session_id,))
        stability_data = []
        for row in cur.fetchall():
            stability_data.append({
                'timestamp': row[0].isoformat(),
                'si': float(row[1]) if row[1] is not None else 0,
                'roll': float(row[2]) if row[2] is not None else 0,
                'pitch': float(row[3]) if row[3] is not None else 0,
                'ay': float(row[4]) if row[4] is not None else 0,
                'gz': float(row[5]) if row[5] is not None else 0,
                'accmag': float(row[6]) if row[6] is not None else 0
            })
        
        # Obtener datos GPS
        cur.execute("""
            SELECT timestamp, latitude, longitude, speed
            FROM "GPSMeasurement"
            WHERE "sessionId" = %s
            ORDER BY timestamp ASC
        """, (session_id,))
        gps_data = []
        for row in cur.fetchall():
            gps_data.append({
                'timestamp': row[0].isoformat(),
                'latitude': float(row[1]) if row[1] is not None else 0,
                'longitude': float(row[2]) if row[2] is not None else 0,
                'speed': float(row[3]) if row[3] is not None else 0
            })
        
        # Obtener datos CAN
        cur.execute("""
            SELECT timestamp, "engineRpm", "vehicleSpeed"
            FROM "CANMeasurement"
            WHERE "sessionId" = %s
            ORDER BY timestamp ASC
        """, (session_id,))
        can_data = []
        for row in cur.fetchall():
            can_data.append({
                'timestamp': row[0].isoformat(),
                'engineRPM': float(row[1]) if row[1] is not None else 0,
                'vehicleSpeed': float(row[2]) if row[2] is not None else 0,
                'rotativo': float(row[1]) if row[1] is not None else 0 > 0
            })
        
        return {
            'stability': stability_data,
            'gps': gps_data,
            'can': can_data
        }
    finally:
        cur.close()

def check_existing_events(conn, session_id: str) -> bool:
    """Verifica si ya existen eventos para esta sesión."""
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT COUNT(*) FROM stability_events WHERE session_id = %s
        """, (session_id,))
        count = cur.fetchone()[0]
        return count > 0
    finally:
        cur.close()

def generate_stability_events(stability_data: List[Dict], gps_data: List[Dict], can_data: List[Dict], session_id: str) -> List[Dict]:
    """Genera eventos de estabilidad basados en los datos."""
    events = []
    
    if not stability_data or not gps_data:
        logger.warning(f"Sesión {session_id}: Datos insuficientes para generar eventos")
        return events
    
    # Crear mapas para acceso rápido
    gps_map = {point['timestamp']: point for point in gps_data}
    can_map = {point['timestamp']: point for point in can_data}
    
    # Procesar solo puntos críticos (SI < 50%)
    critical_points = [p for p in stability_data if p['si'] < 0.5]
    
    logger.info(f"Sesión {session_id}: {len(critical_points)} puntos críticos de {len(stability_data)} total")
    
    for point in critical_points:
        # Clasificar nivel de riesgo
        si = point['si']
        if si < 0.1:
            level = 'critico'
        elif si < 0.3:
            level = 'peligroso'
        else:
            level = 'moderado'
        
        # Buscar datos GPS más cercanos
        gps = gps_map.get(point['timestamp'])
        if not gps:
            # Buscar el más cercano temporalmente
            target_time = datetime.fromisoformat(point['timestamp'].replace('Z', '+00:00'))
            closest_gps = None
            min_diff = float('inf')
            for gps_point in gps_data:
                gps_time = datetime.fromisoformat(gps_point['timestamp'].replace('Z', '+00:00'))
                diff = abs((target_time - gps_time).total_seconds())
                if diff < min_diff and diff < 5:  # 5 segundos máximo
                    min_diff = diff
                    closest_gps = gps_point
            gps = closest_gps
        
        if not gps:
            continue
        
        # Buscar datos CAN más cercanos
        can = can_map.get(point['timestamp'])
        if not can:
            target_time = datetime.fromisoformat(point['timestamp'].replace('Z', '+00:00'))
            closest_can = None
            min_diff = float('inf')
            for can_point in can_data:
                can_time = datetime.fromisoformat(can_point['timestamp'].replace('Z', '+00:00'))
                diff = abs((target_time - can_time).total_seconds())
                if diff < min_diff and diff < 5:
                    min_diff = diff
                    closest_can = can_point
            can = closest_can
        
        # Filtros de contexto
        if not can or can['engineRPM'] == 0 or not can['rotativo'] or gps['speed'] < 5:
            continue
        
        # Detectar causa del evento
        tipos = []
        if abs(point['roll']) > 5:
            tipos.append('pendiente_lateral')
        if abs(point['ay']) > 1.5:
            tipos.append('curva_brusca')
        if abs(point['gz']) > 15:
            tipos.append('maniobra_brusca')
        
        if not tipos:
            tipos.append('sin_causa_clara')
        
        # Crear evento
        event = {
            'session_id': session_id,
            'timestamp': point['timestamp'],
            'lat': gps['latitude'],
            'lon': gps['longitude'],
            'type': ','.join(tipos),
            'details': json.dumps({
                'level': level,
                'perc': int(si * 100),
                'tipos': tipos,
                'valores': {
                    'si': point['si'],
                    'roll': point['roll'],
                    'ay': point['ay'],
                    'yaw': point['gz']
                },
                'can': {
                    'engineRPM': can['engineRPM'],
                    'vehicleSpeed': can['vehicleSpeed'],
                    'rotativo': can['rotativo']
                }
            })
        }
        events.append(event)
    
    return events

def save_events(conn, events: List[Dict]):
    """Guarda los eventos en la base de datos."""
    if not events:
        return 0
    
    cur = conn.cursor()
    try:
        # Crear tabla si no existe
        cur.execute("""
            CREATE TABLE IF NOT EXISTS stability_events (
                id SERIAL PRIMARY KEY,
                session_id UUID NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                lat DOUBLE PRECISION,
                lon DOUBLE PRECISION,
                type TEXT,
                details JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insertar eventos
        for event in events:
            cur.execute("""
                INSERT INTO stability_events (session_id, timestamp, lat, lon, type, details)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                event['session_id'],
                event['timestamp'],
                event['lat'],
                event['lon'],
                event['type'],
                event['details']
            ))
        
        conn.commit()
        return len(events)
    except Exception as e:
        conn.rollback()
        logger.error(f"Error guardando eventos: {e}")
        return 0
    finally:
        cur.close()

def main():
    """Función principal."""
    logger.info("🚀 Iniciando procesamiento directo de eventos de estabilidad...")
    
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(**DB_CONFIG)
        logger.info("✅ Conectado a la base de datos")
        
        # Obtener todas las sesiones
        sessions = get_sessions(conn)
        logger.info(f"📊 Encontradas {len(sessions)} sesiones")
        
        total_events = 0
        processed_sessions = 0
        skipped_sessions = 0
        
        for i, session in enumerate(sessions, 1):
            session_id = session['id']
            vehicle_name = session['vehicle_name']
            start_time = session['startTime']
            
            logger.info(f"🔄 Procesando sesión {i}/{len(sessions)}: {vehicle_name} - {start_time}")
            
            # Verificar si ya existen eventos
            if check_existing_events(conn, session_id):
                logger.info(f"⏭️  Sesión {session_id}: Ya tiene eventos, saltando")
                skipped_sessions += 1
                continue
            
            # Obtener datos de la sesión
            session_data = get_session_data(conn, session_id)
            
            # Generar eventos
            events = generate_stability_events(
                session_data['stability'],
                session_data['gps'],
                session_data['can'],
                session_id
            )
            
            # Guardar eventos
            if events:
                saved_count = save_events(conn, events)
                logger.info(f"✅ Sesión {session_id}: {saved_count} eventos guardados")
                total_events += saved_count
                processed_sessions += 1
            else:
                logger.info(f"ℹ️  Sesión {session_id}: No se generaron eventos")
                processed_sessions += 1
        
        # Resumen final
        logger.info("=" * 60)
        logger.info("📋 RESUMEN DEL PROCESAMIENTO")
        logger.info("=" * 60)
        logger.info(f"✅ Sesiones procesadas: {processed_sessions}")
        logger.info(f"⏭️  Sesiones saltadas (ya tenían eventos): {skipped_sessions}")
        logger.info(f"📊 Total de eventos generados: {total_events}")
        logger.info(f"📈 Promedio de eventos por sesión: {total_events / processed_sessions if processed_sessions > 0 else 0:.1f}")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"❌ Error en el procesamiento: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main() 