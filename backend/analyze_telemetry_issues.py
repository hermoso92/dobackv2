#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Análisis de problemas de telemetría:
1. Filtros de coordenadas GPS (puntos en el océano)
2. Sesiones perdidas en la aplicación
3. Validación de datos
"""

import os
import sys
import psycopg2
from datetime import datetime
from typing import List, Dict, Tuple
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TelemetryAnalyzer:
    """Analizador de problemas de telemetría."""
    
    def __init__(self):
        # Configuración de base de datos
        self.db_config = {
            'host': 'localhost',
            'database': 'DobackSoft_v2_new',
            'user': 'postgres',
            'password': 'cosigein'
        }
        
        # Coordenadas de Madrid (área válida)
        self.MADRID_BOUNDS = {
            'min_lat': 40.0,   # Sur de Madrid
            'max_lat': 41.0,   # Norte de Madrid
            'min_lon': -4.0,   # Oeste de Madrid
            'max_lon': -3.0    # Este de Madrid
        }
        
    def connect_db(self):
        """Conectar a la base de datos."""
        try:
            return psycopg2.connect(**self.db_config)
        except Exception as e:
            logger.error(f"Error conectando a la base de datos: {e}")
            return None
    
    def analyze_gps_coordinates(self):
        """Analiza coordenadas GPS fuera del área válida."""
        logger.info("=" * 60)
        logger.info("ANÁLISIS DE COORDENADAS GPS")
        logger.info("=" * 60)
        
        conn = self.connect_db()
        if not conn:
            return
        
        try:
            cur = conn.cursor()
            
            # Buscar puntos GPS fuera del área de Madrid
            cur.execute("""
                SELECT 
                    gm.id,
                    gm.latitude,
                    gm.longitude,
                    gm.timestamp,
                    gm.speed,
                    gm.satellites,
                    gm.accuracy,
                    s."sessionNumber",
                    v.name as vehicle_name
                FROM "GpsMeasurement" gm
                JOIN "Session" s ON gm."sessionId" = s.id
                JOIN "Vehicle" v ON s."vehicleId" = v.id
                WHERE 
                    gm.latitude < %s OR gm.latitude > %s OR
                    gm.longitude < %s OR gm.longitude > %s
                ORDER BY gm.timestamp DESC
                LIMIT 50
            """, (
                self.MADRID_BOUNDS['min_lat'],
                self.MADRID_BOUNDS['max_lat'],
                self.MADRID_BOUNDS['min_lon'],
                self.MADRID_BOUNDS['max_lon']
            ))
            
            invalid_points = cur.fetchall()
            
            if invalid_points:
                logger.warning(f"Se encontraron {len(invalid_points)} puntos GPS fuera del área válida:")
                logger.warning("")
                
                for point in invalid_points:
                    point_id, lat, lon, timestamp, speed, satellites, accuracy, session_num, vehicle = point
                    logger.warning(f"  ID: {point_id}")
                    logger.warning(f"  Coordenadas: {lat}, {lon}")
                    logger.warning(f"  Timestamp: {timestamp}")
                    logger.warning(f"  Velocidad: {speed} km/h")
                    logger.warning(f"  Satélites: {satellites}")
                    logger.warning(f"  Precisión: {accuracy}")
                    logger.warning(f"  Sesión: {session_num} ({vehicle})")
                    logger.warning(f"  Ubicación: {'OCÉANO' if lon < -10 or lon > 5 else 'FUERA DE MADRID'}")
                    logger.warning("")
            else:
                logger.info("✅ No se encontraron puntos GPS fuera del área válida")
            
            # Estadísticas generales
            cur.execute("""
                SELECT 
                    COUNT(*) as total_points,
                    COUNT(CASE WHEN latitude BETWEEN %s AND %s AND longitude BETWEEN %s AND %s THEN 1 END) as valid_points,
                    COUNT(CASE WHEN latitude NOT BETWEEN %s AND %s OR longitude NOT BETWEEN %s AND %s THEN 1 END) as invalid_points
                FROM "GpsMeasurement"
            """, (
                self.MADRID_BOUNDS['min_lat'], self.MADRID_BOUNDS['max_lat'],
                self.MADRID_BOUNDS['min_lon'], self.MADRID_BOUNDS['max_lon'],
                self.MADRID_BOUNDS['min_lat'], self.MADRID_BOUNDS['max_lat'],
                self.MADRID_BOUNDS['min_lon'], self.MADRID_BOUNDS['max_lon']
            ))
            
            stats = cur.fetchone()
            total, valid, invalid = stats
            
            logger.info(f"📊 ESTADÍSTICAS GPS:")
            logger.info(f"   Total de puntos: {total:,}")
            logger.info(f"   Puntos válidos: {valid:,} ({valid/total*100:.1f}%)")
            logger.info(f"   Puntos inválidos: {invalid:,} ({invalid/total*100:.1f}%)")
            
        finally:
            cur.close()
            conn.close()
    
    def analyze_missing_sessions(self):
        """Analiza sesiones que faltan en la aplicación."""
        logger.info("")
        logger.info("=" * 60)
        logger.info("ANÁLISIS DE SESIONES PERDIDAS")
        logger.info("=" * 60)
        
        conn = self.connect_db()
        if not conn:
            return
        
        try:
            cur = conn.cursor()
            
            # Obtener todas las sesiones
            cur.execute("""
                SELECT 
                    s.id,
                    s."sessionNumber",
                    s."startTime",
                    s."endTime",
                    v.name as vehicle_name,
                    COUNT(gm.id) as gps_count,
                    COUNT(cm.id) as can_count,
                    COUNT(sm.id) as stability_count
                FROM "Session" s
                JOIN "Vehicle" v ON s."vehicleId" = v.id
                LEFT JOIN "GpsMeasurement" gm ON s.id = gm."sessionId"
                LEFT JOIN "CanMeasurement" cm ON s.id = cm."sessionId"
                LEFT JOIN "StabilityMeasurement" sm ON s.id = sm."sessionId"
                GROUP BY s.id, s."sessionNumber", s."startTime", s."endTime", v.name
                ORDER BY v.name, s."sessionNumber"
            """)
            
            sessions = cur.fetchall()
            
            logger.info(f"📋 SESIONES EN BASE DE DATOS: {len(sessions)}")
            logger.info("")
            
            # Agrupar por vehículo
            vehicles = {}
            for session in sessions:
                vehicle = session[4]  # vehicle_name
                if vehicle not in vehicles:
                    vehicles[vehicle] = []
                vehicles[vehicle].append(session)
            
            for vehicle, vehicle_sessions in vehicles.items():
                logger.info(f"🚗 VEHÍCULO: {vehicle}")
                logger.info(f"   Sesiones encontradas: {len(vehicle_sessions)}")
                
                for session in vehicle_sessions:
                    session_id, session_num, start_time, end_time, _, gps_count, can_count, stability_count = session
                    duration = (end_time - start_time).total_seconds() / 60  # minutos
                    
                    logger.info(f"   📅 Sesión {session_num}: {start_time.strftime('%Y-%m-%d %H:%M')} - {end_time.strftime('%H:%M')} ({duration:.1f} min)")
                    logger.info(f"      GPS: {gps_count:,} | CAN: {can_count:,} | Estabilidad: {stability_count:,}")
                
                logger.info("")
            
            # Verificar si hay sesiones con datos faltantes
            logger.info("🔍 VERIFICACIÓN DE DATOS:")
            for vehicle, vehicle_sessions in vehicles.items():
                for session in vehicle_sessions:
                    session_id, session_num, start_time, end_time, _, gps_count, can_count, stability_count = session
                    
                    if gps_count == 0:
                        logger.warning(f"   ⚠️  Sesión {session_num} ({vehicle}): Sin datos GPS")
                    if can_count == 0:
                        logger.warning(f"   ⚠️  Sesión {session_num} ({vehicle}): Sin datos CAN")
                    if stability_count == 0:
                        logger.warning(f"   ⚠️  Sesión {session_num} ({vehicle}): Sin datos de estabilidad")
            
        finally:
            cur.close()
            conn.close()
    
    def propose_solutions(self):
        """Propone soluciones para los problemas identificados."""
        logger.info("")
        logger.info("=" * 60)
        logger.info("SOLUCIONES PROPUESTAS")
        logger.info("=" * 60)
        
        logger.info("🔧 1. FILTROS DE COORDENADAS GPS:")
        logger.info("   - Implementar validación geográfica en el procesador")
        logger.info("   - Filtrar puntos fuera del área de Madrid antes de subir")
        logger.info("   - Añadir campo 'is_valid_location' en la base de datos")
        logger.info("   - Crear función de limpieza para datos existentes")
        logger.info("")
        
        logger.info("🔧 2. SESIONES PERDIDAS:")
        logger.info("   - Verificar lógica de detección de sesiones")
        logger.info("   - Implementar procesamiento por lotes")
        logger.info("   - Añadir logs detallados del proceso")
        logger.info("   - Crear endpoint de reprocesamiento")
        logger.info("")
        
        logger.info("🔧 3. VALIDACIÓN DE DATOS:")
        logger.info("   - Implementar validación en tiempo real")
        logger.info("   - Añadir métricas de calidad de datos")
        logger.info("   - Crear alertas para datos anómalos")
        logger.info("   - Implementar sistema de corrección automática")
        logger.info("")
        
        logger.info("🔧 4. MEJORAS EN EL PROCESADOR:")
        logger.info("   - Añadir filtros de coordenadas GPS")
        logger.info("   - Implementar detección de outliers")
        logger.info("   - Mejorar manejo de errores")
        logger.info("   - Añadir validación de integridad de datos")
    
    def run_analysis(self):
        """Ejecuta el análisis completo."""
        logger.info("🚀 INICIANDO ANÁLISIS DE TELEMETRÍA")
        logger.info("")
        
        self.analyze_gps_coordinates()
        self.analyze_missing_sessions()
        self.propose_solutions()
        
        logger.info("")
        logger.info("✅ ANÁLISIS COMPLETADO")

def main():
    """Función principal."""
    analyzer = TelemetryAnalyzer()
    analyzer.run_analysis()

if __name__ == "__main__":
    main() 