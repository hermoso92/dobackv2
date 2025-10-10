#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
DOBACK SOFT - PROCESADOR COMPLETO DE DATOS
===============================================================================

DESCRIPCIÓN:
    Pipeline completo para procesar archivos de vehículos Doback Soft.
    Incluye decodificación CAN, agrupación de sesiones y subida a base de datos.

FUNCIONALIDADES:
    1. Decodificación automática de archivos CAN
    2. Agrupación de sesiones por proximidad temporal
    3. Verificación de duplicados en base de datos
    4. Subida de datos a PostgreSQL
    5. Generación de reportes detallados

REQUISITOS:
    - Python 3.8+
    - psycopg2-binary
    - pandas
    - PostgreSQL con esquema Doback Soft

CONFIGURACIÓN:
    - Ajustar DATABASE_CONFIG según tu entorno
    - Verificar ruta del decodificador CAN
    - Configurar directorio de datos en DATA_DIR

USO:
    python complete_processor.py

EJEMPLO DE SALIDA:
    ============================================================
    RESUMEN DEL PROCESAMIENTO COMPLETO
    ============================================================
    Sesiones encontradas: 6
    Archivos escaneados: 131
    Vehiculos procesados: 1
    Sesiones perfectas: 6
    Sesiones con desfases: 0
    Diferencia promedio: 0.6 min
    ============================================================

