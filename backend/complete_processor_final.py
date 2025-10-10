#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Procesador final para Doback Soft - Versión estable
Soluciona todos los problemas identificados sin emojis
"""

import os
import re
import csv
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuración
DB_CONFIG = {
    'host': 'localhost',
    'database': 'dobacksoft',
    'user': 'postgres',
    'password': 'cosigein',
    'port': 5432
}

# Configurar logging sin emojis
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('procesador_final.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Contador de descartes
DESCARTES = {
    'CAN': [],
    'GPS': [],
    'ESTABILIDAD': [],
    'ROTATIVO': []
}

class CompleteProcessorFinal:
    def __init__(self, organization_name: str = 'CMadrid'):
        self.organization_name = organization_name
        self.data_dir = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback', organization_name)
        self.db_config = DB_CONFIG
        
    def run(self):
        """Ejecuta el procesamiento completo"""
        logger.info("Iniciando procesador final")
        logger.info(f"Directorio: {self.data_dir}")
        
        if not os.path.exists(self.data_dir):
            logger.error(f"Directorio no encontrado: {self.data_dir}")
            return
        
        # Escanear todas las sesiones
        sesiones = self._scan_all_sessions_final()
        logger.info(f"Sesiones detectadas: {len(sesiones)}")
        
        if not sesiones:
            logger.warning("No se encontraron sesiones para procesar")
            return
        
        # Procesar cada sesión con conexión individual
        for i, session in enumerate(sesiones, 1):
            logger.info(f"Procesando sesion {i}/{len(sesiones)}: {session['vehicle']} {session['date']}")
            
            # Conectar a BD para cada sesión
            conn = psycopg2.connect(**self.db_config)
            try:
                # Crear o obtener sesión
                session_id = self._create_or_get_session(conn, session['vehicle'], session['date'])
                if not session_id:
                    logger.error(f"No se pudo crear/obtener sesion para {session['vehicle']} {session['date']}")
                    continue
                
                # Procesar cada tipo de archivo
                for tipo, archivos in session['files'].items():
                    logger.info(f"  Procesando {tipo}: {len(archivos)} archivos")
                    
                    for archivo in archivos:
                        if tipo == 'CAN':
                            can_data = self._load_can_data_final(archivo)
                            if can_data:
                                self._upload_can_data(conn, session_id, can_data)
                        elif tipo == 'GPS':
                            gps_data = self._load_gps_data_final(archivo)
                            if gps_data:
                                self._upload_gps_data(conn, session_id, gps_data)
                        elif tipo == 'ESTABILIDAD':
                            stability_data = self._load_stability_data_final(archivo)
                            if stability_data:
                                self._upload_stability_data(conn, session_id, stability_data)
                        elif tipo == 'ROTATIVO':
                            rotativo_data = self._load_rotativo_data_final(archivo)
                            if rotativo_data:
                                self._upload_rotativo_data(conn, session_id, rotativo_data)
                
            except Exception as e:
                logger.error(f"Error procesando sesion {session['vehicle']} {session['date']}: {e}")
            finally:
                conn.close()
            
            logger.info(f"Sesion {i} completada")
        
        logger.info("Procesamiento completado")
        self._guardar_resumen_descartes()
    
    def _scan_all_sessions_final(self) -> List[Dict]:
        """Escanea y agrupa archivos por sesión de forma correcta"""
        sesiones = {}
        
        for vehicle_dir in os.listdir(self.data_dir):
            vehicle_path = os.path.join(self.data_dir, vehicle_dir)
            if not os.path.isdir(vehicle_path):
                continue
            
            for type_dir in os.listdir(vehicle_path):
                type_path = os.path.join(vehicle_path, type_dir)
                if not os.path.isdir(type_path):
                    continue
                
                tipo = type_dir.upper()
                
                # Agrupar archivos por sesión
                archivos_por_sesion = {}
                
                for filename in os.listdir(type_path):
                    if not (filename.endswith('.txt') or filename.endswith('.csv')):
                        continue
                    
                    file_path = os.path.join(type_path, filename)
                    
                    # Extraer información del archivo
                    info = self._extract_file_info_final(filename, vehicle_dir)
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
    
    def _extract_file_info_final(self, filename: str, vehicle_dir: str) -> Optional[Tuple[str, str, str]]:
        """Extrae información del archivo de forma robusta"""
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
    
    def _load_can_data_final(self, file_path: str) -> List[Dict]:
        """Carga datos CAN de forma corregida"""
        data = []
        try:
            logger.info(f"    Cargando CAN: {os.path.basename(file_path)}")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Buscar línea de datos reales (después de comentarios y cabecera)
            data_start_line = None
            for i, line in enumerate(lines):
                if 'Timestamp' in line and ('Engine_Speed' in line or 'Parameter_Group_Number' in line):
                    data_start_line = i
                    break
            
            if data_start_line is None:
                logger.warning(f"    No se encontro header de datos en {file_path}")
                return []
            
            # Parsear datos
            reader = csv.DictReader(lines[data_start_line:])
            for i, row in enumerate(reader):
                if not row or all(not v or v.strip() == '' for v in row.values()):
                    DESCARTES['CAN'].append((i + data_start_line + 2, 'Fila vacia'))
                    continue
                
                # Extraer timestamp
                timestamp_str = row.get('Timestamp', '')
                if not timestamp_str:
                    DESCARTES['CAN'].append((i + data_start_line + 2, 'Sin timestamp'))
                    continue
                
                try:
                    # Parsear timestamp (formato: 10/07/2025 08:15:34AM)
                    timestamp = datetime.strptime(timestamp_str, "%d/%m/%Y %I:%M:%S%p")
                except:
                    DESCARTES['CAN'].append((i + data_start_line + 2, f'Timestamp invalido: {timestamp_str}'))
                    continue
                
                # Extraer valores numéricos
                engine_speed = self._parse_float(row.get('Engine_Speed', '0'))
                engine_torque = self._parse_float(row.get('Engine_Torque', '0'))
                engine_temp = self._parse_float(row.get('Engine_Temperature', '0'))
                fuel_consumption = self._parse_float(row.get('Fuel_Consumption', '0'))
                
                data.append({
                    'timestamp': timestamp,
                    'engine_speed': engine_speed,
                    'engine_torque': engine_torque,
                    'engine_temperature': engine_temp,
                    'fuel_consumption': fuel_consumption
                })
            
            logger.info(f"    CAN: {len(data)} puntos cargados")
            
        except Exception as e:
            logger.error(f"    Error cargando CAN: {e}")
        
        return data
    
    def _load_gps_data_final(self, file_path: str) -> List[Dict]:
        """Carga datos GPS de forma corregida"""
        data = []
        try:
            logger.info(f"    Cargando GPS: {os.path.basename(file_path)}")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            if len(lines) < 2:
                logger.warning(f"    Archivo GPS muy corto: {file_path}")
                return []
            
            # Buscar línea de datos (después de cabecera)
            data_start_line = 1  # Asumir que la línea 1 es el header
            
            # Parsear datos
            reader = csv.DictReader(lines[data_start_line:])
            for i, row in enumerate(reader):
                if not row:
                    continue
                
                fecha = row.get('Fecha', '')
                hora = row.get('Hora', '')
                lat = row.get('Latitud', '')
                lon = row.get('Longitud', '')
                
                if not (fecha and hora and lat and lon):
                    DESCARTES['GPS'].append((i + data_start_line + 2, 'Campos faltantes'))
                    continue
                
                # Verificar si hay datos GPS válidos
                if 'sin datos' in lat.lower() or 'sin datos' in lon.lower():
                    DESCARTES['GPS'].append((i + data_start_line + 2, 'Sin datos GPS'))
                    continue
                
                try:
                    # Parsear timestamp
                    timestamp_str = f"{fecha.strip()} {hora.strip()}"
                    timestamp = datetime.strptime(timestamp_str, "%d/%m/%Y %H:%M:%S")
                    
                    # Parsear coordenadas
                    latitude = float(lat)
                    longitude = float(lon)
                    
                    # Otros campos opcionales
                    altitude = self._parse_float(row.get('Altitud', '0'))
                    speed = self._parse_float(row.get('Velocidad(km/h)', '0'))
                    
                    data.append({
                        'timestamp': timestamp,
                        'latitude': latitude,
                        'longitude': longitude,
                        'altitude': altitude,
                        'speed': speed
                    })
                    
                except Exception as e:
                    DESCARTES['GPS'].append((i + data_start_line + 2, f'Error parsing: {e}'))
                    continue
            
            logger.info(f"    GPS: {len(data)} puntos cargados")
            
        except Exception as e:
            logger.error(f"    Error cargando GPS: {e}")
        
        return data
    
    def _load_stability_data_final(self, file_path: str) -> List[Dict]:
        """Carga datos de estabilidad de forma corregida"""
        data = []
        try:
            logger.info(f"    Cargando ESTABILIDAD: {os.path.basename(file_path)}")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            if len(lines) < 3:
                logger.warning(f"    Archivo ESTABILIDAD muy corto: {file_path}")
                return []
            
            # Parsear cabecera
            cabecera = lines[0].split(';')
            fecha_base_str = cabecera[1].strip()
            fecha_base = datetime.strptime(fecha_base_str, "%d/%m/%Y %I:%M:%S%p")
            
            # Parsear header de columnas
            header = [h.strip() for h in lines[1].split(';')]
            
            # Parsear datos
            for i, line in enumerate(lines[2:], 2):
                if not line.strip():
                    continue
                
                values = [v.strip() for v in line.split(';')]
                if len(values) < len(header):
                    DESCARTES['ESTABILIDAD'].append((i, 'Linea incompleta'))
                    continue
                
                try:
                    # Extraer valores principales
                    ax = self._parse_float(values[0])
                    ay = self._parse_float(values[1])
                    az = self._parse_float(values[2])
                    gx = self._parse_float(values[3])
                    gy = self._parse_float(values[4])
                    gz = self._parse_float(values[5])
                    roll = self._parse_float(values[6])
                    pitch = self._parse_float(values[7])
                    yaw = self._parse_float(values[8])
                    
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
            logger.error(f"    Error cargando ESTABILIDAD: {e}")
        
        return data
    
    def _load_rotativo_data_final(self, file_path: str) -> List[Dict]:
        """Carga datos rotativo de forma corregida"""
        data = []
        try:
            logger.info(f"    Cargando ROTATIVO: {os.path.basename(file_path)}")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            if len(lines) < 2:
                logger.warning(f"    Archivo ROTATIVO muy corto: {file_path}")
                return []
            
            # Parsear datos (saltar header)
            for i, line in enumerate(lines[1:], 2):
                if not line.strip():
                    continue
                
                parts = line.strip().split(';')
                if len(parts) < 2:
                    DESCARTES['ROTATIVO'].append((i, 'Linea incompleta'))
                    continue
                
                try:
                    timestamp_str = parts[0].strip()
                    estado = int(parts[1].strip())
                    
                    timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
                    
                    data.append({
                        'timestamp': timestamp,
                        'estado': estado
                    })
                    
                except Exception as e:
                    DESCARTES['ROTATIVO'].append((i, f'Error parsing: {e}'))
                    continue
            
            logger.info(f"    ROTATIVO: {len(data)} puntos cargados")
            
        except Exception as e:
            logger.error(f"    Error cargando ROTATIVO: {e}")
        
        return data
    
    def _parse_float(self, value: str, default: float = 0.0) -> float:
        """Parsea un valor a float de forma segura"""
        if not value or value.strip() == '' or value.lower() == 'sin datos':
            return default
        try:
            return float(value.strip())
        except:
            return default
    
    def _create_or_get_session(self, conn, vehicle: str, date: str) -> Optional[str]:
        """Crea o obtiene una sesión existente"""
        try:
            cur = conn.cursor()
            
            # Buscar vehicleId
            cur.execute('SELECT id FROM "Vehicle" WHERE name = %s LIMIT 1', (vehicle,))
            vehicle_row = cur.fetchone()
            if not vehicle_row:
                logger.error(f"    Vehicle no encontrado: {vehicle}")
                return None
            vehicle_id = vehicle_row[0]
            
            # Buscar organizationId
            cur.execute('SELECT id FROM "Organization" WHERE name = %s LIMIT 1', (self.organization_name,))
            org_row = cur.fetchone()
            if not org_row:
                logger.error(f"    Organization no encontrada: {self.organization_name}")
                return None
            org_id = org_row[0]
            
            # Buscar sesión existente
            start_time = datetime.strptime(date, "%Y-%m-%d")
            cur.execute('''SELECT id FROM "Session" WHERE "vehicleId" = %s AND "organizationId" = %s AND DATE("startTime") = %s LIMIT 1''', 
                      (vehicle_id, org_id, start_time))
            session_row = cur.fetchone()
            
            if session_row:
                session_id = session_row[0]
                logger.info(f"    Sesion existente: {session_id}")
            else:
                # Crear nueva sesión
                session_id = self._create_session(conn, vehicle_id, org_id, start_time)
                logger.info(f"    Nueva sesion creada: {session_id}")
            
            cur.close()
            return session_id
            
        except Exception as e:
            logger.error(f"    Error creando/obteniendo sesion: {e}")
            return None
    
    def _create_session(self, conn, vehicle_id: str, org_id: str, start_time: datetime) -> str:
        """Crea una nueva sesión"""
        cur = conn.cursor()
        cur.execute('''INSERT INTO "Session" ("vehicleId", "organizationId", "startTime", "sessionNumber", "status", "createdAt", "updatedAt") 
                      VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id''',
                   (vehicle_id, org_id, start_time, 1, 'ACTIVE', datetime.now(), datetime.now()))
        session_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        return session_id
    
    def _upload_can_data(self, conn, session_id: str, can_data: List[Dict]):
        """Sube datos CAN a la base de datos"""
        if not can_data:
            return
        
        try:
            cur = conn.cursor()
            
            for data_point in can_data:
                cur.execute('''INSERT INTO "CanMeasurement" ("sessionId", "timestamp", "engineSpeed", "engineTorque", "engineTemperature", "fuelConsumption", "createdAt", "updatedAt") 
                              VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''',
                           (session_id, data_point['timestamp'], data_point['engine_speed'], 
                            data_point['engine_torque'], data_point['engine_temperature'], 
                            data_point['fuel_consumption'], datetime.now(), datetime.now()))
            
            conn.commit()
            cur.close()
            logger.info(f"    CAN: {len(can_data)} puntos subidos")
            
        except Exception as e:
            logger.error(f"    Error subiendo CAN: {e}")
            conn.rollback()
    
    def _upload_gps_data(self, conn, session_id: str, gps_data: List[Dict]):
        """Sube datos GPS a la base de datos"""
        if not gps_data:
            return
        
        try:
            cur = conn.cursor()
            
            for data_point in gps_data:
                cur.execute('''INSERT INTO "GpsMeasurement" ("sessionId", "timestamp", "latitude", "longitude", "altitude", "speed", "createdAt", "updatedAt") 
                              VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''',
                           (session_id, data_point['timestamp'], data_point['latitude'], 
                            data_point['longitude'], data_point['altitude'], data_point['speed'],
                            datetime.now(), datetime.now()))
            
            conn.commit()
            cur.close()
            logger.info(f"    GPS: {len(gps_data)} puntos subidos")
            
        except Exception as e:
            logger.error(f"    Error subiendo GPS: {e}")
            conn.rollback()
    
    def _upload_stability_data(self, conn, session_id: str, stability_data: List[Dict]):
        """Sube datos de estabilidad a la base de datos"""
        if not stability_data:
            return
        
        try:
            cur = conn.cursor()
            
            for data_point in stability_data:
                cur.execute('''INSERT INTO "StabilityMeasurement" ("sessionId", "timestamp", "ax", "ay", "az", "gx", "gy", "gz", "roll", "pitch", "yaw", "createdAt", "updatedAt") 
                              VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                           (session_id, data_point['timestamp'], data_point['ax'], data_point['ay'], 
                            data_point['az'], data_point['gx'], data_point['gy'], data_point['gz'],
                            data_point['roll'], data_point['pitch'], data_point['yaw'],
                            datetime.now(), datetime.now()))
            
            conn.commit()
            cur.close()
            logger.info(f"    ESTABILIDAD: {len(stability_data)} puntos subidos")
            
        except Exception as e:
            logger.error(f"    Error subiendo ESTABILIDAD: {e}")
            conn.rollback()
    
    def _upload_rotativo_data(self, conn, session_id: str, rotativo_data: List[Dict]):
        """Sube datos rotativo a la base de datos"""
        if not rotativo_data:
            return
        
        try:
            cur = conn.cursor()
            
            for data_point in rotativo_data:
                cur.execute('''INSERT INTO "RotativoMeasurement" ("sessionId", "timestamp", "estado", "createdAt", "updatedAt") 
                              VALUES (%s, %s, %s, %s, %s)''',
                           (session_id, data_point['timestamp'], data_point['estado'],
                            datetime.now(), datetime.now()))
            
            conn.commit()
            cur.close()
            logger.info(f"    ROTATIVO: {len(rotativo_data)} puntos subidos")
            
        except Exception as e:
            logger.error(f"    Error subiendo ROTATIVO: {e}")
            conn.rollback()
    
    def _guardar_resumen_descartes(self):
        """Guarda resumen de descartes"""
        resumen = {
            'fecha': datetime.now().isoformat(),
            'descartes': DESCARTES,
            'totales': {tipo: len(descartes) for tipo, descartes in DESCARTES.items()}
        }
        
        with open('resumen_descartes_final.json', 'w', encoding='utf-8') as f:
            json.dump(resumen, f, indent=2, ensure_ascii=False, default=str)
        
        logger.info("Resumen de descartes guardado")

if __name__ == "__main__":
    processor = CompleteProcessorFinal()
    processor.run() 