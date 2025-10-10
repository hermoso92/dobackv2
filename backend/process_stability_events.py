#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para procesar automáticamente eventos de estabilidad para todas las sesiones existentes.
"""

import requests
import json
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuración
API_BASE_URL = "http://localhost:3001/api"
ORGANIZATION_ID = "CMadrid"

def get_sessions():
    """Obtiene todas las sesiones de la organización."""
    try:
        response = requests.get(f"{API_BASE_URL}/sessions", timeout=30)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                return data.get('data', [])
            else:
                logger.error(f"Error en respuesta: {data.get('error')}")
                return []
        else:
            logger.error(f"Error HTTP {response.status_code}: {response.text}")
            return []
    except Exception as e:
        logger.error(f"Error obteniendo sesiones: {e}")
        return []

def process_session_events(session_id):
    """Procesa eventos de estabilidad para una sesión específica."""
    try:
        url = f"{API_BASE_URL}/stability/events/process-session/{session_id}"
        response = requests.post(url, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                events_count = data.get('eventsCount', 0)
                message = data.get('message', '')
                logger.info(f"✅ Sesión {session_id}: {events_count} eventos procesados - {message}")
                return events_count
            else:
                logger.error(f"❌ Error procesando sesión {session_id}: {data.get('error')}")
                return 0
        else:
            logger.error(f"❌ Error HTTP {response.status_code} para sesión {session_id}: {response.text}")
            return 0
    except Exception as e:
        logger.error(f"❌ Error procesando sesión {session_id}: {e}")
        return 0

def main():
    """Función principal."""
    logger.info("🚀 Iniciando procesamiento de eventos de estabilidad...")
    
    # Obtener todas las sesiones
    sessions = get_sessions()
    if not sessions:
        logger.error("❌ No se pudieron obtener las sesiones")
        return
    
    logger.info(f"📊 Encontradas {len(sessions)} sesiones para procesar")
    
    # Procesar eventos para cada sesión
    total_events = 0
    processed_sessions = 0
    failed_sessions = 0
    
    for i, session in enumerate(sessions, 1):
        session_id = session.get('id')
        vehicle_name = session.get('vehicle', {}).get('name', 'Desconocido')
        start_time = session.get('startTime', 'Desconocido')
        
        logger.info(f"🔄 Procesando sesión {i}/{len(sessions)}: {vehicle_name} - {start_time}")
        
        events_count = process_session_events(session_id)
        if events_count > 0:
            total_events += events_count
            processed_sessions += 1
        else:
            failed_sessions += 1
    
    # Resumen final
    logger.info("=" * 60)
    logger.info("📋 RESUMEN DEL PROCESAMIENTO")
    logger.info("=" * 60)
    logger.info(f"✅ Sesiones procesadas exitosamente: {processed_sessions}")
    logger.info(f"❌ Sesiones con errores: {failed_sessions}")
    logger.info(f"📊 Total de eventos generados: {total_events}")
    logger.info(f"📈 Promedio de eventos por sesión: {total_events / processed_sessions if processed_sessions > 0 else 0:.1f}")
    logger.info("=" * 60)

if __name__ == "__main__":
    main() 