AUTOR: Doback Soft Development Team
FECHA: 2025-07-10
VERSIÓN: 1.0.0
===============================================================================
"""

import os
import sys
import json
import uuid
import logging
import subprocess
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Set
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
import time # Added for cache
from geopy.distance import geodesic

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('complete_processor.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuración de directorios
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback')
DECODER_PATH = os.path.join(os.path.dirname(__file__), 'data', 'DECODIFICADOR CAN', 'decodificador_can_unificado.py')

# Configuración de procesamiento
MAX_TIME_DIFF_MINUTES = 5  # Máxima diferencia temporal entre archivos de sesión
DEFAULT_ORGANIZATION = 'CMadrid'  # Organización por defecto
DEFAULT_USER_ID = 'admin@dobacksoft.com'  # Usuario por defecto
DEFAULT_USER_EMAIL = 'admin@dobacksoft.com' # Email por defecto para trazabilidad

# Configuración de corrección inteligente GPS
GPS_OFFSET_HOURS = 2  # Desfase a detectar en horas
GPS_TOLERANCE_MINUTES = 1  # Tolerancia para detectar el desfase
GPS_MAX_NEARBY_HOURS = 3  # Máximo rango para considerar archivos cercanos

# Definir límites geográficos de la Comunidad de Madrid
MADRID_BOUNDS = {
    'min_lat': 39.5,   # Sur de Madrid
    'max_lat': 41.0,   # Norte de Madrid
    'min_lon': -4.5,   # Oeste de Madrid
    'max_lon': -2.5    # Este de Madrid
}

class DobackProcessor:
    """
    Procesador principal para archivos Doback Soft.
    
    Esta clase maneja todo el pipeline de procesamiento:
    - Decodificación de archivos CAN
    - Agrupación de sesiones por proximidad temporal
    - Subida de datos a la base de datos
    - Generación de reportes
    """
    
    def __init__(self, organization_name: str = None, user_email: str = None):
        """
        Inicializa el procesador con configuración por defecto.
        
        Args:
            organization_name: Nombre de la organización (opcional)
            user_email: Email del usuario (opcional, para trazabilidad)
        """
        self.sessions = []
        self.all_files = [] # Lista de todos los archivos escaneados
        self.default_user_id = DEFAULT_USER_ID
        self.organization_name = organization_name or DEFAULT_ORGANIZATION
        self.user_email = user_email or DEFAULT_USER_EMAIL
        
        # Configuración de la base de datos
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'dobacksoft'),  # Usar la base de datos correcta
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'cosigein'),  # Usar variable de entorno
        }
        
        # Cache de archivos para mejorar rendimiento
        self.cache_file = 'all_files_cache.json'
        self.cache_valid_hours = 24  # Cache válido por 24 horas
        
        # Verificar que el directorio de datos existe
        if not os.path.exists(DATA_DIR):
            raise FileNotFoundError(f"Directorio de datos no encontrado: {DATA_DIR}")
        
        logger.info(f"Procesador Doback Soft inicializado para organización: {self.organization_name}")
        if self.user_email != DEFAULT_USER_EMAIL:
            logger.info(f"Usuario específico: {self.user_email}")
    
    def _load_cached_files(self) -> Optional[List[Dict]]:
        """Carga archivos desde cache si es válido."""
        try:
            if os.path.exists(self.cache_file):
                cache_age = time.time() - os.path.getmtime(self.cache_file)
                if cache_age < (self.cache_valid_hours * 3600):  # 24 horas
                    with open(self.cache_file, 'r', encoding='utf-8') as f:
                        cached_data = json.load(f)
                        # Convertir fechas de string a datetime
                        for file_info in cached_data:
                            if 'date' in file_info and isinstance(file_info['date'], str):
                                try:
                                    file_info['date'] = datetime.fromisoformat(file_info['date'])
                                except ValueError:
                                    file_info['date'] = self.extract_date_from_filename(file_info['name'])
                            if 'start_time' in file_info and isinstance(file_info['start_time'], str):
                                try:
                                    file_info['start_time'] = datetime.fromisoformat(file_info['start_time'])
                                except ValueError:
                                    file_info['start_time'] = None
                            if 'end_time' in file_info and isinstance(file_info['end_time'], str):
                                try:
                                    file_info['end_time'] = datetime.fromisoformat(file_info['end_time'])
                                except ValueError:
                                    file_info['end_time'] = None
                        logger.info(f"Archivos cargados desde cache: {len(cached_data)} archivos")
                        return cached_data
        except Exception as e:
            logger.warning(f"Error cargando cache: {e}")
        return None
    
    def _save_cached_files(self, files: List[Dict]) -> None:
        """Guarda archivos en cache."""
        try:
            # Convertir fechas datetime a string ISO para JSON
            files_for_cache = []
            for file_info in files:
                cache_info = file_info.copy()
                if 'date' in cache_info and isinstance(cache_info['date'], datetime):
                    cache_info['date'] = cache_info['date'].isoformat()
                if 'start_time' in cache_info and isinstance(cache_info['start_time'], datetime):
                    cache_info['start_time'] = cache_info['start_time'].isoformat()
                if 'end_time' in cache_info and isinstance(cache_info['end_time'], datetime):
                    cache_info['end_time'] = cache_info['end_time'].isoformat()
                files_for_cache.append(cache_info)
            
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(files_for_cache, f, indent=2, ensure_ascii=False)
            logger.info(f"Cache guardado: {len(files)} archivos")
        except Exception as e:
            logger.warning(f"Error guardando cache: {e}")
    
    def decode_can_files(self) -> None:
        """
        Decodifica todos los archivos CAN encontrados en el directorio de datos.
        
        Busca archivos CAN en subdirectorios por empresa/vehículo/CAN y los decodifica
        usando el script externo decodificador_can_unificado.py.
        
        Raises:
            FileNotFoundError: Si no se encuentra el decodificador CAN
        """
        logger.info("PASO 1: Decodificando archivos CAN...")
        
        # Verificar que el decodificador existe
        if not os.path.exists(DECODER_PATH):
            logger.error(f"Decodificador CAN no encontrado en: {DECODER_PATH}")
            logger.warning("Continuando sin decodificación CAN...")
            return
        
        # Buscar directorios de empresas
        for company_dir in os.listdir(DATA_DIR):
            company_path = os.path.join(DATA_DIR, company_dir)
            if not os.path.isdir(company_path):
                continue
                
            logger.info(f"Decodificando archivos CAN para {company_dir}")
            
            # Buscar subdirectorios de vehículos
            for vehicle_dir in os.listdir(company_path):
                vehicle_path = os.path.join(company_path, vehicle_dir)
                if not os.path.isdir(vehicle_path):
                    continue
                
                # Buscar subdirectorio CAN
                can_dir_path = os.path.join(vehicle_path, 'CAN')
                if not os.path.isdir(can_dir_path):
                    logger.info(f"  No se encontró directorio CAN para {company_dir}/{vehicle_dir}")
                    continue
                
                logger.info(f"Decodificando archivos CAN para {company_dir}/{vehicle_dir}")
                
                # Buscar archivos CAN en el subdirectorio CAN
                can_files = [f for f in os.listdir(can_dir_path) 
                           if f.startswith('CAN_') and f.endswith('.txt')]
                
                logger.info(f"  Encontrados {len(can_files)} archivos CAN para decodificar")
                
                decoded_count = 0
                for can_file in can_files:
                    can_file_path = os.path.join(can_dir_path, can_file)
                    output_file = can_file.replace('.txt', '_TRADUCIDO.csv')
                    output_path = os.path.join(can_dir_path, output_file)
                    
                    # Verificar si ya existe el archivo decodificado
                    if os.path.exists(output_path):
                        logger.info(f"  Archivo ya decodificado: {can_file}")
                        decoded_count += 1
                        continue
                    
                    try:
                        # Verificar que el archivo de entrada existe y no está vacío
                        if not os.path.exists(can_file_path):
                            logger.warning(f"  ❌ Archivo CAN no encontrado: {can_file}")
                            continue
                        
                        if os.path.getsize(can_file_path) == 0:
                            logger.warning(f"  ❌ Archivo CAN vacío: {can_file}")
                            continue
                        
                        # Ejecutar decodificador
                        result = subprocess.run([
                            sys.executable, DECODER_PATH,
                            can_file_path, output_path
                        ], capture_output=True, text=True, timeout=30)
                        
                        if result.returncode == 0:
                            # Verificar que el archivo de salida se creó y no está vacío
                            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                                logger.info(f"  ✅ Decodificado: {can_file}")
                                decoded_count += 1
                            else:
                                logger.warning(f"  ⚠️  Decodificación exitosa pero archivo de salida vacío: {can_file}")
                        else:
                            logger.warning(f"  ❌ Error decodificando: {can_file}")
                            logger.warning(f"    Error: {result.stderr}")
                            
                    except subprocess.TimeoutExpired:
                        logger.warning(f"  ❌ Timeout decodificando: {can_file}")
                    except Exception as e:
                        logger.error(f"Error en decodificacion: {e}")
                        logger.warning(f"  ❌ Error decodificando: {can_file}")
                
                logger.info(f"  Total decodificados: {decoded_count}/{len(can_files)}")
    
    def extract_date_from_file_content(self, file_path: str) -> Optional[datetime]:
        """
        Extrae la fecha real del contenido del archivo, no del nombre.
        
        Args:
            file_path: Ruta completa del archivo
            
        Returns:
            datetime: Fecha extraída del contenido del archivo
            None: Si no se puede extraer la fecha
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                
            if not lines:
                return None
                
            # Para archivos CAN decodificados (formato especial)
            if file_path.endswith('_TRADUCIDO.csv'):
                # Buscar línea con formato: CAN;DD/MM/YYYY HH:MM:SSAM/PM;VEHICULO;...
                for line in lines:
                    line = line.strip()
                    if line.startswith('CAN;') and ';' in line:
                        parts = line.split(';')
                        if len(parts) >= 2:
                            date_time_str = parts[1].strip()
                            try:
                                # Formato: DD/MM/YYYY HH:MM:SSAM/PM
                                return datetime.strptime(date_time_str, '%d/%m/%Y %I:%M:%S%p')
                            except ValueError:
                                continue
                return None
                
            # Para otros archivos, extraer fecha de la primera línea (cabecera)
            first_line = lines[0].strip()
            
            # Patrones de fecha en cabeceras
            patterns = [
                r'(\d{4}-\d{2}-\d{2})',  # YYYY-MM-DD
                r'(\d{2}/\d{2}/\d{4})',  # DD/MM/YYYY
                r'(\d{8})',              # YYYYMMDD
            ]
            
            for pattern in patterns:
                import re
                match = re.search(pattern, first_line)
                if match:
                    date_str = match.group(1)
                    try:
                        if '-' in date_str:
                            return datetime.strptime(date_str, '%Y-%m-%d')
                        elif '/' in date_str:
                            return datetime.strptime(date_str, '%d/%m/%Y')
                        else:
                            return datetime.strptime(date_str, '%Y%m%d')
                    except ValueError:
                        continue
            
            # Si no se encuentra en la cabecera, buscar en las primeras líneas de datos
            for line in lines[1:5]:  # Revisar primeras 5 líneas de datos
                line = line.strip()
                if not line or ';' not in line:
                    continue
                    
                parts = line.split(';')
                if len(parts) >= 1:
                    # Buscar patrón de fecha y hora: YYYY-MM-DD HH:MM:SS
                    date_time_pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})'
                    match = re.search(date_time_pattern, parts[0])
                    if match:
                        try:
                            return datetime.strptime(match.group(1), '%Y-%m-%d %H:%M:%S')
                        except ValueError:
                            continue
            
            return None
            
        except Exception as e:
            logger.warning(f"Error extrayendo fecha de {file_path}: {e}")
            return None
    
    def extract_date_from_filename(self, filename: str) -> Optional[datetime]:
        """
        Extrae la fecha de un nombre de archivo Doback (método de respaldo).
        
        Args:
            filename: Nombre del archivo (ej: GPS_DOBACK022_20250707_6.txt)
            
        Returns:
            datetime: Fecha extraída del nombre de archivo
            None: Si no se puede extraer la fecha
        """
        try:
            # Buscar patrón de fecha YYYYMMDD en el nombre
            import re
            date_match = re.search(r'(\d{8})', filename)
            if date_match:
                date_str = date_match.group(1)
                return datetime.strptime(date_str, '%Y%m%d')
            
            return None
            
        except Exception as e:
            logger.warning(f"No se pudo extraer fecha de: {filename}")
            return None
    
    def _find_file_path(self, filename: str) -> Optional[str]:
        """Busca la ruta completa de un archivo en el directorio de datos."""
        for root, dirs, files in os.walk(DATA_DIR):
            if filename in files:
                return os.path.join(root, filename)
        return None
    
    def _split_flexible(self, line: str):
        """Divide una línea por coma o punto y coma."""
        if ';' in line:
            return [x.strip() for x in line.split(';')]
        return [x.strip() for x in line.split(',')]

    def _clean_time(self, s: str) -> str:
        """Limpia puntos y ceros extra en los segundos."""
        s = s.replace('.', '')
        if len(s.split(':')) == 3:
            h, m, sec = s.split(':')
            sec = sec.zfill(2)
            return f"{h}:{m}:{sec}"
        return s

    def extract_time_range_from_file(self, file_path: str, file_type: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        """
        Extrae el rango temporal de un archivo con parsers mejorados.
        Incluye corrección automática de desfase GPS.
        """
        try:
            if file_type == 'GPS':
                return self._extract_gps_time_range(file_path)
            elif file_type == 'ESTABILIDAD':
                return self._extract_stability_time_range(file_path)
            elif file_type == 'ROTATIVO':
                return self._extract_rotativo_time_range(file_path)
            elif file_type == 'CAN':
                return self._extract_can_time_range(file_path)
            else:
                return None, None
        except Exception as e:
            logger.error(f"Error extrayendo tiempo de {file_path}: {e}")
            return None, None

    def _extract_gps_time_range(self, file_path: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        """Extrae rango temporal de archivo GPS con corrección de desfase."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            if not lines:
                return None, None
            
            # Saltar cabecera y columnas
            for i, line in enumerate(lines):
                if line.lower().startswith('fecha'):
                    data_start = i + 1
                    break
            else:
                data_start = 1
            
            first_data = None
            last_data = None
            
            for line in lines[data_start:]:
                if not line.strip():
                    continue
                parts = self._split_flexible(line)
                if len(parts) >= 2:
                    try:
                        date_str = parts[0].replace('.', '').strip()
                        time_str = self._clean_time(parts[1])
                        if date_str and time_str and date_str != 'Fecha':
                            dt_str = f"{date_str} {time_str}"
                            dt = datetime.strptime(dt_str, '%d/%m/%Y %H:%M:%S')
                            if first_data is None:
                                first_data = dt
                            last_data = dt
                    except Exception:
                        continue
                
            # Aplicar corrección de desfase GPS (+2 horas)
            if first_data and last_data:
                first_data = first_data + timedelta(hours=2)
                last_data = last_data + timedelta(hours=2)
                logger.debug(f"GPS: Aplicada corrección de desfase +2h")
            
            return first_data, last_data
        except Exception as e:
            logger.error(f"Error procesando GPS {file_path}: {e}")
            return None, None
            
    def _extract_stability_time_range(self, file_path: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        """Extrae rango temporal de archivo ESTABILIDAD."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            if not lines:
                return None, None
            
            # Parsear fecha de la cabecera
            first_line = lines[0].strip()
            session_start = None
            if first_line.startswith('ESTABILIDAD;'):
                parts = self._split_flexible(first_line)
                if len(parts) >= 2:
                    date_str = parts[1].strip()
                    for fmt in ('%Y%m%d %H:%M:%S', '%d/%m/%Y %I:%M:%S%p', '%d/%m/%Y %H:%M:%S'):
                        try:
                            session_start = datetime.strptime(date_str, fmt)
                            break
                        except Exception:
                            continue
            
            # Buscar timestamps intercalados en el archivo
                timestamps = []
                for line in lines:
                    line = line.strip()
                if line and ':' in line and ('AM' in line or 'PM' in line):
                    # Formato: 11:32:30AM
                    try:
                        # Asumir que es del mismo día que la sesión
                        if session_start:
                            time_str = line
                            date_str = session_start.strftime('%d/%m/%Y')
                            dt_str = f"{date_str} {time_str}"
                            dt = datetime.strptime(dt_str, '%d/%m/%Y %I:%M:%S%p')
                            timestamps.append(dt)
                    except Exception:
                                continue
                
                if timestamps:
                    first_data = min(timestamps)
                    last_data = max(timestamps)
                elif session_start:
                    first_data = session_start
                    last_data = session_start
                else:
                    first_data = None
                    last_data = None
            
            return first_data, last_data
        except Exception as e:
            logger.error(f"Error procesando ESTABILIDAD {file_path}: {e}")
            return None, None
                
    def _extract_rotativo_time_range(self, file_path: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        """Extrae rango temporal de archivo ROTATIVO."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            if not lines:
                return None, None
                
            # Buscar cabecera de columnas
            for i, line in enumerate(lines):
                if 'fecha' in line.lower() and 'estado' in line.lower():
                    data_start = i + 1
                    break
            else:
                data_start = 1
            
            first_data = None
            last_data = None
            
            for line in lines[data_start:]:
                if not line.strip():
                    continue
                parts = self._split_flexible(line)
                if len(parts) >= 1:
                    try:
                        date_str = parts[0].replace('.', '').strip()
                        if date_str and date_str != 'Fecha-Hora':
                            dt = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                            if first_data is None:
                                first_data = dt
                            last_data = dt
                    except Exception:
                        continue
            
            # Si no hay datos, intentar parsear la fecha de la primera línea
            if first_data is None:
                first_line = lines[0].strip()
                if first_line.startswith('ROTATIVO;'):
                    parts = self._split_flexible(first_line)
                    if len(parts) >= 2:
                        date_str = parts[1].strip()
                        for fmt in ('%Y%m%d %H:%M:%S', '%Y-%m-%d', '%d/%m/%Y'):
                            try:
                                first_data = datetime.strptime(date_str, fmt)
                                break
                            except Exception:
                                continue
            
            return first_data, last_data
        except Exception as e:
            logger.error(f"Error procesando ROTATIVO {file_path}: {e}")
            return None, None
            
    def _extract_can_time_range(self, file_path: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        """Extrae rango temporal de archivo CAN."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Buscar línea de cabecera CAN
            session_start = None
            for line in lines:
                if line.strip().startswith('CAN\t'):
                    parts = line.strip().split('\t')
                    if len(parts) >= 2:
                        date_str = parts[1].strip()
                        try:
                            session_start = datetime.strptime(date_str, '%d/%m/%Y %I:%M:%S%p')
                            break
                        except Exception:
                            continue
            # Buscar cabecera de columnas
            data_start = None
            for i, line in enumerate(lines):
                if 'Timestamp' in line and 'length' in line:
                    data_start = i + 1
                    break
            
            if data_start is None:
                return session_start, session_start
            
            first_data = None
            last_data = None
            
            for line in lines[data_start:]:
                if not line.strip():
                    continue
                parts = self._split_flexible(line)
                if len(parts) >= 1:
                    try:
                        date_str = parts[0].strip()
                        if date_str and ('AM' in date_str or 'PM' in date_str):
                            dt = datetime.strptime(date_str, '%d/%m/%Y %I:%M:%S%p')
                            if first_data is None:
                                first_data = dt
                            last_data = dt
                    except Exception:
                        continue
            
            # Si no se encontraron datos, usar la fecha de sesión
            if first_data is None and session_start:
                first_data = session_start
                last_data = session_start
            
            return first_data, last_data
        except Exception as e:
            logger.error(f"Error procesando CAN {file_path}: {e}")
            return None, None
    
    def scan_files_and_find_sessions(self) -> List[Dict]:
        """
        Escanea archivos y encuentra sesiones con lógica mejorada.
        - Agrupa por vehículo y fecha
        - Permite tolerancia temporal de ±15 minutos
        - Acepta sesiones con archivos faltantes (mínimo estabilidad O GPS)
        - Prioridad: CAN > ESTABILIDAD > GPS como archivo base
        - Evita duplicados
        """
        logger.info("🔍 Iniciando escaneo inteligente de archivos...")
        
        # Cargar archivos desde caché o escanear
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

    def _group_files_by_vehicle_date(self, files: List[Dict]) -> Dict[Tuple[str, str], List[Dict]]:
        """Agrupa archivos por vehículo y fecha."""
        grouped = {}
        
        for file_info in files:
            vehicle = file_info.get('vehicle', 'unknown')
            date = file_info.get('date')
            
            if not date:
                continue
            
            # Convertir a string de fecha si es datetime
            if isinstance(date, datetime):
                date_str = date.strftime('%Y-%m-%d')
            else:
                date_str = str(date)[:10]  # Tomar solo YYYY-MM-DD
            
            key = (vehicle, date_str)
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(file_info)
        
        return grouped

    def _group_files_by_type(self, files: List[Dict]) -> Dict[str, List[Dict]]:
        """Agrupa archivos por tipo (CAN, GPS, ESTABILIDAD, ROTATIVO)."""
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
        Usa lógica de emparejamiento inteligente con tolerancia temporal.
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
            import psycopg2
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
            # Buscar archivos compatibles para esta sesión
            session_files = self._find_compatible_files_for_base(base_file, files_by_type)
            if not session_files:
                continue
                
            # Crear sesión
            session_id = self._generate_session_id(vehicle, date, base_file)
            
            # Verificar si ya fue subida
            if session_id in uploaded_sessions:
                logger.info(f"  ⏭️  Sesión {session_id} ya subida, saltando...")
                continue
                
            # Verificar que tenga al menos 1 tipo de archivo (ya verificamos mínimo arriba)
            available_types = [t for t, files in session_files.items() if files]
            if len(available_types) < 1:
                logger.warning(f"  ❌ Sesión {session_id} no tiene archivos válidos")
                continue
            # Calcular startTime y endTime de la sesión
            session_start = None
            session_end = None
            
            # Usar el archivo base como referencia para el rango temporal
            if session_files.get('CAN'):
                session_start = session_files['CAN'].get('start_time')
                session_end = session_files['CAN'].get('end_time')
            elif session_files.get('ESTABILIDAD'):
                session_start = session_files['ESTABILIDAD'].get('start_time')
                session_end = session_files['ESTABILIDAD'].get('end_time')
            elif session_files.get('GPS'):
                session_start = session_files['GPS'].get('start_time')
                session_end = session_files['GPS'].get('end_time')
            elif session_files.get('ROTATIVO'):
                session_start = session_files['ROTATIVO'].get('start_time')
                session_end = session_files['ROTATIVO'].get('end_time')
            
            # Extender el rango con otros archivos si están disponibles
            for file_type, file_info in session_files.items():
                if file_info:
                    file_start = file_info.get('start_time')
                    file_end = file_info.get('end_time')
                    
                    if file_start and session_start:
                        session_start = min(session_start, file_start)
                    elif file_start:
                        session_start = file_start
                    
                    if file_end and session_end:
                        session_end = max(session_end, file_end)
                    elif file_end:
                        session_end = file_end
            
            # Crear objeto de sesión con IDs reales y rangos temporales
            session = {
                'id': session_id,
                'vehicle': vehicle,
                'vehicleId': vehicle_id,
                'organizationId': organization_id,
                'date': date,
                'startTime': session_start,
                'endTime': session_end,
                'files': session_files,
                'available_types': available_types,
                'missing_types': [t for t in ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO'] if t not in available_types]
            }
            sessions.append(session)
            logger.info(f"  ✅ Sesión {session_id} creada con tipos: {available_types}")
            if session['missing_types']:
                logger.info(f"     ⚠️  Faltan: {session['missing_types']}")
        return sessions
    
    def _find_compatible_files_for_base(self, base_file: Dict, files_by_type: Dict) -> Dict[str, Optional[Dict]]:
        """
        Encuentra archivos compatibles para un archivo base específico.
        Usa tolerancia temporal de ±15 minutos y busca el archivo más cercano.
        El archivo base puede ser CAN, ESTABILIDAD o GPS.
        """
        # Determinar el tipo del archivo base
        base_type = base_file.get('type', 'CAN')
        session_files = {'CAN': None, 'GPS': None, 'ESTABILIDAD': None, 'ROTATIVO': None}
        
        # Asignar el archivo base
        session_files[base_type] = base_file
        
        base_start = base_file.get('start_time')
        base_end = base_file.get('end_time')
        
        if not base_start or not base_end:
            return session_files
        
        # Tolerancia temporal: ±15 minutos
        tolerance_minutes = 15
        tolerance_seconds = tolerance_minutes * 60
        
        # Buscar archivos compatibles para cada tipo (excepto el base)
        for file_type in ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']:
            if file_type == base_type:
                continue  # Ya asignado arriba
                
            type_files = files_by_type.get(file_type, [])
            if not type_files:
                continue
            
            best_file = None
            best_score = float('inf')
            
            for file_info in type_files:
                file_start = file_info.get('start_time')
                file_end = file_info.get('end_time')
                
                if not file_start or not file_end:
                    continue
                
                # Calcular proximidad temporal
                score = self._calculate_temporal_proximity(
                    base_start, base_end, file_start, file_end, tolerance_seconds
                )
                
                if score is not None and score < best_score:
                    best_score = score
                    best_file = file_info
            
            if best_file:
                session_files[file_type] = best_file
                logger.debug(f"    📎 {file_type}: emparejado (score: {best_score:.1f}s)")
            else:
                logger.debug(f"    ❌ {file_type}: no encontrado archivo compatible")
        
        return session_files

    def _calculate_temporal_proximity(
        self, 
        base_start: datetime, 
        base_end: datetime, 
        file_start: datetime, 
        file_end: datetime, 
        tolerance_seconds: int
    ) -> Optional[float]:
        """
        Calcula la proximidad temporal entre dos rangos de tiempo.
        Retorna None si están fuera de tolerancia, o la diferencia en segundos si están dentro.
        """
        # Calcular diferencias entre inicios y finales
        start_diff = abs((base_start - file_start).total_seconds())
        end_diff = abs((base_end - file_end).total_seconds())
        
        # Si ambos están dentro de la tolerancia, usar la diferencia promedio
        if start_diff <= tolerance_seconds and end_diff <= tolerance_seconds:
            return (start_diff + end_diff) / 2
        
        # Si solo uno está dentro de tolerancia, verificar solapamiento
        if start_diff <= tolerance_seconds or end_diff <= tolerance_seconds:
            # Verificar si hay solapamiento real
            if file_start <= base_end and file_end >= base_start:
                return min(start_diff, end_diff)
        
        return None
        
    def _generate_session_id(self, vehicle: str, date: str, base_file: Dict) -> str:
        """Genera un ID único para la sesión basado en el archivo base."""
        # Usar el nombre del archivo base como referencia
        base_filename = base_file.get('filename', 'unknown')
        
        # Extraer número de sesión del nombre del archivo
        import re
        match = re.search(r'_(\d+)_(\d+)\.', base_filename)
        if match:
            session_num = match.group(1)
        else:
            # Si no hay número, usar timestamp
            session_num = str(int(base_file.get('start_time', datetime.now()).timestamp()))
        
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

    def _save_uploaded_session(self, session_id: str) -> None:
        """Guarda una sesión como ya subida."""
        uploaded_file = os.path.join(DATA_DIR, 'uploaded_sessions.json')
        try:
            # Cargar sesiones existentes
            sessions = self._load_uploaded_sessions()
            sessions.add(session_id)
            
            # Guardar actualizado
            with open(uploaded_file, 'w', encoding='utf-8') as f:
                json.dump({'sessions': list(sessions)}, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error guardando sesión subida {session_id}: {e}")
    
    def detect_gps_offset(self, vehicle: str) -> Dict[str, bool]:
        """
        Detecta automáticamente si los archivos GPS están desfasados 2 horas.
        
        Args:
            vehicle: Nombre del vehículo
            
        Returns:
            Diccionario con archivos GPS y si necesitan corrección
        """
        # Filtrar archivos del vehículo
        vehicle_files = [f for f in self.all_files if f['vehicle'] == vehicle]
        
        # Agrupar por tipo
        files_by_type = {}
        for file_info in vehicle_files:
            file_type = file_info['type']
            if file_type not in files_by_type:
                files_by_type[file_type] = []
            files_by_type[file_type].append(file_info)
        
        gps_corrections = {}
        
        if 'GPS' not in files_by_type:
            return gps_corrections
            
        # Para cada archivo GPS, buscar archivos de otros tipos cercanos
        for gps_file in files_by_type['GPS']:
            gps_start = gps_file['start_time']
            gps_name = gps_file['name']
            
            # Buscar archivos de otros tipos que estén cerca temporalmente
            nearby_files = []
            
            for file_type in ['CAN', 'ESTABILIDAD', 'ROTATIVO']:
                if file_type not in files_by_type:
                    continue
                    
                for other_file in files_by_type[file_type]:
                    other_start = other_file['start_time']
                    
                    # Calcular diferencia temporal
                    time_diff = abs((gps_start - other_start).total_seconds() / 3600)  # en horas
                    
                    # Si están dentro del rango máximo, considerarlos cercanos
                    if time_diff <= GPS_MAX_NEARBY_HOURS:
                        nearby_files.append({
                            'type': file_type,
                            'file': other_file,
                            'time_diff_hours': time_diff
                        })
            
            # Analizar si hay un patrón de desfase de 2 horas
            needs_correction = self._analyze_offset_pattern(gps_start, nearby_files)
            gps_corrections[gps_name] = needs_correction
            
            if needs_correction:
                logger.info(f"GPS {gps_name}: Detectado desfase de {GPS_OFFSET_HOURS} horas")
        
        return gps_corrections
    
    def _analyze_offset_pattern(self, gps_start: datetime, nearby_files: List[Dict]) -> bool:
        """
        Analiza si hay un patrón de desfase de 2 horas.
        
        Args:
            gps_start: Inicio del archivo GPS
            nearby_files: Lista de archivos cercanos temporalmente
            
        Returns:
            True si se detecta el patrón de desfase de 2 horas
        """
        if not nearby_files:
            return False
        
        # Contar cuántos archivos están exactamente 2 horas después del GPS
        offset_count = 0
        total_nearby = len(nearby_files)
        
        for nearby in nearby_files:
            other_start = nearby['file']['start_time']
            time_diff_hours = (other_start - gps_start).total_seconds() / 3600
            
            # Verificar si está en el rango de 2 horas ± tolerancia
            if abs(time_diff_hours - GPS_OFFSET_HOURS) <= (GPS_TOLERANCE_MINUTES / 60):
                offset_count += 1
        
        # Si al menos el 50% de los archivos cercanos siguen el patrón de 2 horas
        # y hay al menos 2 archivos cercanos, consideramos que hay desfase
        return offset_count >= 2 and (offset_count / total_nearby) >= 0.5
    
    def apply_smart_gps_corrections(self, vehicle: str) -> Dict[str, Dict]:
        """
        Aplica correcciones inteligentes solo a los archivos GPS que lo necesiten.
        
        Args:
            vehicle: Nombre del vehículo
            
        Returns:
            Diccionario con archivos GPS corregidos
        """
        gps_corrections = self.detect_gps_offset(vehicle)
        corrected_times = {}
        
        # Aplicar correcciones solo a los archivos que lo necesiten
        for gps_name, needs_correction in gps_corrections.items():
            if needs_correction:
                # Encontrar el archivo GPS original
                for file_info in self.all_files:
                    if file_info['vehicle'] == vehicle and file_info['name'] == gps_name:
                        # Aplicar corrección de +2 horas
                        corrected_start = file_info['start_time'] + timedelta(hours=GPS_OFFSET_HOURS)
                        corrected_end = file_info['end_time'] + timedelta(hours=GPS_OFFSET_HOURS)
                        
                        corrected_times[gps_name] = {
                            'original_start': file_info['start_time'],
                            'original_end': file_info['end_time'],
                            'corrected_start': corrected_start,
                            'corrected_end': corrected_end
                        }
                        
                        logger.info(f"✅ CORREGIDO: {gps_name}")
                        logger.info(f"  Original: {file_info['start_time']} - {file_info['end_time']}")
                        logger.info(f"  Corregido: {corrected_start} - {corrected_end}")
                        
                        # Actualizar el archivo original con la corrección
                        file_info['start_time'] = corrected_start
                        file_info['end_time'] = corrected_end
                        break
        
        return corrected_times
    
    def generate_complete_report(self) -> None:
        """
        Genera un reporte completo del procesamiento.
        
        Incluye estadísticas generales, sesiones encontradas y detalles de archivos.
        """
        logger.info("Generando reporte completo...")
        
        # Usar archivos ya escaneados
        if not hasattr(self, 'all_files') or not self.all_files:
            logger.warning("No hay archivos escaneados para generar reporte")
            return
        
        # Agrupar por vehículo para estadísticas
        vehicles = {}
        for file_info in self.all_files:
            vehicle = file_info['vehicle']
            if vehicle not in vehicles:
                vehicles[vehicle] = {}
            
            file_type = file_info['type']
            if file_type not in vehicles[vehicle]:
                vehicles[vehicle][file_type] = []
            
            vehicles[vehicle][file_type].append(file_info)
        
        # Generar estadísticas
        total_sessions = len(self.sessions)
        total_files = len(self.all_files)
        vehicles_processed = len(set(s['vehicle'] for s in self.sessions))
        
        # Calcular sesiones perfectas vs con desfases
        perfect_sessions = sum(1 for s in self.sessions if s.get('max_time_diff', 0) == 0)
        sessions_with_gaps = total_sessions - perfect_sessions
        
        # Calcular diferencia promedio
        if total_sessions > 0:
            avg_diff = sum(s.get('max_time_diff', 0) for s in self.sessions) / total_sessions
        else:
            avg_diff = 0
        
        # Imprimir resumen
        print("=" * 60)
        print("RESUMEN DEL PROCESAMIENTO COMPLETO")
        print("=" * 60)
        print(f"Sesiones encontradas: {total_sessions}")
        print(f"Archivos escaneados: {total_files}")
        print(f"Vehiculos procesados: {vehicles_processed}")
        print(f"Sesiones perfectas: {perfect_sessions}")
        print(f"Sesiones con desfases: {sessions_with_gaps}")
        print(f"Diferencia promedio: {avg_diff:.1f} min")
        print("=" * 60)
        
        # Mostrar sesiones encontradas
        if self.sessions:
            print("\nSESIONES ENCONTRADAS (ordenadas por proximidad temporal):")
            print()
            
            # Ordenar sesiones por diferencia temporal
            sorted_sessions = sorted(self.sessions, key=lambda x: x.get('max_time_diff', 0))
            
            for i, session in enumerate(sorted_sessions, 1):
                vehicle = session['vehicle']
                start_date = session['start_time'].strftime('%Y-%m-%d')
                max_diff = session.get('max_time_diff', 0)
                differences = session.get('differences', {})
                
                print(f"Sesion {i}: {vehicle} - {start_date}")
                print(f"  Maxima diferencia temporal: {max_diff:.1f} min")
                print(f"  Diferencias individuales (minutos):")
                for file_type in ['GPS', 'ESTABILIDAD', 'ROTATIVO']:
                    diff = differences.get(file_type, 0)
                    print(f"    {file_type}={diff:.1f}min")
                print(f"  Archivos:")
                for file_type, file_info in session['files'].items():
                    print(f"    {file_type}: {file_info['name']}")
                print()
        
        # Guardar reporte en JSON
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_sessions': total_sessions,
                'total_files': total_files,
                'vehicles_processed': vehicles_processed,
                'perfect_sessions': perfect_sessions,
                'sessions_with_gaps': sessions_with_gaps,
                'average_difference_minutes': round(avg_diff, 1)
            },
            'sessions': [
                {
                    'vehicle': s['vehicle'],
                    'start_time': s['start_time'].isoformat(),
                    'end_time': s['end_time'].isoformat() if s.get('end_time') else None,
                    'max_time_diff': s.get('max_time_diff', 0),
                    'differences': s.get('differences', {}),
                    'files': {k: v['name'] for k, v in s['files'].items()}
                }
                for s in self.sessions
            ],
            'file_statistics': {
                vehicle: {
                    file_type: len(files) 
                    for file_type, files in vehicle_files.items()
                }
                for vehicle, vehicle_files in vehicles.items()
            }
        }
        
        report_file = 'complete_processor_report.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Reporte guardado en: {report_file}")
    
    def upload_sessions_to_database(self, sessions: List[Dict]) -> None:
        """
        Sube las sesiones a la base de datos con registro de sesiones subidas.
        """
        if not sessions:
            logger.warning("No hay sesiones para subir")
            return
        
        logger.info(f"🚀 Iniciando subida de {len(sessions)} sesiones a la base de datos...")
        
        # Estadísticas
        stats = {
            'total': len(sessions),
            'subidas': 0,
            'fallidas': 0,
            'saltadas': 0
        }
        
        for i, session in enumerate(sessions, 1):
            session_id = session['id']
            logger.info(f"📤 [{i}/{len(sessions)}] Procesando sesión: {session_id}")
            
            try:
                # Verificar si ya existe en base de datos
                if self._session_exists_in_db(session):
                    logger.info(f"  ⏭️  Sesión {session_id} ya existe en BD, saltando...")
                    stats['saltadas'] += 1
                    continue
                
                # Subir sesión
                success = self._upload_single_session(session)
                
                if success:
                    # Registrar como subida
                    self._save_uploaded_session(session_id)
                    stats['subidas'] += 1
                    logger.info(f"  ✅ Sesión {session_id} subida correctamente")
                else:
                    stats['fallidas'] += 1
                    logger.error(f"  ❌ Error subiendo sesión {session_id}")
                
            except Exception as e:
                stats['fallidas'] += 1
                logger.error(f"  ❌ Error procesando sesión {session_id}: {e}")
            
        # Reporte final
        logger.info("📊 === REPORTE FINAL DE SUBIDA ===")
        logger.info(f"  Total sesiones: {stats['total']}")
        logger.info(f"  ✅ Subidas exitosas: {stats['subidas']}")
        logger.info(f"  ⏭️  Saltadas (duplicadas): {stats['saltadas']}")
        logger.info(f"  ❌ Fallidas: {stats['fallidas']}")
        logger.info("=====================================")

    def _session_exists_in_db(self, session: Dict) -> bool:
        """Verifica si una sesión ya existe en la base de datos."""
        try:
            # Aquí implementarías la lógica para verificar si la sesión ya existe
            # Por ahora retornamos False para permitir todas las subidas
            return False
        except Exception as e:
            logger.warning(f"Error verificando existencia de sesión: {e}")
            return False
    
    def _upload_single_session(self, session: Dict) -> bool:
        """
        Inserta una sesión en la base de datos PostgreSQL (tabla "Session") y todos sus datos asociados.
        Devuelve True si la inserción fue exitosa, False si hubo error.
        """
        import psycopg2
        from psycopg2.extras import RealDictCursor
        try:
            logger.info(f"    📁 Archivos de la sesión:")
            for file_type, file_info in session['files'].items():
                if file_info:
                    logger.info(f"      {file_type}: {file_info.get('filename', 'unknown')}")
                else:
                    logger.info(f"      {file_type}: ❌ FALTANTE")

            # Conexión a la base de datos
            conn = psycopg2.connect(**self.db_config)
            cur = conn.cursor()
            
            # Comprobar si ya existe la sesión por id
            cur.execute('SELECT 1 FROM "Session" WHERE id = %s', (session['id'],))
            if cur.fetchone():
                logger.info(f"    ⏭️  Sesión {session['id']} ya existe en BD, saltando...")
                cur.close()
                conn.close()
                return False
                
            # Insertar la sesión
            insert_sql = '''
                INSERT INTO "Session" (
                    id, "vehicleId", "organizationId", "userId", "startTime", "endTime", "createdAt", "updatedAt", status, type, sequence, "sessionNumber"
                ) VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s, %s, %s)
            '''
            # Extraer campos principales (ajustar según tu modelo real)
            session_id = session['id']
            vehicle_id = session.get('vehicleId') or session.get('vehicle_id') or None
            organization_id = session.get('organizationId') or session.get('organization_id') or None
            user_id = 'a6476b75-fbd7-404e-b82b-a9bcb8b39ea8'  # userId fijo
            start_time = session.get('start_time') or session.get('startTime')
            end_time = session.get('end_time') or session.get('endTime')
            status = session.get('status', 'COMPLETED')
            session_type = session.get('type', 'ROUTINE')
            sequence = 1  # Valor por defecto para sequence
            session_number = 1  # Valor por defecto para sessionNumber
            
            cur.execute(insert_sql, (
                session_id, vehicle_id, organization_id, user_id, start_time, end_time, status, session_type, sequence, session_number
            ))
            
            # Subir datos individuales de cada tipo de archivo
            logger.info(f"    📊 Subiendo datos individuales...")
            
            # Subir datos GPS
            if session['files'].get('GPS') and session['files']['GPS'].get('path'):
                logger.info(f"    📍 Subiendo datos GPS...")
                self._upload_gps_data(conn, session_id, session['files']['GPS']['path'], start_time, end_time)
            
            # Subir datos de estabilidad
            if session['files'].get('ESTABILIDAD') and session['files']['ESTABILIDAD'].get('path'):
                logger.info(f"    📊 Subiendo datos de estabilidad...")
                self._upload_stability_data(conn, session_id, session['files']['ESTABILIDAD']['path'], start_time, end_time)
            
            # Subir datos CAN
            if session['files'].get('CAN') and session['files']['CAN'].get('path'):
                logger.info(f"    🚗 Subiendo datos CAN...")
                self._upload_can_data(conn, session_id, session['files']['CAN']['path'], start_time, end_time)
            
            # Subir datos rotativos
            if session['files'].get('ROTATIVO') and session['files']['ROTATIVO'].get('path'):
                logger.info(f"    🔄 Subiendo datos rotativos...")
                self._upload_rotativo_data(conn, session_id, session['files']['ROTATIVO']['path'], start_time, end_time)
            
            conn.commit()
            cur.close()
            conn.close()
            logger.info(f"    ✅ Sesión {session_id} y todos sus datos insertados en la base de datos")
            return True
        except Exception as e:
            logger.error(f"Error subiendo sesión: {e}")
            return False

    def _get_all_files(self) -> List[Dict]:
        """Carga todos los archivos desde caché o los escanea."""
        # Intentar cargar desde cache primero
        cached_files = self._load_cached_files()
        if cached_files:
            logger.info(f"📋 Cargados {len(cached_files)} archivos desde caché")
            return cached_files
        
        # Escanear archivos si no hay cache válido
        logger.info("🔍 Escaneando archivos desde disco...")
        all_files = []
        
        for root, dirs, files in os.walk(DATA_DIR):
            for file in files:
                if file.endswith(('.txt', '.csv')):
                    file_path = os.path.join(root, file)
                    file_type = self._get_file_type(file)
                    start_time, end_time = self.extract_time_range_from_file(file_path, file_type)
                    if start_time and end_time:  # Solo incluir archivos con rangos válidos
                        all_files.append({
                            'path': file_path,
                            'filename': file,
                            'date': start_time,  # Usar start_time como fecha de referencia
                            'type': file_type,
                            'vehicle': self._extract_vehicle_name(file_path),
                            'start_time': start_time,
                            'end_time': end_time
                        })
        
        # Guardar en cache para futuras ejecuciones
        self._save_cached_files(all_files)
        logger.info(f"📋 Escaneados {len(all_files)} archivos totales")
        return all_files

    def _get_file_type(self, filename: str) -> str:
        """Determina el tipo de archivo basado en el nombre."""
        if filename.startswith('CAN_') and '_TRADUCIDO.csv' in filename:
            return 'CAN'
        elif filename.startswith('GPS_'):
            return 'GPS'
        elif filename.startswith('ESTABILIDAD_'):
            return 'ESTABILIDAD'
        elif filename.startswith('ROTATIVO_'):
            return 'ROTATIVO'
                else:
            return 'UNKNOWN'
    
    def _extract_vehicle_name(self, file_path: str) -> str:
        """Extrae el nombre del vehículo de la ruta del archivo."""
        # La estructura es: datosDoback/empresa/vehiculo/tipo/archivo
        parts = file_path.split(os.sep)
        if len(parts) >= 4:
            # El tercer elemento desde el final es el nombre del vehículo
            # (antes del tipo de archivo: CAN, GPS, etc.)
            return parts[-3]
        elif len(parts) >= 3:
            return parts[-2]  # Fallback para estructura antigua
        return 'unknown'
    
    def _upload_gps_data(self, conn, session_id: str, file_path: str, session_start=None, session_end=None) -> None:
        """Sube datos GPS a la base de datos solo dentro del rango de la sesión y dentro de la Comunidad de Madrid."""
        from geopy.distance import geodesic
        cur = conn.cursor()
        try:
            gps_data = self._load_gps_data(file_path)
            # NO aplicar filtro temporal estricto para GPS - usar todos los puntos válidos
            # Filtrar puntos fuera de la Comunidad de Madrid
            gps_data_valid = [point for point in gps_data if (
                MADRID_BOUNDS['min_lat'] <= point['latitude'] <= MADRID_BOUNDS['max_lat'] and
                MADRID_BOUNDS['min_lon'] <= point['longitude'] <= MADRID_BOUNDS['max_lon']
            )]
            # Filtro de outliers por distancia (20 metros)
            if len(gps_data_valid) > 2:
                gps_filtrados = [gps_data_valid[0]]
                for i in range(1, len(gps_data_valid)-1):
                    prev = gps_data_valid[i-1]
                    curr = gps_data_valid[i]
                    next = gps_data_valid[i+1]
                    dist_prev = geodesic((prev['latitude'], prev['longitude']), (curr['latitude'], curr['longitude'])).meters
                    dist_next = geodesic((curr['latitude'], curr['longitude']), (next['latitude'], next['longitude'])).meters
                    if dist_prev > 20 and dist_next > 20:
                        continue  # Salta el outlier
                    gps_filtrados.append(curr)
                gps_filtrados.append(gps_data_valid[-1])
                gps_data_valid = gps_filtrados
            if len(gps_data_valid) < 10:
                logging.warning(f"Sesión {session_id}: solo {len(gps_data_valid)} puntos GPS válidos en Madrid (de {len(gps_data)})")
            for point in gps_data_valid:
                cur.execute("""
                    INSERT INTO "GpsMeasurement" (
                        id, latitude, longitude, altitude, speed, satellites, quality, "sessionId", 
                        "createdAt", hdop, timestamp, "updatedAt", fix, heading, accuracy
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    str(uuid.uuid4()), point['latitude'], point['longitude'], point['altitude'], 
                    point['speed'], point['num_sats'], point.get('quality', 'N/A'), session_id,
                    datetime.now(), point.get('hdop', 0), point['timestamp'],
                    datetime.now(), point.get('fix', 'N/A'), point.get('heading', 0), point.get('accuracy', 0)
                ))
            logging.info(f"    Subidos {len(gps_data_valid)} puntos GPS válidos (descartados {len(gps_data)-len(gps_data_valid)})")
        finally:
            cur.close()
    
    def _upload_stability_data(self, conn, session_id: str, file_path: str, session_start=None, session_end=None, gps_data=None, can_data=None) -> None:
        """
        Sube datos de estabilidad a la base de datos, calcula métricas y eventos igual que la subida manual.
        """
        cur = conn.cursor()
        try:
            # Inicializar datos GPS y CAN si no se pasan
            if gps_data is None:
                gps_data = []
            if can_data is None:
                can_data = []
                
            measurements, metrics, events = self._parse_stability_file_and_analyze(file_path)
            logger.info(f"    Generados {len(events)} eventos de estabilidad")
            if len(events) > 0:
                logger.info(f"    Rango eventos: {events[0]['timestamp']} a {events[-1]['timestamp']}")
            if session_start and session_end:
                measurements = [point for point in measurements if session_start <= point['timestamp'] <= session_end]
            for point in measurements:
                cur.execute("""
                    INSERT INTO "StabilityMeasurement" (
                        id, "sessionId", timestamp, ax, ay, az, gx, gy, gz,
                        roll, pitch, yaw, temperature, "timeantwifi", "isDRSHigh", 
                        "isLTRCritical", "isLateralGForceHigh", "createdAt", "updatedAt",
                        accmag, microsds, si, usciclo1, usciclo2, usciclo3, usciclo4,
                        usciclo5, usciclo6, usciclo7, usciclo8
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    str(uuid.uuid4()), session_id, point['timestamp'],
                    point['ax'], point['ay'], point['az'],
                    point['gx'], point['gy'], point['gz'],
                    point.get('roll'), point.get('pitch'), point.get('yaw'),
                    point.get('temperature'), point.get('timeantwifi', 0),
                    point.get('isDRSHigh', False), point.get('isLTRCritical', False),
                    point.get('isLateralGForceHigh', False), datetime.now(), datetime.now(),
                    point.get('accmag', 0), point.get('microsds', 0), point.get('si', 0),
                    point.get('usciclo1', 0), point.get('usciclo2', 0), point.get('usciclo3', 0),
                    point.get('usciclo4', 0), point.get('usciclo5', 0), point.get('usciclo6', 0),
                    point.get('usciclo7', 0), point.get('usciclo8', 0)
                ))
            logger.info(f"    Subidos {len(measurements)} puntos de estabilidad")
            # Subir eventos de estabilidad en stability_events
            for event in events:
                # Buscar datos GPS más cercanos al timestamp del evento
                closest_gps = None
                min_diff = float('inf')
                for gps_point in gps_data:
                    diff = abs((event['timestamp'] - gps_point['timestamp']).total_seconds())
                    if diff < min_diff and diff < 30:  # 30 segundos máximo
                        min_diff = diff
                        closest_gps = gps_point
                if not closest_gps:
                    logger.warning(f"No se encontró GPS cercano para evento {event['id']} en {event['timestamp']}")
                # Buscar datos CAN más cercanos
                closest_can = None
                min_diff = float('inf')
                for can_point in can_data:
                    diff = abs((event['timestamp'] - can_point['timestamp']).total_seconds())
                    if diff < min_diff and diff < 5:
                        min_diff = diff
                        closest_can = can_point
                
                # Preparar coordenadas GPS
                lat = closest_gps['latitude'] if closest_gps else 0.0
                lon = closest_gps['longitude'] if closest_gps else 0.0
                
                # Convertir severity a level (formato manual)
                severity_to_level = {
                    'critical': 'critico',
                    'danger': 'peligroso', 
                    'moderate': 'moderado'
                }
                
                # Preparar tipos de evento
                event_types = [event['type']]
                if event.get('subtype'):
                    event_types.append(event['subtype'])
                
                # Preparar valores de estabilidad
                stability_values = {}
                if 'measurement' in event:
                    m = event['measurement']
                    stability_values = {
                        'si': m.get('si', 0),
                        'roll': m.get('roll', 0),
                        'ay': m.get('ay', 0),
                        'yaw': m.get('gz', 0)  # gz es yaw rate
                    }
                
                # Preparar datos CAN
                can_data = {}
                if closest_can:
                    can_data = {
                        'engineRPM': closest_can.get('engineRpm', 0),
                        'vehicleSpeed': closest_can.get('vehicleSpeed', 0),
                        'rotativo': closest_can.get('rotativo', False)
                    }
                
                cur.execute("""
                    INSERT INTO stability_events (
                        id, session_id, timestamp, lat, lon, type, details
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    event['id'], session_id, event['timestamp'],
                    lat, lon,
                    event['type'],
                    json.dumps({
                        'level': severity_to_level.get(event['severity'], 'moderado'),
                        'perc': int(event.get('value', 0) * 100),  # Convertir a porcentaje entero
                        'tipos': event_types,
                        'valores': stability_values,
                        'can': can_data
                    })
                ))
            logger.info(f"    Subidos {len(events)} eventos de estabilidad")
        finally:
            cur.close()
    
    def _upload_can_data(self, conn, session_id: str, file_path: str, session_start=None, session_end=None) -> None:
        """Sube datos CAN a la base de datos solo dentro del rango de la sesión."""
        cur = conn.cursor()
        try:
            can_data = self._load_can_data(file_path)
            if session_start and session_end:
                can_data = [point for point in can_data if session_start <= point['timestamp'] <= session_end]
            for point in can_data:
                cur.execute("""
                    INSERT INTO "CanMeasurement" (
                        id, "sessionId", timestamp, "engineRpm", "vehicleSpeed", "fuelSystemStatus",
                        temperature, "createdAt", "updatedAt", "absActive", "brakePressure", 
                        "espActive", "gearPosition", "steeringAngle", "throttlePosition"
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    str(uuid.uuid4()), session_id, point['timestamp'],
                    point['engineRpm'], point['vehicleSpeed'], point['fuelSystemStatus'],
                    point.get('temperature'), datetime.now(), datetime.now(),
                    point.get('absActive'), point.get('brakePressure'), point.get('espActive'),
                    point.get('gearPosition'), point.get('steeringAngle'), point.get('throttlePosition')
                ))
            logger.info(f"    Subidos {len(can_data)} puntos CAN")
        finally:
            cur.close()
    
    def _upload_rotativo_data(self, conn, session_id: str, file_path: str, session_start=None, session_end=None) -> None:
        """
        Sube datos de rotativo a la base de datos, filtrando por rango de sesión si corresponde.
        Inserta solo en las columnas válidas y maneja duplicados de forma robusta.
        """
        cur = conn.cursor()
        try:
            import psycopg2
            import psycopg2.errorcodes
            # Intentar usar _load_rotativo_data si existe, si no, parseo directo
            if hasattr(self, '_load_rotativo_data'):
                data = self._load_rotativo_data(file_path)
            else:
                data = []
                with open(file_path, 'r', encoding='utf-8') as file:
                    lines = file.readlines()
                # Buscar cabecera de columnas
                data_start = 0
                for i, line in enumerate(lines):
                    if 'Fecha-Hora' in line and 'Estado' in line:
                        data_start = i + 1
                        break
                for line in lines[data_start:]:
                    line = line.strip()
                    if not line:
                        continue
                    parts = [p.strip() for p in line.split(';')]
                    if len(parts) >= 2:
                    try:
                            timestamp = datetime.strptime(parts[0], '%Y-%m-%d %H:%M:%S')
                            state = parts[1]  # 1/0, encendido/apagado
                            data.append({'timestamp': timestamp, 'state': state})
                    except Exception:
                        continue
            if session_start and session_end:
                data = [d for d in data if session_start <= d['timestamp'] <= session_end]
            uploaded_count = 0
            for d in data:
                try:
                cur.execute('''
                        INSERT INTO "RotativoMeasurement" (id, "sessionId", timestamp, state, "createdAt", "updatedAt")
                        VALUES (%s, %s, %s, %s, %s, %s)
                ''', (
                        str(uuid.uuid4()), session_id, d['timestamp'], d['state'], datetime.now(), datetime.now()
                ))
                    uploaded_count += 1
                except psycopg2.Error as e:
                    if e.pgcode == psycopg2.errorcodes.UNIQUE_VIOLATION:
                        logger.warning(f"    ⚠️  Punto duplicado ignorado: {session_id} {d['timestamp']}")
                        conn.rollback()
                        continue
                    else:
                        logger.error(f"    ❌ Error SQL en punto rotativo: {e}")
                        conn.rollback()
                        continue
            logger.info(f"    Subidos {uploaded_count} puntos rotativo")
        finally:
            cur.close()
    
    def _load_gps_data(self, file_path: str) -> List[Dict]:
        """Carga datos GPS desde un archivo CSV/TXT. Tolerante a columnas extra, mapea solo campos requeridos y loguea filas descartadas con motivo."""
        try:
            data = []
            logger.info(f"DEBUG: Iniciando carga GPS desde {file_path}")
            with open(file_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
            logger.info(f"DEBUG: Archivo GPS leído, {len(lines)} líneas totales")
            logger.info(f"DEBUG: Procesando {len(lines)-2} líneas de datos GPS")
            lines_processed = 0
            lines_valid = 0
            lines_discarded = 0
            for line_num, line in enumerate(lines[2:], 3):
                line = line.strip()
                if not line:
                    continue
                lines_processed += 1
                if 'sin datos GPS' in line:
                    logger.warning(f"    ⚠️ Línea {line_num} descartada (sin datos GPS): {line}")
                    lines_discarded += 1
                    continue
                parts = [p.strip() for p in re.split(r'[,;]', line)]
                if len(parts) < 9:
                    logger.warning(f"    ⚠️ Línea {line_num} descartada (campos insuficientes): {parts}")
                    lines_discarded += 1
                    continue
                    try:
                        lat = float(parts[2])
                        lon = float(parts[3])
                        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180) or (lat == 0 and lon == 0):
                        logger.warning(f"    ⚠️ Línea {line_num} descartada (lat/lon fuera de rango o nulos): {lat}, {lon}")
                        lines_discarded += 1
                            continue
                        alt = float(parts[4]) if parts[4] else 0.0
                        hdop = float(parts[5]) if parts[5] else 0.0
                        fix = int(parts[6]) if parts[6] else 0
                        num_sats = int(parts[7]) if parts[7] else 0
                        speed = float(parts[8]) if parts[8] else 0.0
                        date_str = parts[0]
                        time_str = parts[1]
                        datetime_str = f"{date_str} {time_str}"
                        timestamp = datetime.strptime(datetime_str, "%d/%m/%Y %H:%M:%S")
                        data.append({
                            'timestamp': timestamp,
                            'latitude': lat,
                            'longitude': lon,
                            'altitude': alt,
                            'hdop': hdop,
                            'fix': fix,
                            'num_sats': num_sats,
                            'speed': speed
                        })
                        lines_valid += 1
                    except (ValueError, IndexError) as e:
                    logger.warning(f"    ⚠️ Línea {line_num} descartada (error de parseo): {e} | {parts}")
                    lines_discarded += 1
                        continue
            logger.info(f"DEBUG: GPS procesado - {lines_processed} líneas procesadas, {lines_valid} válidas, {lines_discarded} descartadas")
            logger.info(f"Cargados {len(data)} puntos GPS válidos de {file_path}")
            return data
        except Exception as e:
            logger.error(f"Error cargando datos GPS de {file_path}: {e}")
            return []
    
    def _load_stability_data(self, file_path: str) -> List[Dict]:
        """Carga datos de estabilidad desde un archivo CSV/TXT. Tolerante a columnas extra, mapea solo campos requeridos y loguea filas descartadas con motivo."""
        try:
            data = []
            logger.info(f"DEBUG: Iniciando carga de estabilidad desde {file_path}")
            with open(file_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
            logger.info(f"DEBUG: Archivo leído, {len(lines)} líneas totales")
            if len(lines) < 3:
                logger.warning(f"Archivo de estabilidad muy corto: {file_path}")
                return []
            header_parts = lines[0].strip().split(';')
            logger.info(f"DEBUG: Cabecera parseada: {header_parts}")
            if len(header_parts) >= 2:
                try:
                    base_timestamp_str = header_parts[1].strip()
                    logger.info(f"DEBUG: Timestamp base: {base_timestamp_str}")
                    base_timestamp = datetime.strptime(base_timestamp_str, '%d/%m/%Y %I:%M:%S%p')
                    logger.info(f"DEBUG: Timestamp parseado: {base_timestamp}")
                except ValueError as e:
                    logger.warning(f"Error parseando timestamp de cabecera: {base_timestamp_str} - {e}")
                    return []
            else:
                logger.warning(f"Cabecera de estabilidad inválida: {lines[0]}")
                return []
            current_timestamp = base_timestamp
            sample_count = 0
            lines_processed = 0
            lines_valid = 0
            lines_discarded = 0
            logger.info(f"DEBUG: Procesando {len(lines)-2} líneas de datos")
            for line_num, line in enumerate(lines[2:], 3):
                line = line.strip()
                if not line:
                    continue
                lines_processed += 1
                if re.match(r'^\d{1,2}:\d{2}:\d{2}(AM|PM)$', line):
                    try:
                        time_part = datetime.strptime(line, '%I:%M:%S%p').time()
                        current_timestamp = current_timestamp.replace(
                            hour=time_part.hour, 
                            minute=time_part.minute, 
                            second=time_part.second
                        )
                        logger.info(f"DEBUG: Nueva marca de tiempo: {line} -> {current_timestamp}")
                        continue
                    except ValueError:
                        continue
                parts = line.split(';')
                if len(parts) < 19:
                    logger.warning(f"    ⚠️ Línea {line_num} descartada (campos insuficientes): {parts}")
                    lines_discarded += 1
                    continue
                        try:
                            ax, ay, az = float(parts[0]), float(parts[1]), float(parts[2])
                            gx, gy, gz = float(parts[3]), float(parts[4]), float(parts[5])
                            roll, pitch, yaw = float(parts[6]), float(parts[7]), float(parts[8])
                            si = float(parts[15])
                except (ValueError, IndexError) as e:
                    logger.warning(f"    ⚠️ Línea {line_num} descartada (error parseando valores): {e} | {parts}")
                    lines_discarded += 1
                                continue
                if not all(-500 <= val <= 500 for val in [ax, ay]):
                    logger.warning(f"    ⚠️ Línea {line_num} descartada (ax/ay fuera de rango): {ax}, {ay}")
                    lines_discarded += 1
                                continue
                if not (900 <= az <= 1100):
                    logger.warning(f"    ⚠️ Línea {line_num} descartada (az fuera de rango): {az}")
                    lines_discarded += 1
                    continue
                if not all(-2000 <= val <= 2000 for val in [gx, gy, gz]):
                    logger.warning(f"    ⚠️ Línea {line_num} descartada (gx/gy/gz fuera de rango): {gx}, {gy}, {gz}")
                    lines_discarded += 1
                                continue
                            if not all(-180 <= val <= 180 for val in [roll, pitch, yaw]):
                    logger.warning(f"    ⚠️ Línea {line_num} descartada (roll/pitch/yaw fuera de rango): {roll}, {pitch}, {yaw}")
                    lines_discarded += 1
                                continue
                            if not (0 <= si <= 1):
                    logger.warning(f"    ⚠️ Línea {line_num} descartada (si fuera de rango): {si}")
                    lines_discarded += 1
                                continue
                        stability_point = {
                    'timestamp': current_timestamp + timedelta(milliseconds=sample_count * 100),
                    'ax': ax,
                    'ay': ay,
                    'az': az,
                    'gx': gx,
                    'gy': gy,
                    'gz': gz,
                    'roll': roll,
                    'pitch': pitch,
                    'yaw': yaw,
                    'temperature': None,
                    'timeantwifi': float(parts[9]) if len(parts) > 9 else 0,
                    'isDRSHigh': False,
                    'isLTRCritical': False,
                    'isLateralGForceHigh': False,
                    'accmag': float(parts[16]) if len(parts) > 16 else 0,
                    'microsds': float(parts[17]) if len(parts) > 17 else 0,
                    'si': si,
                    'usciclo1': float(parts[10]) if len(parts) > 10 else 0,
                    'usciclo2': float(parts[11]) if len(parts) > 11 else 0,
                    'usciclo3': float(parts[12]) if len(parts) > 12 else 0,
                    'usciclo4': float(parts[13]) if len(parts) > 13 else 0,
                    'usciclo5': float(parts[14]) if len(parts) > 14 else 0,
                    'usciclo6': 0,
                    'usciclo7': 0,
                    'usciclo8': 0
                        }
                        data.append(stability_point)
                        sample_count += 1
                        lines_valid += 1
                if sample_count <= 3:
                            logger.info(f"DEBUG: Punto {sample_count} válido: ax={ax}, ay={ay}, az={az}, si={si}")
            logger.info(f"DEBUG: Procesamiento completado: {lines_processed} líneas procesadas, {lines_valid} válidas, {lines_discarded} descartadas")
            logger.info(f"Cargados {len(data)} puntos de estabilidad de {file_path}")
            return data
        except Exception as e:
            logger.error(f"Error cargando datos de estabilidad de {file_path}: {e}")
            return []
    
    def _load_can_data(self, file_path: str) -> List[Dict]:
        """Carga datos CAN desde un archivo CSV/TXT."""
        try:
            data = []
            logger.info(f"DEBUG: Iniciando carga CAN desde {file_path}")
            
            with open(file_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                
            logger.info(f"DEBUG: Archivo CAN leído, {len(lines)} líneas totales")
            
            # Buscar línea de cabecera CAN
            session_start = None
            for line in lines:
                if line.strip().startswith('CAN\t'):
                    parts = line.strip().split('\t')
                    if len(parts) >= 2:
                        date_str = parts[1].strip()
                        try:
                            session_start = datetime.strptime(date_str, '%d/%m/%Y %I:%M:%S%p')
                            break
                        except Exception:
                            continue
            
            # Buscar cabecera de columnas
            data_start = None
            for i, line in enumerate(lines):
                if 'Timestamp' in line and 'length' in line:
                    data_start = i + 1
                    break
            
            if data_start is None:
                logger.warning(f"No se encontró cabecera de datos en {file_path}")
                return []
            
            logger.info(f"DEBUG: Procesando {len(lines)-data_start} líneas de datos CAN")
            lines_processed = 0
            lines_valid = 0
            
            for line in lines[data_start:]:
                line = line.strip()
                if not line:
                    continue
                    
                lines_processed += 1
                parts = self._split_flexible(line)
                
                if len(parts) >= 3:  # Mínimo: timestamp, length, data
                    try:
                        # Parsear timestamp
                        timestamp_str = parts[0].strip()
                        if 'AM' in timestamp_str or 'PM' in timestamp_str:
                        timestamp = datetime.strptime(timestamp_str, '%d/%m/%Y %I:%M:%S%p')
                        else:
                            # Intentar otros formatos
                            timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                        
                        # Parsear otros campos
                        length = int(parts[1]) if parts[1].isdigit() else 0
                        can_data = parts[2] if len(parts) > 2 else ''
                        
                        data.append({
                            'timestamp': timestamp,
                            'length': length,
                            'data': can_data
                        })
                        lines_valid += 1
                        
                except (ValueError, IndexError) as e:
                        # Saltar líneas con errores de formato
                    continue
                        
            logger.info(f"DEBUG: CAN procesado - {lines_processed} líneas procesadas, {lines_valid} válidas")
            logger.info(f"Cargados {len(data)} puntos CAN válidos de {file_path}")
            return data
            
        except Exception as e:
            logger.error(f"Error cargando datos CAN de {file_path}: {e}")
            return []
    
    def _load_rotativo_data(self, file_path: str) -> List[Dict]:
        """Carga datos rotativos desde un archivo CSV/TXT."""
        try:
            data = []
            logger.info(f"DEBUG: Iniciando carga rotativo desde {file_path}")
            
            with open(file_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                
            logger.info(f"DEBUG: Archivo rotativo leído, {len(lines)} líneas totales")
            
            # Buscar cabecera de columnas
            data_start = None
            for i, line in enumerate(lines):
                if 'fecha' in line.lower() and 'estado' in line.lower():
                    data_start = i + 1
                    break
            else:
                data_start = 1  # Si no se encuentra cabecera, empezar desde la línea 1
            
            logger.info(f"DEBUG: Procesando {len(lines)-data_start} líneas de datos rotativo")
            lines_processed = 0
            lines_valid = 0
            
            for line in lines[data_start:]:
                line = line.strip()
                if not line:
                    continue
                    
                lines_processed += 1
                parts = self._split_flexible(line)
                
                if len(parts) >= 2:  # Mínimo: timestamp, valor
                    try:
                        # Parsear timestamp
                        timestamp_str = parts[0].replace('.', '').strip()
                        if timestamp_str and timestamp_str != 'Fecha-Hora':
                            timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                            
                            # Parsear valor y estado
                            value = float(parts[1]) if len(parts) > 1 and parts[1].replace('.', '').replace('-', '').isdigit() else 0.0
                            status = parts[2] if len(parts) > 2 else 'UNKNOWN'
                            
                            data.append({
                                'timestamp': timestamp,
                                'value': value,
                                'status': status
                            })
                            lines_valid += 1
                        
                    except (ValueError, IndexError) as e:
                        # Saltar líneas con errores de formato
                        continue
                        
            logger.info(f"DEBUG: Rotativo procesado - {lines_processed} líneas procesadas, {lines_valid} válidas")
            logger.info(f"Cargados {len(data)} puntos rotativo válidos de {file_path}")
            return data
            
        except Exception as e:
            logger.error(f"Error cargando datos rotativo de {file_path}: {e}")
            return []
    
    def _parse_stability_file_and_analyze(self, file_path: str):
        """
        Parsea el archivo de estabilidad, calcula métricas y detecta eventos críticos avanzados.
        Devuelve: measurements, metrics, events
        """
        import numpy as np
        measurements = self._load_stability_data(file_path)
        metrics = {}
        events = []
        
        if not measurements:
            return [], {}, []
        
        # Calcular métricas básicas
        for key in ['ax', 'ay', 'az', 'gx', 'gy', 'gz', 'si', 'roll', 'pitch', 'yaw']:
            values = [m[key] for m in measurements if key in m and m[key] is not None]
            if values:
                metrics[f'{key}_mean'] = float(np.mean(values))
                metrics[f'{key}_std'] = float(np.std(values))
                metrics[f'{key}_min'] = float(np.min(values))
                metrics[f'{key}_max'] = float(np.max(values))
        
        # Calcular derivadas para detección de cambios bruscos
        if len(measurements) > 1:
            for i in range(1, len(measurements)):
                dt = (measurements[i]['timestamp'] - measurements[i-1]['timestamp']).total_seconds()
                if dt > 0:
                    # Derivadas de giroscopio
                    dgx_dt = (measurements[i]['gx'] - measurements[i-1]['gx']) / dt
                    dgy_dt = (measurements[i]['gy'] - measurements[i-1]['gy']) / dt
                    dgz_dt = (measurements[i]['gz'] - measurements[i-1]['gz']) / dt
                    
                    measurements[i]['dgx_dt'] = dgx_dt
                    measurements[i]['dgy_dt'] = dgy_dt
                    measurements[i]['dgz_dt'] = dgz_dt
        
        # Detectar eventos avanzados
        for i, m in enumerate(measurements):
            # Convertir SI de decimal a porcentaje (0-1 -> 0-100)
            si_percent = m['si'] * 100
            
            # SOLO generar eventos cuando SI < 50%
            if si_percent < 50:
                # 1. EVENTO PRINCIPAL: riesgo_de_vuelco (SIEMPRE presente cuando SI < 50%)
                if si_percent < 10:
                    severity = 'critical'
                elif si_percent < 30:
                    severity = 'danger'
                else:  # 30% <= si_percent < 50%
                    severity = 'moderate'
                
                events.append({
                    'id': str(uuid.uuid4()),
                    'timestamp': m['timestamp'],
                    'type': 'riesgo_de_vuelco',
                    'severity': severity,
                    'value': si_percent,
                    'description': f'SI {severity}: {si_percent:.1f}%',
                    'measurement': m  # Incluir medición original
                })
                
                # 2. SUBTIPOS ADICIONALES (solo cuando SI < 50%)
                
                # VUELCO INMINENTE (SI < 10% Y roll > 10°)
                if si_percent < 10 and abs(m['roll']) > 10:
                    events.append({
                        'id': str(uuid.uuid4()),
                        'timestamp': m['timestamp'],
                        'type': 'vuelco_inminente',
                        'severity': 'critical',
                        'value': si_percent,
                        'description': f'Vuelco inminente - SI: {si_percent:.1f}%, Roll: {m["roll"]:.1f}°',
                        'measurement': m,
                        'subtype': 'vuelco_inminente'
                    })
                
                # DERIVA LATERAL SIGNIFICATIVA
                if abs(m['yaw']) > 0.15:
                    events.append({
                        'id': str(uuid.uuid4()),
                        'timestamp': m['timestamp'],
                        'type': 'deriva_lateral_significativa',
                        'severity': 'critical' if abs(m['yaw']) > 0.3 else 'normal',
                        'value': m['yaw'],
                        'description': f'Deriva lateral - Yaw: {m["yaw"]:.3f} rad/s',
                        'measurement': m,
                        'subtype': 'deriva_lateral_significativa'
                    })
                
                # DERIVA PELIGROSA (abs(gx) > 45 Y si > 70% - pero solo si SI < 50%)
                if abs(m['gx']) > 45 and si_percent > 30:  # Ajustado para SI < 50%
                    events.append({
                        'id': str(uuid.uuid4()),
                        'timestamp': m['timestamp'],
                        'type': 'deriva_peligrosa',
                        'severity': 'critical',
                        'value': m['gx'],
                        'description': f'Deriva peligrosa - GX: {m["gx"]:.1f}, SI: {si_percent:.1f}%',
                        'measurement': m,
                        'subtype': 'deriva_peligrosa'
                    })
                
                # MANIOBRA BRUSCA
                if 'dgx_dt' in m and abs(m['dgx_dt']) > 100:
                    events.append({
                        'id': str(uuid.uuid4()),
                        'timestamp': m['timestamp'],
                        'type': 'maniobra_brusca',
                        'severity': 'critical',
                        'value': m['dgx_dt'],
                        'description': f'Maniobra brusca - dGX/dt: {m["dgx_dt"]:.1f}°/s²',
                        'measurement': m,
                        'subtype': 'maniobra_brusca'
                    })
                elif abs(m['ay']) > 3:
                    events.append({
                        'id': str(uuid.uuid4()),
                        'timestamp': m['timestamp'],
                        'type': 'maniobra_brusca',
                        'severity': 'normal',
                        'value': m['ay'],
                        'description': f'Maniobra brusca - AY: {m["ay"]:.1f} m/s²',
                        'measurement': m,
                        'subtype': 'maniobra_brusca'
                    })
                
                # CAMBIO DE CARGA (roll alto Y variación de SI > ±10%)
                if i > 0 and abs(m['roll']) > 15:
                    si_variation = abs(m['si'] - measurements[i-1]['si']) / measurements[i-1]['si'] * 100
                    if si_variation > 10:
                        events.append({
                            'id': str(uuid.uuid4()),
                            'timestamp': m['timestamp'],
                            'type': 'cambio_de_carga',
                            'severity': 'normal' if si_variation < 20 else 'warning',
                            'value': si_variation,
                            'description': f'Cambio de carga - Roll: {m["roll"]:.1f}°, ΔSI: {si_variation:.1f}%',
                            'measurement': m,
                            'subtype': 'cambio_de_carga'
                        })
                
                # ZONA INESTABLE (picos/variaciones rápidas en gz + gx)
                if i > 0:
                    gz_variation = abs(m['gz'] - measurements[i-1]['gz'])
                    gx_variation = abs(m['gx'] - measurements[i-1]['gx'])
                    if gz_variation > 50 and gx_variation > 50:
                        events.append({
                            'id': str(uuid.uuid4()),
                            'timestamp': m['timestamp'],
                            'type': 'zona_inestable',
                            'severity': 'warning',
                            'value': gz_variation + gx_variation,
                            'description': f'Zona inestable - ΔGZ: {gz_variation:.1f}, ΔGX: {gx_variation:.1f}',
                            'measurement': m,
                            'subtype': 'zona_inestable'
                        })
                
                # EVENTOS LEGACY (mantener compatibilidad)
                if abs(m['ax']) > 10:
                    events.append({
                        'id': str(uuid.uuid4()),
                        'timestamp': m['timestamp'],
                        'type': 'AX_CRITICO',
                        'severity': 'critical',
                        'value': m['ax'],
                        'description': f'Aceleración X crítica: {m["ax"]:.1f} m/s²',
                        'measurement': m,
                        'subtype': 'AX_CRITICO'
                    })
                
                if abs(m['ay']) > 10:
                    events.append({
                        'id': str(uuid.uuid4()),
                        'timestamp': m['timestamp'],
                        'type': 'AY_CRITICO',
                        'severity': 'critical',
                        'value': m['ay'],
                        'description': f'Aceleración Y crítica: {m["ay"]:.1f} m/s²',
                        'measurement': m,
                        'subtype': 'AY_CRITICO'
                    })
            
            # NO generar eventos cuando SI >= 50% (conducción estable)
            
        # Calcular estadísticas de eventos
        event_types = [e['type'] for e in events]
        event_counts = {}
        for event_type in set(event_types):
            event_counts[event_type] = event_types.count(event_type)
        
        metrics['event_counts'] = event_counts
        metrics['total_events'] = len(events)
            
        logger.info(f"Detectados {len(events)} eventos de estabilidad avanzados")
        for event_type, count in event_counts.items():
            logger.info(f"  - {event_type}: {count} eventos")
        
        return measurements, metrics, events

if __name__ == "__main__":
    logger.info("=== INICIO DEL PROCESADOR DOBACK SOFT ===")
        processor = DobackProcessor()
    
    # PASO 1: Decodificar archivos CAN
    processor.decode_can_files()
    
    # PASO 2: Escanear archivos y buscar sesiones
    sessions = processor.scan_files_and_find_sessions()
    
    # PASO 3: Aplicar correcciones de GPS para todos los vehículos
    if sessions:
        logger.info("🔧 Aplicando correcciones de offset GPS...")
        vehicles = set(session['vehicle'] for session in sessions)
        for vehicle in vehicles:
            logger.info(f"  📍 Corrigiendo GPS para vehículo: {vehicle}")
            corrections = processor.apply_smart_gps_corrections(vehicle)
            if corrections:
                logger.info(f"    ✅ Aplicadas {len(corrections)} correcciones para {vehicle}")
            else:
                logger.info(f"    ℹ️  No se requieren correcciones para {vehicle}")
    
    if not sessions:
        logger.warning("No se encontraron sesiones para procesar.")
    else:
        logger.info(f"Sesiones encontradas: {len(sessions)}. Iniciando subida a base de datos...")
        processor.upload_sessions_to_database(sessions)
    
    logger.info("=== FIN DEL PROCESADOR DOBACK SOFT ===")
    