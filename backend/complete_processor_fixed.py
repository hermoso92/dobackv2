#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Procesador completo Doback Soft - Versión corregida
Procesa todos los tipos de archivos: CAN, GPS, ESTABILIDAD, ROTATIVO
"""

import sys
import logging
from logging.handlers import RotatingFileHandler
import os

# Crear la carpeta backend si no existe (por robustez)
os.makedirs('backend', exist_ok=True)

# Configurar logging dual: consola y archivo en backend/processor.log
log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Handler para consola
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(log_formatter)
logger.addHandler(console_handler)

# Handler para archivo (rotativo, 5 MB máx, 3 backups)
file_handler = RotatingFileHandler('backend/processor.log', maxBytes=5*1024*1024, backupCount=3, encoding='utf-8')
file_handler.setFormatter(log_formatter)
logger.addHandler(file_handler)

# Forzar salida inmediata
sys.stdout.reconfigure(line_buffering=True)

import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple
import psycopg2
from psycopg2.extras import RealDictCursor
import re
import csv

# Configuración de logging
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', stream=sys.stdout, force=True)
# logger = logging.getLogger(__name__)

# Configuración de base de datos
DB_CONFIG = {
    'host': 'localhost',
    'database': 'dobacksoft',
    'user': 'postgres',
    'password': 'cosigein',
    'port': 5432
}

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback', 'CMadrid')

# --- NUEVO: Estructura para resumen de integridad ---
from collections import defaultdict

# Añadir variables globales para resumen de descartes
DESCARTES = {
    'GPS': [],
    'CAN': [],
    'ESTABILIDAD': [],
    'ROTATIVO': []
}

class CompleteProcessor:
    """Procesador completo para Doback Soft."""
    
    def __init__(self):
        self.data_dir = DATA_DIR
        self.db_config = DB_CONFIG
        self.organization_name = 'CMadrid'
        self.user_id = 'a8071944-989c-4627-b8a7-71aa03f24180'  # admin@cmadrid.com
        
    def run(self):
        """Procesa SOLO la sesión doback022 del 10/07/2025 con los archivos traducidos y reales."""
        base_path = "backend/data/datosDoback/CMadrid - copia/"
        files = {
            'CAN': None,  # No hay CAN en esta sesión específica
            'GPS': base_path + "GPS_DOBACK022_20250710_0.txt",
            'ESTABILIDAD': None,  # No hay estabilidad en esta sesión específica
            'ROTATIVO': base_path + "ROTATIVO_DOBACK022_20250710_0.txt",
        }
        session = {'vehicle': 'DOBACK022', 'date': '2025-07-10'}
        conn = psycopg2.connect(**self.db_config)
        try:
            logger.info(f"\n=== INICIO procesamiento sesión {session['vehicle']} {session['date']} ===")
            
            session_id = self._create_or_get_session(conn, session['vehicle'], session['date'])
            if not session_id:
                logger.error(f"❌ No se pudo crear la sesión para {session['vehicle']} {session['date']}. ABORTANDO procesamiento de puntos.")
                logger.error(f"❌ Parámetros usados: {session}")
                return
            logger.info(f"  ✅ Sesión creada con id: {session_id}")
            
            # GPS con correcciones 
            if files['GPS']:
                gps_data = self._load_gps_data(files['GPS'])
                if gps_data:
                    self._upload_gps_data(conn, session_id, gps_data)
            
            # ROTATIVO
            if files['ROTATIVO']:
                rotativo_data = self._load_rotativo_data(files['ROTATIVO'])
                if rotativo_data:
                    self._upload_rotativo_data(conn, session_id, rotativo_data)
            
            logger.info("✅ Procesamiento de la sesión doback022_2025-07-10 finalizado")
        finally:
            conn.close()
    
    def _scan_all_files(self) -> List[Dict]:
        """Escanea todos los archivos en el directorio de datos."""
        files = []
        
        if not os.path.exists(self.data_dir):
            logger.error(f"❌ Directorio no encontrado: {self.data_dir}")
            return files
        
        # Estructura: CMadrid/vehículo/tipo/archivos
        for vehicle_dir in os.listdir(self.data_dir):
            vehicle_path = os.path.join(self.data_dir, vehicle_dir)
            if not os.path.isdir(vehicle_path):
                continue
            
            # Buscar directorios de tipo de archivo
            for type_dir in os.listdir(vehicle_path):
                type_path = os.path.join(vehicle_path, type_dir)
                if not os.path.isdir(type_path):
                    continue
                
                # Mapear nombres de directorio a tipos
                type_mapping = {
                    'CAN': 'CAN',
                    'GPS': 'GPS', 
                    'estabilidad': 'ESTABILIDAD',
                    'ROTATIVO': 'ROTATIVO'
                }
                
                file_type = type_mapping.get(type_dir.upper())
                if not file_type:
                    continue
                
                # Escanear archivos en este directorio
                for filename in os.listdir(type_path):
                    if filename.endswith('.txt'):
                        file_path = os.path.join(type_path, filename)
                        
                        # Extraer información del archivo
                        vehicle, date = self._extract_vehicle_date(filename)
                        if not vehicle:
                            vehicle = vehicle_dir.lower()  # Usar nombre del directorio en minúsculas
                        else:
                            vehicle = vehicle.lower()  # Convertir a minúsculas si se extrajo del archivo
                        
                        start_time, end_time = self._extract_time_range(file_path, file_type)
                        
                        files.append({
                            'filename': filename,
                            'file_path': file_path,
                            'file_type': file_type,
                            'vehicle': vehicle,
                            'date': date,
                            'start_time': start_time,
                            'end_time': end_time
                        })
        
        logger.info(f"📁 Escaneados {len(files)} archivos")
        return files
    
    def _get_file_type(self, filename: str) -> Optional[str]:
        """Determina el tipo de archivo basado en el nombre."""
        if filename.startswith('CAN_'):
            return 'CAN'
        elif filename.startswith('GPS_'):
            return 'GPS'
        elif filename.startswith('ESTABILIDAD_'):
            return 'ESTABILIDAD'
        elif filename.startswith('ROTATIVO_'):
            return 'ROTATIVO'
        return None
    
    def _extract_vehicle_date(self, filename: str) -> Tuple[Optional[str], Optional[str]]:
        """Extrae vehículo y fecha del nombre del archivo."""
        # Patrón: TIPO_DOBACK<vehículo>_<YYYYMMDD>_<secuencia>.txt
        match = re.search(r'_(DOBACK\d+)_(\d{8})_', filename)
        if match:
            vehicle = match.group(1)
            date_str = match.group(2)
            # Convertir YYYYMMDD a YYYY-MM-DD
            date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
            return vehicle, date
        return None, None
    
    def _extract_time_range(self, file_path: str, file_type: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        """Extrae el rango temporal de un archivo."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            if not lines:
                return None, None
            
            # Buscar timestamps en las primeras líneas
            timestamps = []
            for line in lines[:50]:  # Solo primeras 50 líneas
                line = line.strip()
                if line and ':' in line and ('AM' in line or 'PM' in line):
                    try:
                        # Intentar parsear timestamp
                        dt = self._parse_timestamp(line)
                        if dt:
                            timestamps.append(dt)
                    except:
                        continue
            
            if len(timestamps) >= 2:
                return min(timestamps), max(timestamps)
            elif timestamps:
                return timestamps[0], timestamps[0]
            
        except Exception as e:
            logger.warning(f"Error extrayendo tiempo de {file_path}: {e}")
        
        return None, None
    
    def _parse_timestamp(self, time_str: str) -> Optional[datetime]:
        """Parsea un timestamp en varios formatos."""
        # Limpiar la cadena
        time_str = time_str.strip()
        
        # Intentar diferentes formatos específicos de Doback
        formats = [
            '%m/%d/%Y %I:%M:%S%p',  # 07/07/2025 05:21:42PM
            '%Y-%m-%d %H:%M:%S',   # 2025-07-07 14:23:49
            '%m/%d/%Y,%H:%M:%S',   # 07/07/2025,14:23:49
            '%Y-%m-%d %H:%M:%S.%f', # Con microsegundos
            '%m/%d/%Y %H:%M:%S',   # 07/07/2025 14:23:49 (24h)
            '%H:%M:%S',            # Solo tiempo
            '%H:%M:%S %p',         # Solo tiempo con AM/PM
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(time_str, fmt)
            except:
                continue
        
        return None
    
    def _group_into_sessions(self, files: List[Dict]) -> List[Dict]:
        """Agrupa archivos en sesiones por vehículo y fecha."""
        sessions = {}
        
        for file_info in files:
            vehicle = file_info['vehicle']
            date = file_info['date']
            
            if not vehicle or not date:
                continue
            
            key = f"{vehicle}_{date}"
            
            if key not in sessions:
                sessions[key] = {
                    'vehicle': vehicle,
                    'date': date,
                    'files': {'CAN': [], 'GPS': [], 'ESTABILIDAD': [], 'ROTATIVO': []}
                }
            
            file_type = file_info['file_type']
            if file_type in sessions[key]['files']:
                sessions[key]['files'][file_type].append(file_info)
        
        # Convertir a lista y filtrar sesiones válidas
        session_list = []
        for session_data in sessions.values():
            # Solo incluir sesiones con al menos 2 tipos de archivos
            available_types = [t for t, files in session_data['files'].items() if files]
            if len(available_types) >= 2:
                session_data['available_types'] = available_types
                session_data['missing_types'] = [t for t in ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO'] if t not in available_types]
                session_list.append(session_data)
        
        return session_list
    
    def _process_sessions(self, conn, sessions: List[Dict]):
        """Procesa todas las sesiones encontradas."""
        for session_data in sessions:
            try:
                self._process_single_session(conn, session_data)
            except Exception as e:
                logger.error(f"Error procesando sesión {session_data['vehicle']}_{session_data['date']}: {e}")
    
    def _process_single_session(self, conn, session_data: Dict):
        """Procesa una sesión individual."""
        vehicle = session_data['vehicle']
        date = session_data['date']
        files_by_type = session_data['files']
        
        logger.info(f"📊 Procesando sesión: {vehicle} - {date}")
        
        # Contar archivos totales
        total_files = sum(len(files) for files in files_by_type.values())
        logger.info(f"   📁 Archivos: {total_files}")
        
        # Crear o obtener sesión
        session_id = self._create_or_get_session(conn, vehicle, date)
        if not session_id:
            logger.error(f"   ❌ No se pudo crear/obtener sesión para {vehicle} - {date}")
            return
        
        logger.info(f"   ✅ Sesión ID: {session_id}")
        
        # Procesar cada archivo con autocommit
        try:
            # Iterar sobre cada tipo de archivo
            for file_type, file_list in files_by_type.items():
                if not file_list:  # Saltar tipos sin archivos
                    continue
                    
                for file_info in file_list:
                    file_path = file_info['file_path']
                    
                    logger.info(f"   📄 Procesando {file_type}: {os.path.basename(file_path)}")
                    
                    # Subir datos según el tipo
                    if file_type == 'CAN':
                        self._upload_can_data(conn, session_id, file_path)
                    elif file_type == 'GPS':
                        self._upload_gps_data(conn, session_id, file_path)
                    elif file_type == 'ESTABILIDAD':
                        stability_data = self._load_stability_data(file_path)
                        self._upload_stability_data(conn, session_id, stability_data)
                    elif file_type == 'ROTATIVO':
                        self._upload_rotativo_data(conn, session_id, file_path)
            
            logger.info(f"   ✅ Sesión {session_id} procesada exitosamente")
            
        except Exception as e:
            logger.error(f"   ❌ Error procesando sesión {session_id}: {e}")
    
    def _create_or_get_session(self, conn, vehicle: str, date: str) -> str:
        """Crea o busca una sesión en la tabla Session y devuelve su UUID (string)."""
        import traceback
        try:
            cur = conn.cursor()
            # Normalizar nombre de vehículo a minúsculas
            vehicle_norm = vehicle.lower()
            logger.info(f"   🔍 Buscando vehicleId para '{vehicle_norm}'...")
            cur.execute('SELECT id FROM "Vehicle" WHERE name = %s LIMIT 1', (vehicle_norm,))
            vehicle_row = cur.fetchone()
            if not vehicle_row:
                logger.error(f"   ❌ No se encontró vehicleId para '{vehicle_norm}'")
                return None
            vehicle_id = vehicle_row[0]
            logger.info(f"   ✅ vehicleId encontrado: {vehicle_id}")
            # Buscar organizationId
            org_name = self.organization_name
            logger.info(f"   🔍 Buscando organizationId para '{org_name}'...")
            cur.execute('SELECT id FROM "Organization" WHERE name = %s LIMIT 1', (org_name,))
            org_row = cur.fetchone()
            if not org_row:
                logger.error(f"   ❌ No se encontró organizationId para '{org_name}'")
                return None
            organization_id = org_row[0]
            logger.info(f"   ✅ organizationId encontrado: {organization_id}")
            # Buscar userId (por defecto, usuario 'admin')
            user_name = 'admin'
            logger.info(f"   🔍 Buscando userId para '{user_name}'...")
            cur.execute('SELECT id FROM "User" WHERE "name" = %s LIMIT 1', (user_name,))
            user_row = cur.fetchone()
            if not user_row:
                logger.error(f"   ❌ No se encontró userId para '{user_name}'")
                return None
            user_id = user_row[0]
            logger.info(f"   ✅ userId encontrado: {user_id}")
            # Buscar sesión existente
            session_date = date
            session_number = 1
            logger.info(f"   🔍 Buscando sesión existente para vehicleId={vehicle_id}, organizationId={organization_id}, fecha={session_date}, sessionNumber={session_number}")
            cur.execute('''SELECT id FROM "Session" WHERE "vehicleId" = %s AND "organizationId" = %s AND DATE("startTime") = %s AND "sessionNumber" = %s LIMIT 1''', (vehicle_id, organization_id, session_date, session_number))
            session_row = cur.fetchone()
            if session_row:
                session_uuid = session_row[0]
                logger.info(f"   ✅ Sesión encontrada: {session_uuid}")
                return session_uuid
            # Crear nueva sesión
            import uuid
            session_uuid = str(uuid.uuid4())
            # startTime: usar la fecha a las 00:00:00
            from datetime import datetime
            start_time = datetime.strptime(f"{session_date} 00:00:00", "%Y-%m-%d %H:%M:%S")
            updated_at = datetime.utcnow()
            logger.info(f"   ➕ Creando nueva sesión: {vehicle}_{session_date}_{session_number} (id={session_uuid})")
            cur.execute('''INSERT INTO "Session" (id, "vehicleId", "userId", "organizationId", "startTime", "sessionNumber", "sequence", "updatedAt") VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''', (session_uuid, vehicle_id, user_id, organization_id, start_time, session_number, 1, updated_at))
            conn.commit()
            logger.info(f"   ✅ Sesión creada correctamente: {vehicle}_{session_date}_{session_number} (id={session_uuid})")
            return session_uuid
        except Exception as e:
            logger.error(f"   ❌ Error creando/obteniendo sesión: {e}\n{traceback.format_exc()}")
            return None
    
    def _upload_file_data(self, conn, session_id: str, file_info: Dict, file_type: str):
        """Sube datos de un archivo específico."""
        file_path = file_info['file_path']
        
        try:
            if file_type == 'CAN':
                self._upload_can_data(conn, session_id, file_path)
            elif file_type == 'GPS':
                self._upload_gps_data(conn, session_id, file_path)
            elif file_type == 'ESTABILIDAD':
                self._upload_stability_data(conn, session_id, file_path)
            elif file_type == 'ROTATIVO':
                self._upload_rotativo_data(conn, session_id, file_path)
                
        except Exception as e:
            logger.error(f"   ❌ Error subiendo {file_type} {file_path}: {e}")
    
    def _find_header_line_and_delim(self, lines, file_type=None):
        """Devuelve (índice, delimitador) de la línea de header real, detectando ',' o ';'."""
        keywords = {
            'CAN': ['fecha-hora', 'engine', 'rpm', 'vehicle', 'speed'],
            'GPS': ['fecha', 'hora', 'latitud', 'longitud', 'altitud', 'hdop', 'fix', 'numsats', 'velocidad'],
            'ESTABILIDAD': ['ax', 'ay', 'az', 'gx', 'gy', 'gz', 'si', 'accmag'],
            'ROTATIVO': ['fecha-hora', 'estado']
        }
        if file_type and file_type.upper() in keywords:
            keys = keywords[file_type.upper()]
            for idx, line in enumerate(lines):
                l = line.lower().strip()
                for delim in [';', ',']:
                    parts = [p.strip() for p in l.split(delim)]
                    found = sum(1 for k in keys if any(k in p for p in parts))
                    if found >= 3:
                        return idx, delim
        # Fallback: primera línea con al menos 2 separadores
        for idx, line in enumerate(lines):
            for delim in [';', ',']:
                if line.count(delim) >= 2:
                    return idx, delim
        return None, None

    def _find_real_header_line(self, lines, file_type=None):
        # Palabras clave típicas por tipo
        keywords = {
            'CAN': ['timestamp', 'engine', 'rpm', 'vehicle', 'speed', 'torque'],
            'ESTABILIDAD': ['ax', 'ay', 'az', 'gx', 'gy', 'gz', 'si', 'accmag']
        }
        keys = keywords.get(file_type.upper(), []) if file_type else []
        for idx, line in enumerate(lines):
            sep = ',' if line.count(',') > line.count(';') else ';'
            # Validar que la línea no sea None y limpiar
            if line is None:
                continue
            parts = [p.strip().lower() if p is not None else '' for p in line.strip().split(sep)]
            # Criterio: al menos 3 separadores o 3 palabras clave
            if len(parts) >= 3 and sum(1 for k in keys if any(k in col for col in parts)) >= 3:
                return idx, sep
        return None, None

    def _load_can_data(self, file_path: str) -> list:
        import csv
        data = []
        try:
            logger.info(f"    🔍 Cargando CAN desde: {file_path}")
            with open(file_path, encoding="utf-8") as f:
                lines = f.readlines()
            idx, delim = self._find_real_header_line(lines, 'CAN')
            if idx is None:
                logger.error(f"    ❌ No se encontró header real CAN en {file_path}")
                return []
            header_line = lines[idx].strip()
            logger.info(f"    Header CAN detectado: {header_line} (delimitador: '{delim}')")
            reader = csv.DictReader(lines[idx+1:], fieldnames=[h.strip() for h in header_line.split(delim)], delimiter=delim)
            for i, row in enumerate(reader):
                if not row or all((v is None or v.strip() == '') for v in row.values()):
                    DESCARTES['CAN'].append((i+idx+2, 'Fila vacía o nula'))
                    continue
                def get_ci(row, *names):
                    for n in names:
                        for k in row:
                            if k and isinstance(k, str) and k.strip().lower() == n.lower():
                                return row[k]
                    return None
                timestamp = get_ci(row, 'fecha-hora', 'timestamp')
                engine_rpm = get_ci(row, 'engineRpm', 'enginerpm', 'engine_speed', 'Engine_Speed')
                if not (timestamp and engine_rpm):
                    DESCARTES['CAN'].append((i+idx+2, 'Faltan campos obligatorios'))
                    continue
                data.append({k.strip(): v.strip() if isinstance(v, str) else v for k, v in row.items()})
            if data:
                logger.info(f"    📋 Primeras filas CAN parseadas: {data[:2]}")
            else:
                logger.warning(f"    ⚠️ No se parsearon filas CAN en {file_path}")
        except Exception as e:
            logger.error(f"    ❌ Error parseando CAN: {e}")
        return data

    def _load_gps_data(self, file_path: str) -> list:
        import csv
        from datetime import datetime
        data = []
        try:
            logger.info(f"    🔍 Cargando GPS desde: {file_path}")
            with open(file_path, encoding="utf-8") as f:
                lines = f.readlines()
            if len(lines) < 2:
                logger.error(f"    ❌ Archivo GPS demasiado corto: {file_path}")
                return []
            header_line = lines[1].strip()
            delim = ',' if header_line.count(',') > header_line.count(';') else ';'
            logger.info(f"    Header GPS detectado: {header_line} (delimitador: '{delim}')")
            reader = csv.DictReader(lines[1:], delimiter=delim)
            header_keys = None
            for idx, row in enumerate(reader):
                if not row or all((v is None or v.strip() == '') for v in row.values()):
                    DESCARTES['GPS'].append((idx+2, 'Fila vacía o nula'))
                    continue
                if header_keys is None:
                    header_keys = [k.strip().lower() for k in row.keys() if k]
                def get_ci(row, *names):
                    for n in names:
                        for k in row:
                            if k and isinstance(k, str) and k.strip().lower() == n.lower():
                                return row[k]
                    return None
                fecha = get_ci(row, 'fecha')
                hora = get_ci(row, 'hora')
                lat = get_ci(row, 'latitud', 'latitude')
                lon = get_ci(row, 'longitud', 'longitude')
                alt = get_ci(row, 'altitud', 'altitude')
                hdop = get_ci(row, 'hdop')
                fix = get_ci(row, 'fix')
                numsats = get_ci(row, 'numsats', 'numsat', 'num_sats', 'num_sat', 'numsat')
                speed = get_ci(row, 'velocidad(km/h)', 'velocidad', 'speed')
                heading = get_ci(row, 'heading')
                accuracy = get_ci(row, 'accuracy')
                if not (fecha and hora and lat and lon):
                    DESCARTES['GPS'].append((idx+2, 'Faltan campos obligatorios'))
                    continue
                if 'sin datos' in lat.lower():
                    DESCARTES['GPS'].append((idx+2, 'Latitud sin datos'))
                    continue
                try:
                    # Normalizar hora: aceptar segundos con un solo dígito o con punto
                    hora_norm = hora.strip().replace('.', '')
                    if len(hora_norm.split(':')) == 3:
                        h, m, s = hora_norm.split(':')
                        s = s.zfill(2)
                        hora_norm = f"{h}:{m}:{s}"
                    datetime_str = f"{fecha.strip()} {hora_norm}"
                    ts_dt = datetime.strptime(datetime_str, "%d/%m/%Y %H:%M:%S")
                    data.append({
                        'timestamp': ts_dt,
                        'latitude': float(lat),
                        'longitude': float(lon),
                        'altitude': float(alt) if alt not in (None, '', 'sin datos') else 0.0,
                        'hdop': float(hdop) if hdop not in (None, '', 'sin datos') else None,
                        'fix': int(fix) if fix not in (None, '', 'sin datos') else None,
                        'satellites': int(numsats) if numsats not in (None, '', 'sin datos') else None,
                        'speed': float(speed) if speed not in (None, '', 'sin datos') else 0.0,
                        'heading': float(heading) if heading not in (None, '', 'sin datos') else None,
                        'accuracy': float(accuracy) if accuracy not in (None, '', 'sin datos') else None
                    })
                except Exception as e:
                    DESCARTES['GPS'].append((idx+2, f'Error parseando fila: {e}'))
                    continue
            logger.info(f"    GPS: puntos parseados={len(data)}")
            if data:
                logger.info(f"    Ejemplo GPS: {data[:3]}")
        except Exception as e:
            logger.error(f"Error parseando GPS: {e}")
        return data

    def _load_stability_data(self, file_path: str) -> list:
        import re
        from datetime import datetime, timedelta
        data = []
        try:
            logger.info(f"    🔍 Cargando ESTABILIDAD desde: {file_path}")
            with open(file_path, encoding="utf-8") as f:
                lines = [line.strip() for line in f if line.strip()]
            if len(lines) < 3:
                logger.warning(f"    ⚠️  Archivo ESTABILIDAD muy corto: {file_path}")
                return []
            cabecera = lines[0].split(';')
            fecha_base_str = cabecera[1].strip()
            fecha_base = datetime.strptime(fecha_base_str, "%d/%m/%Y %I:%M:%S%p")
            header = [h.strip() for h in lines[1].split(';')]
            time_pattern = re.compile(r"^(\d{2}:\d{2}:\d{2}(AM|PM))$")
            marcas = [fecha_base]
            bloques = []
            bloque_actual = []
            for l in lines[2:]:
                if time_pattern.match(l):
                    if bloque_actual:
                        bloques.append(bloque_actual)
                        bloque_actual = []
                    marcas.append(datetime.strptime(f"{fecha_base_str.split()[0]} {l}", "%d/%m/%Y %I:%M:%S%p"))
                else:
                    row = [v.strip() for v in l.split(';')]
                    if len(row) == len(header) + 1 and row[-1] == '':
                        row = row[:-1]
                    if len(row) != len(header):
                        DESCARTES['ESTABILIDAD'].append((l, 'Fila con columnas incorrectas'))
                        continue
                    bloque_actual.append(dict(zip(header, row)))
            if bloque_actual:
                bloques.append(bloque_actual)
            # Interpolación de timestamps
            for i, bloque in enumerate(bloques):
                n = len(bloque)
                if n == 0:
                    continue
                if i + 1 < len(marcas):
                    t_start = marcas[i]
                    t_end = marcas[i+1]
                    total_seconds = (t_end - t_start).total_seconds()
                    if n > 1 and total_seconds > 0:
                        step = total_seconds / n
                        ts_list = [t_start + timedelta(seconds=step * (j + 0.5)) for j in range(n)]
                    else:
                        ts_list = [t_start + timedelta(seconds=j) for j in range(n)]
                else:
                    t_start = marcas[i]
                    ts_list = [t_start + timedelta(seconds=j) for j in range(n)]
                if i == 0:
                    logger.info(f"    Primeros timestamps generados: {[ts.strftime('%Y-%m-%d %H:%M:%S.%f') for ts in ts_list[:10]]}")
                for row, ts in zip(bloque, ts_list):
                    row['timestamp'] = ts.strftime("%Y-%m-%d %H:%M:%S.%f")
                    data.append(row)
            logger.info(f"    Header ESTABILIDAD detectado: {header}")
            if data:
                logger.info(f"    Ejemplo filas ESTABILIDAD: {data[:2]}")
            else:
                logger.warning(f"    No se parsearon filas ESTABILIDAD")
        except Exception as e:
            logger.error(f"    ❌ Error al cargar ESTABILIDAD: {e}")
        return data

    def _load_rotativo_data(self, file_path: str) -> list:
        import csv
        data = []
        try:
            logger.info(f"    🔍 Cargando ROTATIVO desde: {file_path}")
            with open(file_path, encoding="utf-8") as f:
                lines = f.readlines()
            if len(lines) < 2:
                logger.error(f"    ❌ Archivo ROTATIVO demasiado corto: {file_path}")
                return []
            header_line = lines[1].strip()
            delim = ',' if header_line.count(',') > header_line.count(';') else ';'
            logger.info(f"    Header ROTATIVO detectado: {header_line} (delimitador: '{delim}')")
            reader = csv.DictReader(lines[1:], delimiter=delim)
            header_keys = None
            for idx, row in enumerate(reader):
                if not row or all((v is None or v.strip() == '') for v in row.values()):
                    DESCARTES['ROTATIVO'].append((idx+2, 'Fila vacía o nula'))
                    continue
                if header_keys is None:
                    header_keys = [k.strip().lower() for k in row.keys() if k]
                def get_ci(row, *names):
                    for n in names:
                        for k in row:
                            if k and isinstance(k, str) and k.strip().lower() == n.lower():
                                return row[k]
                    return None
                timestamp = get_ci(row, 'fecha-hora', 'timestamp')
                state = get_ci(row, 'estado', 'state')
                if not (timestamp and state is not None):
                    DESCARTES['ROTATIVO'].append((idx+2, 'Faltan campos obligatorios'))
                    continue
                data.append({
                    'timestamp': timestamp,
                    'state': state
                })
            logger.info(f"    ROTATIVO: puntos parseados={len(data)}")
            if data:
                logger.info(f"    Ejemplo ROTATIVO: {data[:3]}")
        except Exception as e:
            logger.error(f"Error parseando ROTATIVO: {e}")
        return data

    def _upload_can_data(self, conn, session_id: str, can_data: list):
        import traceback
        ejemplos = []
        try:
            if not can_data:
                logger.warning(f"   ⚠️  No se pudieron cargar datos CAN para la sesión {session_id}")
                return
            cur = conn.cursor()
            count = 0
            def get_ci(row, *names):
                for n in names:
                    for k in row:
                        if k and isinstance(k, str) and k.strip().lower() == n.lower():
                            return row[k]
                return None
            for i, row in enumerate(can_data):
                try:
                    timestamp = get_ci(row, 'fecha-hora', 'timestamp')
                    engine_rpm = get_ci(row, 'engineRpm', 'enginerpm', 'engine_speed', 'Engine_Speed')
                    if not (timestamp and engine_rpm):
                        DESCARTES['CAN'].append((i, 'Faltan campos obligatorios en inserción'))
                        continue
                    cur.execute('''
                        INSERT INTO "CanMeasurement" (
                            "id", "sessionId", "engineRpm", "vehicleSpeed", "fuelSystemStatus", "timestamp", "createdAt", "updatedAt",
                            "absActive", "brakePressure", "espActive", "gearPosition", "steeringAngle", "temperature", "throttlePosition"
                        ) VALUES (
                            gen_random_uuid(), %(sessionId)s, %(engineRpm)s, %(vehicleSpeed)s, %(fuelSystemStatus)s, %(timestamp)s, NOW(), NOW(),
                            %(absActive)s, %(brakePressure)s, %(espActive)s, %(gearPosition)s, %(steeringAngle)s, %(temperature)s, %(throttlePosition)s
                        ) ON CONFLICT DO NOTHING;
                    ''', {
                        'sessionId': session_id,
                        'engineRpm': engine_rpm,
                        'vehicleSpeed': get_ci(row, 'vehicleSpeed', 'vehiclespeed', 'vehicle_speed', 'Vehicle_Speed') or 0.0,
                        'fuelSystemStatus': get_ci(row, 'fuelSystemStatus', 'fuelsystemstatus', 'fuel_consumption', 'Fuel_Consumption') or 0.0,
                        'timestamp': timestamp,
                        'absActive': None, 'brakePressure': None, 'espActive': None, 'gearPosition': None, 'steeringAngle': None, 'temperature': None, 'throttlePosition': None
                    })
                    ejemplos.append({'timestamp': timestamp, 'engineRpm': engine_rpm})
                    count += 1
                except Exception as e:
                    DESCARTES['CAN'].append((i, f'ERROR SQL CAN: {e}'))
                    logger.error(f"   ❌ ERROR SQL CAN: {e}\n{traceback.format_exc()}")
            conn.commit()
            logger.info(f"    ✅ Subidos {count} puntos CAN")
            if ejemplos:
                logger.info(f"    📋 Ejemplo filas CAN insertadas: {ejemplos[:2]}")
            else:
                logger.info(f"    ⚠️ No se insertaron filas CAN válidas.")
        except Exception as e:
            logger.error(f"   ❌ Error subiendo CAN: {e}\n{traceback.format_exc()}")

    def _upload_gps_data(self, conn, session_id: str, gps_data: list):
        import traceback
        from datetime import datetime
        try:
            if not gps_data:
                logger.warning(f"   ⚠️  No se pudieron cargar datos GPS para la sesión {session_id}")
                return
            cur = conn.cursor()
            count = 0
            for idx, point in enumerate(gps_data):
                try:
                    ts = point.get('timestamp')
                    if isinstance(ts, str):
                        try:
                            ts_dt = datetime.strptime(ts.strip(), '%d/%m/%Y %I:%M:%S%p')
                        except Exception:
                            try:
                                ts_dt = datetime.strptime(ts.strip(), '%Y-%m-%d %H:%M:%S')
                            except Exception:
                                try:
                                    ts_dt = datetime.strptime(ts.strip(), '%Y-%m-%d %H:%M')
                                except Exception:
                                    ts_dt = datetime(2025, 7, 10, 12, 0, 0)
                    elif isinstance(ts, datetime):
                        ts_dt = ts
                    else:
                        DESCARTES['GPS'].append((idx, 'Timestamp GPS inválido'))
                        continue
                    cur.execute('''
                        INSERT INTO "GpsMeasurement" (
                            id, "sessionId", "timestamp", "latitude", "longitude", "altitude", "speed", "satellites", "quality", "createdAt", "hdop", "updatedAt", "fix", "heading", "accuracy"
                        ) VALUES (
                            gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s, NOW(), %s, %s, %s
                        )
                        ON CONFLICT DO NOTHING
                    ''', (
                        session_id,
                        ts_dt,
                        float(point.get('latitude', 0)),
                        float(point.get('longitude', 0)),
                        float(point.get('altitude', 0)),
                        float(point.get('speed', 0)),
                        int(point.get('satellites', 0)),
                        point.get('quality'),
                        point.get('hdop'),
                        point.get('fix'),
                        point.get('heading'),
                        point.get('accuracy'),
                    ))
                    logger.info(f"    GPS insertado con sessionId={session_id}")
                    count += 1
                except Exception as e:
                    DESCARTES['GPS'].append((idx, f'ERROR SQL GPS: {e}'))
                    logger.error(f"❌ ERROR SQL GPS: {e}\n{traceback.format_exc()}")
                    continue
            conn.commit()
            logger.info(f"    ✅ Subidos {count} puntos GPS")
        except Exception as e:
            logger.error(f"   ❌ Error subiendo GPS: {e}\n{traceback.format_exc()}")

    def _upload_stability_data(self, conn, session_id: str, stability_data: list):
        import traceback
        from datetime import datetime
        import uuid
        ejemplos = []
        errores = []
        try:
            if not stability_data:
                logger.warning(f"   ⚠️  No se pudieron cargar datos ESTABILIDAD para la sesión {session_id}")
                return
            cur = conn.cursor()
            count = 0
            for idx, row in enumerate(stability_data):
                try:
                    row_id = str(uuid.uuid4())
                    def to_float(val, default=0.0):
                        try:
                            return float(val)
                        except Exception:
                            return default
                    def to_bool(val, default=False):
                        if isinstance(val, bool):
                            return val
                        if isinstance(val, str):
                            return val.strip().lower() in ("1", "true", "t", "yes", "y", "si")
                        return default
                    insert_data = {
                        'id': row_id,
                        'timestamp': row.get('timestamp'),
                        'ax': to_float(row.get('ax')),
                        'ay': to_float(row.get('ay')),
                        'az': to_float(row.get('az')),
                        'gx': to_float(row.get('gx')),
                        'gy': to_float(row.get('gy')),
                        'gz': to_float(row.get('gz')),
                        'sessionId': session_id,
                        'createdAt': datetime.utcnow(),
                        'updatedAt': datetime.utcnow(),
                        'isDRSHigh': to_bool(row.get('isDRSHigh', False)),
                        'isLTRCritical': to_bool(row.get('isLTRCritical', False)),
                        'isLateralGForceHigh': to_bool(row.get('isLateralGForceHigh', False)),
                        'accmag': to_float(row.get('accmag', 0)),
                        'microsds': to_float(row.get('microsds', 0)),
                        'si': to_float(row.get('si', 0)),
                        'usciclo1': to_float(row.get('usciclo1', 0)),
                        'usciclo2': to_float(row.get('usciclo2', 0)),
                        'usciclo3': to_float(row.get('usciclo3', 0)),
                        'usciclo4': to_float(row.get('usciclo4', 0)),
                        'usciclo5': to_float(row.get('usciclo5', 0)),
                        'usciclo6': to_float(row.get('usciclo6', 0)),
                        'usciclo7': to_float(row.get('usciclo7', 0)),
                        'usciclo8': to_float(row.get('usciclo8', 0)),
                    }
                    for opt in ['roll', 'pitch', 'yaw', 'timeantwifi', 'temperature']:
                        insert_data[opt] = to_float(row.get(opt)) if row.get(opt) is not None else None
                    columns = ', '.join(f'"{k}"' for k in insert_data.keys())
                    values = ', '.join(['%s'] * len(insert_data))
                    sql = f'INSERT INTO "StabilityMeasurement" ({columns}) VALUES ({values})'
                    cur.execute(sql, list(insert_data.values()))
                    count += 1
                    if count <= 3:
                        ejemplos.append(insert_data)
                except Exception as e:
                    DESCARTES['ESTABILIDAD'].append((idx, f'ERROR SQL ESTABILIDAD: {e}'))
                    logger.warning(f"   ⚠️  Error insertando fila ESTABILIDAD idx={idx}: {e}\nFila: {row}")
            conn.commit()
            logger.info(f"   ✅ Subidos {count} puntos de ESTABILIDAD para sesión {session_id}")
            if ejemplos:
                logger.info(f"   Ejemplo(s) de fila insertada: {ejemplos}")
            if errores:
                logger.error(f"   ❌ {len(errores)} filas de ESTABILIDAD fallidas. Ejemplo: {errores[0]}")
        except Exception as e:
            logger.error(f"   ❌ Error crítico en _upload_stability_data: {e}\n{traceback.format_exc()}")

    def _upload_rotativo_data(self, conn, session_id: str, rotativo_data: list):
        try:
            if not rotativo_data:
                logger.warning(f"   ⚠️  No se pudieron cargar datos ROTATIVO para la sesión {session_id}")
                return
            cur = conn.cursor()
            uploaded_count = 0
            for idx, point in enumerate(rotativo_data):
                point['sessionId'] = session_id
                if any(point.get(k) is None for k in ["timestamp", "state"]):
                    DESCARTES['ROTATIVO'].append((idx, 'Punto ROTATIVO incompleto (faltan obligatorios)'))
                    logger.warning(f"⚠️  Punto ROTATIVO incompleto (faltan obligatorios): {point}")
                    continue
                try:
                    cur.execute('''
                        INSERT INTO "RotativoMeasurement" (
                            id, "sessionId", timestamp, state, "createdAt", "updatedAt"
                        ) VALUES (%s, %s, %s, %s, NOW(), NOW())
                        ON CONFLICT ("sessionId", timestamp) DO NOTHING
                    ''', (
                        str(uuid.uuid4()), session_id, point["timestamp"], point["state"]
                    ))
                    logger.info(f"    ROTATIVO insertado con sessionId={session_id}")
                    uploaded_count += 1
                except Exception as e:
                    DESCARTES['ROTATIVO'].append((idx, f'ERROR SQL ROTATIVO: {e}'))
                    logger.error(f"❌ ERROR SQL ROTATIVO: {e}")
                    conn.rollback()
                    continue
            conn.commit()
            logger.info(f"   ✅ Subidos {uploaded_count} puntos ROTATIVO")
        except Exception as e:
            logger.error(f"   ❌ Error subiendo datos ROTATIVO: {e}")

if __name__ == "__main__":
    CompleteProcessor().run() 