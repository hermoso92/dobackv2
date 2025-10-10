#!/usr/bin/env python3
"""
Procesador automático para PostgreSQL - Doback Soft
Procesa archivos CAN, estabilidad, GPS y rotativo de empresas reales
"""

import os
import sys
import json
import asyncio
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import uuid
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import time

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('postgres_processor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class FileInfo:
    """Información de archivo detectado"""
    path: Path
    company: str
    vehicle: str
    date: datetime
    sequence: int
    file_type: str  # CAN, ESTABILIDAD, GPS, ROTATIVO
    session_id: Optional[str] = None

@dataclass
class SessionGroup:
    """Grupo de archivos que forman una sesión"""
    company: str
    vehicle: str
    date: datetime
    files: Dict[str, FileInfo]
    session_id: Optional[str] = None

class PostgresProcessor:
    def __init__(self, base_path: str = ".", db_config: Optional[Dict] = None):
        # Resolver ruta absoluta basada en la ubicación real del script
        script_dir = Path(__file__).parent
        if base_path == ".":
            # Cambiar la ruta por defecto para apuntar a los datos reales
            self.base_path = script_dir.parent.parent / "data" / "datosDoback"
        else:
            self.base_path = Path(base_path).resolve()
        
        # Configuración de base de datos
        self.db_config = db_config or {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'dobacksoft'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'cosigein')
        }
        
        # Directorio para archivos procesados
        self.processed_dir = self.base_path / "processed"
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        
        # Mapeo de tipos de archivo
        self.file_types = {
            'CAN': 'can',
            'ESTABILIDAD': 'stability', 
            'GPS': 'gps',
            'ROTATIVO': 'rotativo'
        }
        
        logger.info(f"Procesador inicializado en: {self.base_path}")
        logger.info(f"Configuración DB: {self.db_config['host']}:{self.db_config['port']}/{self.db_config['database']}")

    def get_db_connection(self):
        """Obtener conexión a PostgreSQL"""
        try:
            conn = psycopg2.connect(
                **self.db_config, 
                cursor_factory=RealDictCursor,
                client_encoding='utf8'
            )
            return conn
        except Exception as e:
            logger.error(f"Error conectando a PostgreSQL: {e}")
            raise

    def scan_companies(self) -> List[str]:
        """Escanear carpetas de empresas"""
        companies = []
        try:
            for item in os.listdir(self.base_path):
                item_path = self.base_path / item
                if item_path.is_dir() and not item.startswith('.'):
                    companies.append(item)
            logger.info(f"Empresas detectadas: {companies}")
            return companies
        except Exception as e:
            logger.error(f"Error escaneando empresas: {e}")
            return []

    def parse_filename(self, filename: str) -> Optional[Tuple[str, str, datetime, int]]:
        """Parsear nombre de archivo: múltiples formatos soportados"""
        try:
            # Descarta archivos RealTime
            if "RealTime" in filename or "REALTIME" in filename:
                logger.debug(f"Archivo RealTime descartado: {filename}")
                return None
                
            # Ejemplos de formatos detectados:
            # CAN_DOBACK022_20250707_0.txt
            # 1_CAN_DOBACK012_20250610_58.txt
            # ESTABILIDAD_DOBACK022_20250707_0.txt
            
            # Remover extensión
            name = filename.replace('.txt', '')
            
            # Caso 1: Formato estándar Tipo_DOBACK<vehículo>_<YYYY-MM-DD>_<secuencia>
            if '_DOBACK' in name and len(name.split('_')) >= 4:
                parts = name.split('_')
                
                # Buscar la parte que contiene DOBACK
                doback_index = None
                for i, part in enumerate(parts):
                    if 'DOBACK' in part:
                        doback_index = i
                        break
                
                if doback_index is not None:
                    file_type = parts[0]  # CAN, ESTABILIDAD, GPS, ROTATIVO
                    vehicle_part = parts[doback_index]  # DOBACK022
                    vehicle = vehicle_part.replace('DOBACK', '')  # 022
                    
                    # Buscar fecha en formato YYYYMMDD
                    date_str = None
                    sequence = 0
                    
                    for part in parts[doback_index + 1:]:
                        if len(part) == 8 and part.isdigit():
                            # Formato YYYYMMDD
                            date_str = f"{part[:4]}-{part[4:6]}-{part[6:8]}"
                        elif part.isdigit() and len(part) <= 3:
                            # Secuencia numérica
                            sequence = int(part)
                    
                    if date_str:
                        date = datetime.strptime(date_str, '%Y-%m-%d')
                        return file_type, vehicle, date, sequence
            
            # Caso 2: Formato con prefijo numérico: 1_CAN_DOBACK012_20250610_58
            if name[0].isdigit() and '_' in name:
                parts = name.split('_')
                if len(parts) >= 4 and 'DOBACK' in parts[2]:
                    file_type = parts[1]  # CAN, ESTABILIDAD, GPS
                    vehicle_part = parts[2]  # DOBACK012
                    vehicle = vehicle_part.replace('DOBACK', '')
                    
                    # Buscar fecha en formato YYYYMMDD
                    date_str = None
                    sequence = 0
                    
                    for part in parts[3:]:
                        if len(part) == 8 and part.isdigit():
                            date_str = f"{part[:4]}-{part[4:6]}-{part[6:8]}"
                        elif part.isdigit() and len(part) <= 3:
                            sequence = int(part)
                    
                    if date_str:
                        date = datetime.strptime(date_str, '%Y-%m-%d')
                        return file_type, vehicle, date, sequence
            
            logger.debug(f"Formato no reconocido: {filename}")
            return None
            
        except Exception as e:
            logger.debug(f"Error parseando {filename}: {e}")
            return None

    def scan_files(self, company: str) -> List[FileInfo]:
        """Escanear archivos de una empresa"""
        files = []
        company_path = self.base_path / company
        logger.info(f"[SCAN] Explorando empresa: {company_path}")
        
        try:
            # Primero buscar vehículos dentro de la empresa
            for vehicle_dir in company_path.iterdir():
                if vehicle_dir.is_dir() and not vehicle_dir.name.startswith('.'):
                    logger.info(f"[SCAN] Explorando vehículo: {vehicle_dir}")
                    
                    # Buscar tipos de archivo dentro del vehículo
                    for file_type in ['CAN', 'estabilidad', 'GPS', 'ROTATIVO']:
                        type_path = vehicle_dir / file_type
                        logger.info(f"[SCAN] Buscando en carpeta: {type_path}")
                        if not type_path.exists():
                            logger.warning(f"[SCAN] Carpeta no existe: {type_path}")
                            continue
                            
                        for file_path in type_path.glob('*.txt'):
                            logger.info(f"[SCAN] Encontrado archivo: {file_path}")
                            if file_path.is_file():
                                parsed = self.parse_filename(file_path.name)
                                if parsed:
                                    file_type_name, vehicle, date, sequence = parsed
                                    file_info = FileInfo(
                                        path=file_path,
                                        company=company,
                                        vehicle=vehicle,
                                        date=date,
                                        sequence=sequence,
                                        file_type=file_type_name
                                    )
                                    files.append(file_info)
                                else:
                                    logger.warning(f"[SCAN] No se pudo parsear: {file_path.name}")
                                    
            logger.info(f"Archivos detectados en {company}: {len(files)}")
            return files
        except Exception as e:
            logger.error(f"Error escaneando archivos de {company}: {e}")
            return []

    def group_sessions(self, files: List[FileInfo]) -> List[SessionGroup]:
        """Agrupar archivos por sesión (mismo vehículo y fecha)"""
        sessions = {}
        
        for file_info in files:
            # Clave de sesión: empresa_vehículo_fecha
            session_key = f"{file_info.company}_{file_info.vehicle}_{file_info.date.strftime('%Y-%m-%d')}"
            
            if session_key not in sessions:
                sessions[session_key] = SessionGroup(
                    company=file_info.company,
                    vehicle=file_info.vehicle,
                    date=file_info.date,
                    files={}
                )
            
            sessions[session_key].files[file_info.file_type] = file_info
        
        # Filtrar sesiones completas (con al menos CAN y ESTABILIDAD)
        complete_sessions = []
        for session in sessions.values():
            if 'CAN' in session.files and 'ESTABILIDAD' in session.files:
                complete_sessions.append(session)
        
        logger.info(f"Sesiones completas detectadas: {len(complete_sessions)}")
        return complete_sessions

    def ensure_organization(self, conn, company_name: str) -> str:
        """Crear organización si no existe"""
        try:
            # Buscar organización existente
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM \"Organization\" WHERE name = %s",
                    (company_name,)
                )
                result = cur.fetchone()
                
                if result:
                    org_id = result['id']
                    logger.info(f"Organización existente: {company_name} ({org_id})")
                    return org_id
                
                # Crear nueva organización
                org_id = str(uuid.uuid4())
                api_key = f"org_{company_name.lower()}_{int(time.time())}"
                
                cur.execute("""
                    INSERT INTO "Organization" (id, name, "apiKey", "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, %s)
                """, (org_id, company_name, api_key, datetime.now(), datetime.now()))
                
                conn.commit()
                logger.info(f"Nueva organización creada: {company_name} ({org_id})")
                return org_id
                
        except Exception as e:
            logger.error(f"Error con organización {company_name}: {e}")
            conn.rollback()
            raise

    def ensure_vehicle(self, conn, org_id: str, vehicle_name: str) -> str:
        """Crear vehículo si no existe"""
        try:
            # Buscar vehículo existente
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id FROM "Vehicle" 
                    WHERE "organizationId" = %s AND identifier = %s
                """, (org_id, vehicle_name))
                result = cur.fetchone()
                
                if result:
                    vehicle_id = result['id']
                    logger.info(f"Vehículo existente: {vehicle_name} ({vehicle_id})")
                    return vehicle_id
                
                # Crear nuevo vehículo
                vehicle_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO "Vehicle" (
                        id, name, model, "licensePlate", brand, "organizationId", 
                        "createdAt", "updatedAt", identifier, type, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    vehicle_id, vehicle_name, "Doback", vehicle_name, "Doback",
                    org_id, datetime.now(), datetime.now(), vehicle_name,
                    "TRUCK", "ACTIVE"
                ))
                
                conn.commit()
                logger.info(f"Nuevo vehículo creado: {vehicle_name} ({vehicle_id})")
                return vehicle_id
                
        except Exception as e:
            logger.error(f"Error con vehículo {vehicle_name}: {e}")
            conn.rollback()
            raise

    def ensure_user(self, conn, org_id: str) -> str:
        """Crear usuario por defecto si no existe"""
        try:
            # Buscar usuario existente
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id FROM "User" 
                    WHERE "organizationId" = %s AND email = %s
                """, (org_id, "admin@doback.local"))
                result = cur.fetchone()
                
                if result:
                    user_id = result['id']
                    logger.info(f"Usuario existente: admin@doback.local ({user_id})")
                    return user_id
                
                # Crear nuevo usuario
                user_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO "User" (
                        id, email, name, password, "organizationId", 
                        "createdAt", "updatedAt", role, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id, "admin@doback.local", "Administrador Doback",
                    "hashed_password_placeholder", org_id, datetime.now(), datetime.now(),
                    "ADMIN", "ACTIVE"
                ))
                
                conn.commit()
                logger.info(f"Nuevo usuario creado: admin@doback.local ({user_id})")
                return user_id
                
        except Exception as e:
            logger.error(f"Error con usuario: {e}")
            conn.rollback()
            raise

    def create_session(self, conn, org_id: str, vehicle_id: str, user_id: str, 
                      session_group: SessionGroup) -> str:
        """Crear sesión en la base de datos"""
        try:
            session_id = str(uuid.uuid4())
            start_time = session_group.date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = start_time.replace(hour=23, minute=59, second=59)
            
            # Limpiar sesiones existentes para evitar conflictos
            self.clean_existing_sessions(conn, vehicle_id, start_time)
            
            # Obtener el siguiente número de sesión para este vehículo y fecha
            session_number = self.get_next_session_number(conn, vehicle_id, start_time)
            
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO "Session" (
                        id, "vehicleId", "userId", "startTime", "endTime",
                        "createdAt", sequence, "sessionNumber", status, type,
                        "organizationId", "updatedAt"
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    session_id, vehicle_id, user_id, start_time, end_time,
                    datetime.now(), 1, session_number, "ACTIVE", "ROUTINE",
                    org_id, datetime.now()
                ))
                
                conn.commit()
                logger.info(f"Nueva sesión creada: {session_id} para {session_group.vehicle} (sesión #{session_number})")
                return session_id
                
        except Exception as e:
            logger.error(f"Error creando sesión: {e}")
            conn.rollback()
            raise
    
    def get_next_session_number(self, conn, vehicle_id: str, start_time: datetime) -> int:
        """Obtener el siguiente número de sesión para un vehículo y fecha"""
        try:
            with conn.cursor() as cur:
                # Usar una aproximación más simple y robusta
                cur.execute("""
                    SELECT COALESCE(MAX("sessionNumber"), 0) + 1
                    FROM "Session"
                    WHERE "vehicleId" = %s 
                    AND DATE("startTime") = DATE(%s)
                """, (vehicle_id, start_time))
                
                result = cur.fetchone()
                next_number = result[0] if result and result[0] is not None else 1
                    
                logger.info(f"Próximo número de sesión para {vehicle_id} en {start_time.date()}: {next_number}")
                return next_number
                
        except Exception as e:
            logger.error(f"Error obteniendo número de sesión: {e}")
            # En caso de error, intentar obtener el siguiente número de forma más simple
            try:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT COUNT(*) + 1
                        FROM "Session"
                        WHERE "vehicleId" = %s 
                        AND DATE("startTime") = DATE(%s)
                    """, (vehicle_id, start_time))
                    result = cur.fetchone()
                    return result[0] if result else 1
            except:
                return 1
    
    def clean_existing_sessions(self, conn, vehicle_id: str, start_time: datetime) -> bool:
        """Limpia sesiones existentes para un vehículo y fecha específicos"""
        try:
            with conn.cursor() as cur:
                # Eliminar mediciones asociadas primero
                cur.execute("""
                    DELETE FROM "StabilityMeasurement"
                    WHERE "sessionId" IN (
                        SELECT id FROM "Session"
                        WHERE "vehicleId" = %s 
                        AND DATE("startTime") = DATE(%s)
                    )
                """, (vehicle_id, start_time))
                
                # Eliminar sesiones
                cur.execute("""
                    DELETE FROM "Session"
                    WHERE "vehicleId" = %s 
                    AND DATE("startTime") = DATE(%s)
                """, (vehicle_id, start_time))
                
                deleted_count = cur.rowcount
                if deleted_count > 0:
                    logger.info(f"Eliminadas {deleted_count} sesiones existentes para {vehicle_id} en {start_time.date()}")
                
                return True
                
        except Exception as e:
            logger.error(f"Error limpiando sesiones existentes: {e}")
            return False

    def process_can_file(self, file_info: FileInfo) -> List[Dict]:
        """Procesar archivo CAN y extraer mediciones"""
        measurements = []
        try:
            # Leer archivo CAN
            df = pd.read_csv(file_info.path, sep=';', skiprows=1)
            
            for _, row in df.iterrows():
                try:
                    # Parsear timestamp
                    timestamp_str = str(row.iloc[0])  # Primera columna
                    if pd.isna(timestamp_str) or timestamp_str == 'nan':
                        continue
                        
                    # Intentar diferentes formatos de timestamp
                    timestamp = None
                    for fmt in ['%Y-%m-%d %H:%M:%S', '%d/%m/%Y %H:%M:%S', '%H:%M:%S']:
                        try:
                            if fmt == '%H:%M:%S':
                                # Combinar con la fecha del archivo
                                timestamp = datetime.combine(
                                    file_info.date,
                                    datetime.strptime(timestamp_str, fmt).time()
                                )
                            else:
                                timestamp = datetime.strptime(timestamp_str, fmt)
                            break
                        except:
                            continue
                    
                    if not timestamp:
                        continue
                    
                    # Extraer datos básicos (ajustar según estructura real)
                    measurement = {
                        'timestamp': timestamp,
                        'engineRpm': float(row.get('RPM', 0)) if 'RPM' in row else 0,
                        'vehicleSpeed': float(row.get('Velocidad', 0)) if 'Velocidad' in row else 0,
                        'fuelSystemStatus': float(row.get('Combustible', 0)) if 'Combustible' in row else 0,
                        'temperature': float(row.get('Temperatura', 0)) if 'Temperatura' in row else None
                    }
                    
                    measurements.append(measurement)
                    
                except Exception as e:
                    logger.debug(f"Error procesando fila CAN: {e}")
                    continue
                    
            logger.info(f"Mediciones CAN extraídas: {len(measurements)} de {file_info.path}")
            return measurements
            
        except Exception as e:
            logger.error(f"Error procesando archivo CAN {file_info.path}: {e}")
            return []

    def process_stability_file(self, file_info: FileInfo) -> list:
        print("[DEBUG] >>>>> Entrando en process_stability_file para:", file_info.path)
        """Procesar archivo de estabilidad y extraer mediciones alineadas al modelo de la app, interpolando timestamps correctamente entre marcas de hora y forzando incremento si es necesario."""
        import uuid
        from datetime import datetime, timedelta
        import re
        measurements = []
        try:
            print("[DEBUG] Antes de abrir el archivo de ESTABILIDAD")
            with open(file_info.path, 'r', encoding='utf-8') as f:
                print("[DEBUG] Archivo abierto correctamente")
                lines = [line.strip() for line in f if line.strip()]
                print(f"[DEBUG] Líneas leídas: {len(lines)}")
                print("Primeras 30 líneas del archivo:")
                for l in lines[:30]:
                    print(l)
                data_lines = lines[2:]
                print("Primeras 30 líneas de data_lines (sin cabecera):")
                for l in data_lines[:30]:
                    print(l)

            if len(lines) < 3:
                return []

            # 1. Parsear cabecera de sesión
            header = lines[0].split(';')
            fecha_str = header[1].strip()  # '10/07/2025 08:14:54AM'
            vehiculo = header[2].strip()
            fecha_base = datetime.strptime(fecha_str, '%d/%m/%Y %I:%M:%S%p')

            # 2. Detectar marcas de hora y agrupar bloques
            data_lines = lines[2:]
            hora_regex = re.compile(r'^[0-9]{2}:[0-9]{2}:[0-9]{2}(AM|PM)$')
            marcas = [fecha_base]
            bloques = []
            bloque_actual = []
            for line in data_lines:
                if hora_regex.match(line):
                    # Nueva marca de hora
                    marcas.append(datetime.strptime(f"{fecha_base.strftime('%d/%m/%Y')} {line}", '%d/%m/%Y %I:%M:%S%p'))
                    if bloque_actual:
                        bloques.append(bloque_actual)
                        bloque_actual = []
                else:
                    # Fila de datos
                    bloque_actual.append(line)
            if bloque_actual:
                bloques.append(bloque_actual)

            # Diagnóstico: imprimir marcas de hora detectadas
            print("Marcas de hora detectadas:")
            for idx, marca in enumerate(marcas):
                print(f"  Marca {idx}: {marca}")
            print(f"Total marcas: {len(marcas)}")
            print(f"Total bloques: {len(bloques)}")
            for i, bloque in enumerate(bloques):
                print(f"Bloque {i}: filas={len(bloque)}")

            # 3. Interpolar timestamps y construir measurements
            for i, bloque in enumerate(bloques):
                n = len(bloque)
                if n == 0:
                    continue
                t_start = marcas[i]
                t_end = marcas[i+1] if i+1 < len(marcas) else None
                if t_end and n > 1 and t_end > t_start:
                    total_seconds = (t_end - t_start).total_seconds()
                    step = total_seconds / (n - 1)
                    ts_list = [t_start + timedelta(seconds=step * j) for j in range(n)]
                else:
                    # Solo una marca o marcas iguales: sumar 1 segundo incremental
                    ts_list = [t_start + timedelta(seconds=j) for j in range(n)]
                print(f"Primeros 10 timestamps bloque {i}: {[str(ts) for ts in ts_list[:10]]}")
                for j, line in enumerate(bloque):
                    valores = [v.strip() for v in line.split(';') if v.strip()]
                    measurement = {
                        'id': str(uuid.uuid4()),
                        'timestamp': ts_list[j],
                        'vehiculo': vehiculo,
                        # ... aquí mapear los campos restantes según el modelo ...
                    }
                    # Si hay más columnas, añadirlas aquí
                    measurements.append(measurement)
            return measurements
        except Exception as e:
            print(f"Error procesando archivo de estabilidad: {e}")
            return []

    def process_gps_file(self, file_info: FileInfo) -> List[Dict]:
        """Procesar archivo GPS y extraer mediciones. Tolerante a columnas extra, mapea solo campos requeridos y loguea filas descartadas con motivo."""
        measurements = []
        total, valid, descartadas = 0, 0, 0
        try:
            import pandas as pd
            from datetime import datetime
            # Leer archivo GPS
            df = pd.read_csv(file_info.path, sep=';', skiprows=1)
            for idx, row in df.iterrows():
                total += 1
                try:
                    timestamp_str = str(row.iloc[0])
                    if pd.isna(timestamp_str) or timestamp_str == 'nan':
                        descartadas += 1
                        continue
                    timestamp = None
                    for fmt in ['%Y-%m-%d %H:%M:%S', '%d/%m/%Y %H:%M:%S', '%H:%M:%S']:
                        try:
                            if fmt == '%H:%M:%S':
                                timestamp = datetime.combine(
                                    file_info.date,
                                    datetime.strptime(timestamp_str, fmt).time()
                                )
                            else:
                                timestamp = datetime.strptime(timestamp_str, fmt)
                            break
                        except Exception:
                            continue
                    if not timestamp:
                        logger.warning(f"    ⚠️ Fila {idx} descartada (timestamp inválido): {row.to_dict()}")
                        descartadas += 1
                        continue
                    lat = float(row.get('Latitud', 0)) if 'Latitud' in row else 0
                    lon = float(row.get('Longitud', 0)) if 'Longitud' in row else 0
                    if lat == 0 and lon == 0:
                        logger.warning(f"    ⚠️ Fila {idx} descartada (lat/lon nulos): {row.to_dict()}")
                        descartadas += 1
                        continue
                    measurement = {
                        'timestamp': timestamp,
                        'latitude': lat,
                        'longitude': lon,
                        'altitude': float(row.get('Altitud', 0)) if 'Altitud' in row else 0,
                        'speed': float(row.get('Velocidad', 0)) if 'Velocidad' in row else 0,
                        'satellites': int(row.get('Satelites', 0)) if 'Satelites' in row else 0,
                        'quality': str(row.get('Calidad', '')) if 'Calidad' in row else None
                    }
                    measurements.append(measurement)
                    valid += 1
                except Exception as e:
                    logger.warning(f"    ⚠️ Fila {idx} descartada (error de parseo): {e} | {row.to_dict()}")
                    descartadas += 1
                    continue
            logger.info(f"    ✅ GPS: filas leídas={total}, válidas={valid}, descartadas={descartadas}")
            return measurements
        except Exception as e:
            logger.error(f"Error procesando archivo GPS {file_info.path}: {e}")
            return []

    def insert_measurements(self, conn, session_id: str, measurements: list, table: str):
        """Insertar mediciones en la tabla correspondiente, alineando campos"""
        try:
            with conn.cursor() as cur:
                for m in measurements:
                    m['sessionId'] = session_id
                    columns = [
                        'id', 'timestamp', 'ax', 'ay', 'az', 'gx', 'gy', 'gz', 'roll', 'pitch', 'yaw',
                        'timeantwifi', 'sessionId', 'createdAt', 'isDRSHigh', 'isLTRCritical', 'isLateralGForceHigh',
                        'temperature', 'updatedAt', 'accmag', 'microsds', 'si',
                        'usciclo1', 'usciclo2', 'usciclo3', 'usciclo4', 'usciclo5', 'usciclo6', 'usciclo7', 'usciclo8'
                    ]
                    values = [m.get(col) for col in columns]
                    sql = f"""
                        INSERT INTO "StabilityMeasurement" ({', '.join(columns)})
                        VALUES ({', '.join(['%s'] * len(columns))})
                    """
                    cur.execute(sql, values)
                conn.commit()
        except Exception as e:
            conn.rollback()
            raise

    def process_session(self, session_group: SessionGroup) -> bool:
        """Procesar una sesión completa"""
        try:
            conn = self.get_db_connection()
            
            # 1. Asegurar organización
            org_id = self.ensure_organization(conn, session_group.company)
            
            # 2. Asegurar vehículo
            vehicle_id = self.ensure_vehicle(conn, org_id, session_group.vehicle)
            
            # 3. Asegurar usuario
            user_id = self.ensure_user(conn, org_id)
            
            # 4. Crear sesión
            session_id = self.create_session(conn, org_id, vehicle_id, user_id, session_group)
            
            # 5. Procesar archivos y insertar mediciones
            if 'CAN' in session_group.files:
                can_measurements = self.process_can_file(session_group.files['CAN'])
                self.insert_measurements(conn, session_id, can_measurements, 'can')
            
            if 'ESTABILIDAD' in session_group.files:
                stability_measurements = self.process_stability_file(session_group.files['ESTABILIDAD'])
                self.insert_measurements(conn, session_id, stability_measurements, 'stability')
            
            if 'GPS' in session_group.files:
                gps_measurements = self.process_gps_file(session_group.files['GPS'])
                self.insert_measurements(conn, session_id, gps_measurements, 'gps')
            
            # 6. Marcar archivos como procesados
            for file_info in session_group.files.values():
                processed_path = self.processed_dir / f"{file_info.path.name}.processed"
                file_info.path.rename(processed_path)
            
            conn.close()
            logger.info(f"Sesión procesada exitosamente: {session_group.company}/{session_group.vehicle}")
            return True
            
        except Exception as e:
            logger.error(f"Error procesando sesión {session_group.company}/{session_group.vehicle}: {e}")
            return False

    def run(self):
        """Ejecutar el procesador completo"""
        logger.info("Iniciando procesador PostgreSQL...")
        
        try:
            # 1. Escanear empresas
            companies = self.scan_companies()
            if not companies:
                logger.warning("No se detectaron empresas")
                return
            
            # 2. Procesar cada empresa
            total_sessions = 0
            successful_sessions = 0
            
            for company in companies:
                logger.info(f"Procesando empresa: {company}")
                
                # Escanear archivos
                files = self.scan_files(company)
                if not files:
                    logger.info(f"No se detectaron archivos en {company}")
                    continue
                
                # Agrupar por sesiones
                sessions = self.group_sessions(files)
                total_sessions += len(sessions)
                
                # Procesar cada sesión
                for session in sessions:
                    if self.process_session(session):
                        successful_sessions += 1
            
            logger.info(f"Procesamiento completado: {successful_sessions}/{total_sessions} sesiones exitosas")
            
        except Exception as e:
            logger.error(f"Error en procesamiento: {e}")
            raise

def main():
    """Función principal"""
    processor = PostgresProcessor()
    processor.run()

if __name__ == "__main__":
    main() 