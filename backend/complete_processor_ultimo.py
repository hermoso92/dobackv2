#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Procesador completo Doback Soft - Versión final
Combina la lógica robusta del fixed con procesamiento completo
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

# Configuración de base de datos
DB_CONFIG = {
    'host': 'localhost',
    'database': 'dobacksoft',
    'user': 'postgres',
    'password': 'cosigein',
    'port': 5432
}

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback', 'CMadrid')

# Estructura para resumen de integridad
from collections import defaultdict

# Variables globales para resumen de descartes
DESCARTES = {
    'GPS': [],
    'CAN': [],
    'ESTABILIDAD': [],
    'ROTATIVO': []
}

class CompleteProcessorUltimo:
    """Procesador completo para Doback Soft - Versión final."""
    
    def __init__(self):
        self.data_dir = DATA_DIR
        self.db_config = DB_CONFIG
        self.organization_name = 'CMadrid'
        self.user_id = 'a8071944-989c-4627-b8a7-71aa03f24180'  # admin@cmadrid.com
        
    def run(self):
        """Procesa todas las sesiones detectadas."""
        logger.info("=== INICIO PROCESAMIENTO COMPLETO ===")
        
        # Escanear todas las sesiones
        sesiones = self._scan_all_sessions()
        logger.info(f"📊 Sesiones detectadas: {len(sesiones)}")
        
        if not sesiones:
            logger.warning("⚠️ No se encontraron sesiones para procesar")
            return
        
        # Conectar a BD
        conn = psycopg2.connect(**self.db_config)
        try:
            # Procesar cada sesión
            for i, session in enumerate(sesiones, 1):
                logger.info(f"\n=== Procesando sesión {i}/{len(sesiones)}: {session['vehicle']} {session['date']} ===")
                
                # Crear o obtener sesión
                session_id = self._create_or_get_session(conn, session['vehicle'], session['date'])
                if not session_id:
                    logger.error(f"❌ No se pudo crear/obtener sesión para {session['vehicle']} {session['date']}")
                    continue
                
                logger.info(f"✅ Sesión creada/obtenida con id: {session_id}")
                
                # Procesar cada tipo de archivo
                for tipo, archivos in session['files'].items():
                    logger.info(f"📄 Procesando {tipo}: {len(archivos)} archivos")
                    
                    for archivo in archivos:
                        if tipo == 'CAN':
                            can_data = self._load_can_data(archivo)
                            if can_data:
                                self._upload_can_data(conn, session_id, can_data)
                        elif tipo == 'GPS':
                            gps_data = self._load_gps_data(archivo)
                            if gps_data:
                                self._upload_gps_data(conn, session_id, gps_data)
                        elif tipo == 'ESTABILIDAD':
                            stability_data = self._load_stability_data(archivo)
                            if stability_data:
                                self._upload_stability_data(conn, session_id, stability_data)
                        elif tipo == 'ROTATIVO':
                            rotativo_data = self._load_rotativo_data(archivo)
                            if rotativo_data:
                                self._upload_rotativo_data(conn, session_id, rotativo_data)
                
                logger.info(f"✅ Sesión {i} completada")
            
            logger.info("\n=== PROCESAMIENTO COMPLETO FINALIZADO ===")
            self._guardar_resumen_descartes()
            
        finally:
            conn.close()
    
    def _scan_all_sessions(self) -> List[Dict]:
        """Escanea y agrupa archivos por sesión de forma correcta."""
        sesiones = {}
        
        if not os.path.exists(self.data_dir):
            logger.error(f"❌ Directorio no encontrado: {self.data_dir}")
            return []
        
        for vehicle_dir in os.listdir(self.data_dir):
            vehicle_path = os.path.join(self.data_dir, vehicle_dir)
            if not os.path.isdir(vehicle_path):
                continue
            
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
                
                tipo = type_mapping.get(type_dir.upper())
                if not tipo:
                    continue
                
                # Agrupar archivos por sesión
                archivos_por_sesion = {}
                
                for filename in os.listdir(type_path):
                    if not (filename.endswith('.txt') or filename.endswith('.csv')):
                        continue
                    
                    file_path = os.path.join(type_path, filename)
                    
                    # Extraer información del archivo
                    info = self._extract_file_info(filename, vehicle_dir)
                    if not info:
                        continue
                    
                    vehicle, date, sequence = info
                    key = f"{vehicle}_{date}_{sequence}"
                    
                    if key not in archivos_por_sesion:
                        archivos_por_sesion[key] = []
                    
                    archivos_por_sesion[key].append(file_path)
                
                # Agregar a sesiones principales
                for session_key, archivos in archivos_por_sesion.items():
                    vehicle, date, sequence = session_key.split('_', 2)
                    
                    # Clave principal sin secuencia para agrupar por día
                    main_key = f"{vehicle}_{date}"
                    
                    if main_key not in sesiones:
                        sesiones[main_key] = {
                            'vehicle': vehicle,
                            'date': date,
                            'files': {}
                        }
                    
                    if tipo not in sesiones[main_key]['files']:
                        sesiones[main_key]['files'][tipo] = []
                    
                    sesiones[main_key]['files'][tipo].extend(archivos)
        
        return list(sesiones.values())
    
    def _extract_file_info(self, filename: str, vehicle_dir: str) -> Optional[Tuple[str, str, str]]:
        """Extrae información del archivo de forma robusta."""
        # Patrón principal: TIPO_DOBACK<vehículo>_<YYYYMMDD>_<secuencia>
        match = re.search(r'_(DOBACK\d+)_(\d{8})_(\d+)', filename)
        if match:
            vehicle = match.group(1).lower()
            date_str = match.group(2)
            sequence = match.group(3)
            date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
            return vehicle, date, sequence
        
        # Patrón alternativo para archivos sin secuencia
        match = re.search(r'_(DOBACK\d+)_(\d{8})', filename)
        if match:
            vehicle = match.group(1).lower()
            date_str = match.group(2)
            date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
            return vehicle, date, "0"
        
        # Para archivos RealTime, usar fecha actual
        if 'realtime' in filename.lower():
            vehicle = vehicle_dir.lower()
            date = datetime.now().strftime("%Y-%m-%d")
            return vehicle, date, "realtime"
        
        return None
    
    def _create_or_get_session(self, conn, vehicle: str, date: str) -> Optional[str]:
        """Crea o obtiene una sesión existente."""
        try:
            cur = conn.cursor()
            
            # Buscar vehicleId
            cur.execute('SELECT id FROM "Vehicle" WHERE name = %s LIMIT 1', (vehicle,))
            vehicle_row = cur.fetchone()
            if not vehicle_row:
                logger.error(f"❌ Vehicle no encontrado: {vehicle}")
                return None
            vehicle_id = vehicle_row[0]
            
            # Buscar organizationId
            cur.execute('SELECT id FROM "Organization" WHERE name = %s LIMIT 1', (self.organization_name,))
            org_row = cur.fetchone()
            if not org_row:
                logger.error(f"❌ Organization no encontrada: {self.organization_name}")
                return None
            org_id = org_row[0]
            
            # Buscar sesión existente
            start_time = datetime.strptime(date, "%Y-%m-%d")
            cur.execute('''SELECT id FROM "Session" WHERE "vehicleId" = %s AND "organizationId" = %s AND DATE("startTime") = %s LIMIT 1''', 
                      (vehicle_id, org_id, start_time))
            session_row = cur.fetchone()
            
            if session_row:
                session_id = session_row[0]
                logger.info(f"✅ Sesión existente: {session_id}")
            else:
                # Crear nueva sesión
                session_id = self._create_session(conn, vehicle_id, org_id, start_time)
                logger.info(f"➕ Nueva sesión creada: {session_id}")
            
            cur.close()
            return session_id
            
        except Exception as e:
            logger.error(f"❌ Error creando/obteniendo sesión: {e}")
            return None
    
    def _create_session(self, conn, vehicle_id: str, org_id: str, start_time: datetime) -> str:
        """Crea una nueva sesión."""
        cur = conn.cursor()
        cur.execute('''INSERT INTO "Session" (id, "userId", "vehicleId", "organizationId", "startTime", "sessionNumber", "status", "createdAt", "updatedAt", "sequence") 
                      VALUES (nextval('"Session_id_seq"'), %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id''',
                   (self.user_id, vehicle_id, org_id, start_time, 1, 'ACTIVE', datetime.now(), datetime.now(), 1))
        session_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        return session_id
    
    # Métodos de parsing y subida del fixed (copiados exactamente)
    def _find_real_header_line(self, lines, file_type=None):
        """Encuentra la línea de header real en el archivo."""
        # Palabras clave típicas por tipo
        keywords = {
            'CAN': ['timestamp', 'engine', 'rpm', 'vehicle', 'speed', 'torque'],
            'ESTABILIDAD': ['ax', 'ay', 'az', 'gx', 'gy', 'gz', 'si', 'accmag']
        }
        keys = keywords.get(file_type.upper(), []) if file_type else []
        for idx, line in enumerate(lines):
            sep = ',' if line.count(',') > line.count(';') else ';'
            if line is None:
                continue
            parts = [p.strip().lower() if p is not None else '' for p in line.strip().split(sep)]
            if len(parts) >= 3 and sum(1 for k in keys if any(k in col for col in parts)) >= 3:
                return idx, sep
        return None, None
    
    def _load_can_data(self, file_path: str) -> list:
        """Carga datos CAN usando la lógica del fixed."""
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
        """Carga datos GPS usando la lógica del fixed."""
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
        """Carga datos de estabilidad usando la lógica del fixed."""
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
            for i, line in enumerate(lines[2:], 2):
                if not line.strip():
                    continue
                values = [v.strip() for v in line.split(';')]
                if len(values) < len(header):
                    DESCARTES['ESTABILIDAD'].append((i, 'Línea incompleta'))
                    continue
                try:
                    # Extraer valores principales
                    ax = float(values[0]) if values[0] else 0.0
                    ay = float(values[1]) if values[1] else 0.0
                    az = float(values[2]) if values[2] else 0.0
                    gx = float(values[3]) if values[3] else 0.0
                    gy = float(values[4]) if values[4] else 0.0
                    gz = float(values[5]) if values[5] else 0.0
                    roll = float(values[6]) if len(values) > 6 and values[6] else 0.0
                    pitch = float(values[7]) if len(values) > 7 and values[7] else 0.0
                    yaw = float(values[8]) if len(values) > 8 and values[8] else 0.0
                    
                    # Calcular timestamp (asumiendo intervalos regulares)
                    timestamp = fecha_base + timedelta(milliseconds=i * 100)  # 100ms por línea
                    
                    data.append({
                        'timestamp': timestamp,
                        'ax': ax, 'ay': ay, 'az': az,
                        'gx': gx, 'gy': gy, 'gz': gz,
                        'roll': roll, 'pitch': pitch, 'yaw': yaw
                    })
                    
                except Exception as e:
                    DESCARTES['ESTABILIDAD'].append((i, f'Error parsing: {e}'))
                    continue
            logger.info(f"    ESTABILIDAD: {len(data)} puntos cargados")
        except Exception as e:
            logger.error(f"    ❌ Error cargando ESTABILIDAD: {e}")
        return data
    
    def _load_rotativo_data(self, file_path: str) -> list:
        """Carga datos rotativo usando la lógica del fixed."""
        data = []
        try:
            logger.info(f"    🔍 Cargando ROTATIVO desde: {file_path}")
            with open(file_path, encoding="utf-8") as f:
                lines = f.readlines()
            if len(lines) < 2:
                logger.warning(f"    ⚠️ Archivo ROTATIVO muy corto: {file_path}")
                return []
            for i, line in enumerate(lines[1:], 2):
                if not line.strip():
                    continue
                parts = line.strip().split(';')
                if len(parts) < 2:
                    DESCARTES['ROTATIVO'].append((i, 'Línea incompleta'))
                    continue
                try:
                    timestamp_str = parts[0].strip()
                    estado = int(parts[1].strip())
                    timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
                    data.append({
                        'timestamp': timestamp,
                        'state': estado
                    })
                except Exception as e:
                    DESCARTES['ROTATIVO'].append((i, f'Error parsing: {e}'))
                    continue
            logger.info(f"    ROTATIVO: {len(data)} puntos cargados")
        except Exception as e:
            logger.error(f"    ❌ Error cargando ROTATIVO: {e}")
        return data
    
    # Métodos de subida del fixed (copiados exactamente)
    def _upload_can_data(self, conn, session_id: str, can_data: list):
        """Sube datos CAN usando la lógica del fixed."""
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
        """Sube datos GPS usando la lógica del fixed."""
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
        """Sube datos de estabilidad usando la lógica del fixed."""
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
        """Sube datos rotativo usando la lógica del fixed."""
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
    
    def _guardar_resumen_descartes(self):
        """Guarda resumen de descartes."""
        resumen = {
            'fecha': datetime.now().isoformat(),
            'descartes': DESCARTES,
            'totales': {tipo: len(descartes) for tipo, descartes in DESCARTES.items()}
        }
        
        with open('resumen_descartes_ultimo.json', 'w', encoding='utf-8') as f:
            json.dump(resumen, f, indent=2, ensure_ascii=False, default=str)
        
        logger.info("📊 Resumen de descartes guardado")

if __name__ == "__main__":
    CompleteProcessorUltimo().run() 