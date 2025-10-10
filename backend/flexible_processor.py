#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DOBACK SOFT - PROCESADOR SIMPLIFICADO CON LÓGICA FLEXIBLE
===============================================================================

DESCRIPCIÓN:
    Procesador simplificado que permite subir sesiones con datos mínimos:
    - Mínimo requerido: ESTABILIDAD O GPS
    - Opcional: CAN y ROTATIVO
    - Prioridad: CAN > ESTABILIDAD > GPS como archivo base

AUTOR: Doback Soft Development Team
FECHA: 2025-01-31
VERSIÓN: 2.0.0 - Flexible
===============================================================================
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Set
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('flexible_processor.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuración de directorios
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback')

# Configuración de base de datos
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'dobacksoft',
    'user': 'postgres',
    'password': 'postgres'
}

class FlexibleProcessor:
    def __init__(self):
        self.data_dir = DATA_DIR
        self.db_config = DB_CONFIG
        self.organization_name = 'CMadrid'
        self.user_id = 'a8071944-989c-4627-b8a7-71aa03f24180'  # admin@cmadrid.com

    def scan_files_and_find_sessions(self) -> List[Dict]:
        """
        Escanea archivos y encuentra sesiones con lógica flexible.
        - Mínimo requerido: ESTABILIDAD O GPS
        - Opcional: CAN y ROTATIVO
        - Prioridad: CAN > ESTABILIDAD > GPS como archivo base
        """
        logger.info("🔍 Iniciando escaneo flexible de archivos...")
        
        # Obtener todos los archivos
        all_files = self._get_all_files()
        if not all_files:
            logger.warning("No se encontraron archivos para procesar")
            return []
        
        # Agrupar archivos por vehículo y fecha
        files_by_vehicle_date = self._group_files_by_vehicle_date(all_files)
        
        # Encontrar sesiones para cada grupo
        sessions = []
        uploaded_sessions = self._load_uploaded_sessions()
        
        for (vehicle, date), files in files_by_vehicle_date.items():
            logger.info(f"📅 Procesando vehículo {vehicle} - {date}")
        
            # Agrupar archivos por tipo
            files_by_type = self._group_files_by_type(files)
            
            # Encontrar sesiones para este vehículo/fecha
            vehicle_sessions = self._find_sessions_for_vehicle_date(
                vehicle, date, files_by_type, uploaded_sessions
            )
            
            sessions.extend(vehicle_sessions)
        
        logger.info(f"✅ Encontradas {len(sessions)} sesiones válidas")
        return sessions

    def _get_all_files(self) -> List[Dict]:
        """Obtiene todos los archivos del directorio de datos."""
        files = []
        
        for root, dirs, filenames in os.walk(self.data_dir):
            for filename in filenames:
                if filename.endswith(('.txt', '.csv')):
                    file_path = os.path.join(root, filename)
                    file_info = self._parse_filename(file_path)
                    if file_info:
                        files.append(file_info)
        
        return files

    def _parse_filename(self, file_path: str) -> Optional[Dict]:
        """Parsea el nombre del archivo para extraer información."""
        filename = os.path.basename(file_path)
        
        # Detectar tipo de archivo
        if 'CAN' in filename.upper():
            file_type = 'CAN'
        elif 'GPS' in filename.upper():
            file_type = 'GPS'
        elif 'ESTABILIDAD' in filename.upper():
            file_type = 'ESTABILIDAD'
        elif 'ROTATIVO' in filename.upper():
            file_type = 'ROTATIVO'
        else:
            return None
        
        # Extraer vehículo y fecha del nombre
        parts = filename.split('_')
        if len(parts) >= 3:
            vehicle = parts[1]
            date_str = parts[2]
            
            # Convertir fecha
            try:
                date = datetime.strptime(date_str, '%Y%m%d').date()
                return {
                    'path': file_path,
                    'filename': filename,
                    'type': file_type,
                    'vehicle': vehicle,
                    'date': date
                }
            except ValueError:
                return None
        
        return None

    def _group_files_by_vehicle_date(self, files: List[Dict]) -> Dict[Tuple[str, str], List[Dict]]:
        """Agrupa archivos por vehículo y fecha."""
        grouped = {}
        
        for file_info in files:
            vehicle = file_info.get('vehicle', 'unknown')
            date = file_info.get('date')
            
            if not date:
                continue
            
            date_str = str(date)
            key = (vehicle, date_str)
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(file_info)
        
        return grouped

    def _group_files_by_type(self, files: List[Dict]) -> Dict[str, List[Dict]]:
        """Agrupa archivos por tipo."""
        grouped = {'CAN': [], 'GPS': [], 'ESTABILIDAD': [], 'ROTATIVO': []}
        
        for file_info in files:
            file_type = file_info.get('type')
            if file_type in grouped:
                grouped[file_type].append(file_info)
        
        return grouped

    def _find_sessions_for_vehicle_date(
        self, 
        vehicle: str, 
        date: str, 
        files_by_type: Dict[str, List[Dict]], 
        uploaded_sessions: Set[str]
    ) -> List[Dict]:
        """
        Encuentra sesiones para un vehículo y fecha específicos.
        Lógica flexible: mínimo ESTABILIDAD O GPS.
        """
        sessions = []
        
        # Contar archivos disponibles por tipo
        can_files = files_by_type.get('CAN', [])
        gps_files = files_by_type.get('GPS', [])
        stability_files = files_by_type.get('ESTABILIDAD', [])
        rotativo_files = files_by_type.get('ROTATIVO', [])
        
        logger.info(f"  📊 Archivos disponibles: CAN={len(can_files)}, GPS={len(gps_files)}, "
                   f"ESTABILIDAD={len(stability_files)}, ROTATIVO={len(rotativo_files)}")
        
        # Verificar que haya al menos estabilidad O GPS (mínimo requerido)
        has_minimum_data = len(stability_files) > 0 or len(gps_files) > 0
        if not has_minimum_data:
            logger.info(f"  ⚠️  No hay datos mínimos (estabilidad O GPS) para {vehicle} en {date}")
            return sessions
        
        logger.info(f"  ✅ Datos mínimos encontrados para {vehicle} en {date}")
        
        # Obtener IDs reales de la base de datos
        vehicle_id = None
        organization_id = None
        try:
            conn = psycopg2.connect(**self.db_config)
            cur = conn.cursor()
            # Buscar vehicleId
            cur.execute('SELECT id FROM "Vehicle" WHERE name = %s LIMIT 1', (vehicle,))
            row = cur.fetchone()
            if row:
                vehicle_id = row[0]
            # Buscar organizationId
            cur.execute('SELECT id FROM "Organization" WHERE name = %s LIMIT 1', (self.organization_name,))
            row = cur.fetchone()
            if row:
                organization_id = row[0]
            cur.close()
            conn.close()
        except Exception as e:
            logger.warning(f"No se pudo obtener vehicleId/organizationId para {vehicle}: {e}")
            return sessions
        
        # Crear sesiones basadas en archivos disponibles
        # Prioridad: usar CAN si está disponible, sino usar estabilidad o GPS como base
        base_files = []
        
        if can_files:
            # Si hay CAN, usar CAN como base (comportamiento original)
            base_files = can_files
            logger.info(f"  🚗 Usando archivos CAN como base ({len(can_files)} archivos)")
        elif stability_files:
            # Si no hay CAN pero hay estabilidad, usar estabilidad como base
            base_files = stability_files
            logger.info(f"  📊 Usando archivos ESTABILIDAD como base ({len(stability_files)} archivos)")
        elif gps_files:
            # Si no hay CAN ni estabilidad pero hay GPS, usar GPS como base
            base_files = gps_files
            logger.info(f"  📍 Usando archivos GPS como base ({len(gps_files)} archivos)")
        
        for base_file in base_files:
            # Crear sesión simple
            session_id = self._generate_session_id(vehicle, date, base_file)
            
            # Verificar si ya fue subida
            if session_id in uploaded_sessions:
                logger.info(f"  ⏭️  Sesión {session_id} ya subida, saltando...")
                continue
            
            # Crear objeto de sesión con IDs reales
            session = {
                'id': session_id,
                'vehicle': vehicle,
                'vehicleId': vehicle_id,
                'organizationId': organization_id,
                'date': date,
                'startTime': datetime.now(),
                'endTime': datetime.now(),
                'files': {
                    'CAN': can_files[0] if can_files else None,
                    'GPS': gps_files[0] if gps_files else None,
                    'ESTABILIDAD': stability_files[0] if stability_files else None,
                    'ROTATIVO': rotativo_files[0] if rotativo_files else None
                },
                'available_types': [t for t, files in files_by_type.items() if files],
                'missing_types': [t for t in ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO'] if not files_by_type.get(t)]
            }
            
            sessions.append(session)
            logger.info(f"  ✅ Sesión {session_id} creada con tipos: {session['available_types']}")
            if session['missing_types']:
                logger.info(f"     ⚠️  Faltan: {session['missing_types']}")
        
        return sessions

    def _generate_session_id(self, vehicle: str, date: str, base_file: Dict) -> str:
        """Genera un ID único para la sesión basado en el archivo base."""
        base_filename = base_file.get('filename', 'unknown')
        
        # Extraer número de sesión del nombre del archivo
        import re
        match = re.search(r'_(\d+)_(\d+)\.', base_filename)
        if match:
            session_num = match.group(1)
        else:
            session_num = str(int(datetime.now().timestamp()))
        
        return f"{vehicle}_{date}_{session_num}"

    def _load_uploaded_sessions(self) -> Set[str]:
        """Carga la lista de sesiones ya subidas."""
        uploaded_file = os.path.join(DATA_DIR, 'uploaded_sessions.json')
        try:
            if os.path.exists(uploaded_file):
                with open(uploaded_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return set(data.get('sessions', []))
        except Exception as e:
            logger.warning(f"No se pudo cargar uploaded_sessions.json: {e}")
        
        return set()

    def run(self):
        """Ejecuta el procesador flexible."""
        logger.info("🚀 Iniciando procesador flexible de Doback Soft")
        
        try:
            # Escanear y encontrar sesiones
            sessions = self.scan_files_and_find_sessions()
            
            if not sessions:
                logger.info("No se encontraron sesiones para procesar")
                return
            
            # Mostrar resumen
            logger.info("📊 === RESUMEN DE SESIONES ENCONTRADAS ===")
            for session in sessions:
                logger.info(f"  📋 {session['id']}")
                logger.info(f"     Vehículo: {session['vehicle']}")
                logger.info(f"     Fecha: {session['date']}")
                logger.info(f"     Tipos disponibles: {session['available_types']}")
                if session['missing_types']:
                    logger.info(f"     Tipos faltantes: {session['missing_types']}")
            
            logger.info(f"✅ Total sesiones encontradas: {len(sessions)}")
            
        except Exception as e:
            logger.error(f"Error en procesador flexible: {e}")
            raise

if __name__ == "__main__":
    processor = FlexibleProcessor()
    processor.run()
