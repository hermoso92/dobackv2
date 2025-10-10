#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para ejecutar el procesador Doback Soft corregido.
"""

import os
import sys
import logging
import psycopg2
import psycopg2.errorcodes
from datetime import datetime
from typing import List, Dict

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuración de base de datos
DB_CONFIG = {
    'host': 'localhost',
    'database': 'dobacksoft',
    'user': 'postgres',
    'password': 'cosigein',
    'port': 5432
}

class FixedProcessor:
    """Procesador corregido para Doback Soft."""
    
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback')
        self.db_config = DB_CONFIG
        
    def process_all_data(self):
        """Procesa todos los datos disponibles."""
        logger.info("🚀 Iniciando procesador Doback Soft corregido...")
        
        try:
            # Conectar a la base de datos
            conn = psycopg2.connect(**self.db_config)
            cur = conn.cursor()
            
            # Verificar conexión
            cur.execute('SELECT COUNT(*) FROM "Vehicle"')
            vehicle_count = cur.fetchone()[0]
            logger.info(f"✅ Conectado a base de datos. Vehículos: {vehicle_count}")
            
            # Procesar datos rotativos
            self.process_rotativo_data(conn)
            
            # Procesar otros tipos de datos si es necesario
            # self.process_gps_data(conn)
            # self.process_can_data(conn)
            # self.process_stability_data(conn)
            
            conn.close()
            logger.info("✅ Procesamiento completado exitosamente")
            
        except Exception as e:
            logger.error(f"❌ Error en el procesamiento: {e}")
            import traceback
            logger.error(traceback.format_exc())
    
    def process_rotativo_data(self, conn):
        """Procesa datos rotativos de todos los vehículos."""
        logger.info("🔄 Procesando datos rotativos...")
        
        # Buscar todos los archivos rotativos
        rotativo_files = []
        for root, dirs, files in os.walk(self.data_dir):
            for file in files:
                if file.startswith('ROTATIVO_') and file.endswith('.txt'):
                    file_path = os.path.join(root, file)
                    rotativo_files.append(file_path)
        
        logger.info(f"📁 Encontrados {len(rotativo_files)} archivos rotativos")
        
        # Procesar cada archivo
        for file_path in rotativo_files:
            try:
                self.process_single_rotativo_file(conn, file_path)
            except Exception as e:
                logger.error(f"❌ Error procesando {file_path}: {e}")
    
    def process_single_rotativo_file(self, conn, file_path: str):
        """Procesa un archivo rotativo individual."""
        try:
            # Extraer información del archivo
            filename = os.path.basename(file_path)
            vehicle = self.extract_vehicle_from_filename(filename)
            date = self.extract_date_from_filename(filename)
            
            if not vehicle or not date:
                logger.warning(f"⚠️  No se pudo extraer vehículo/fecha de {filename}")
                return
            
            logger.info(f"📄 Procesando: {filename}")
            
            # Cargar datos del archivo
            data = self.load_rotativo_data(file_path)
            if not data:
                logger.warning(f"⚠️  No se pudieron cargar datos de {filename}")
                return
            
            logger.info(f"  ✅ Cargados {len(data)} puntos rotativos válidos")
            
            # Obtener o crear sesión
            session_id = self.get_or_create_session(conn, vehicle, date, data[0]['timestamp'])
            if not session_id:
                logger.warning(f"⚠️  No se pudo obtener/crear sesión para {filename}")
                return
            
            # Subir datos rotativos
            self.upload_rotativo_data(conn, session_id, data)
            
        except Exception as e:
            logger.error(f"❌ Error procesando archivo {file_path}: {e}")
    
    def load_rotativo_data(self, file_path: str) -> List[Dict]:
        """Carga datos rotativos desde un archivo."""
        try:
            data = []
            with open(file_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
            
            # Buscar línea de cabecera ROTATIVO
            session_start = None
            for line in lines:
                if line.strip().startswith('ROTATIVO;'):
                    parts = line.strip().split(';')
                    if len(parts) >= 2:
                        date_str = parts[1].strip()
                        try:
                            session_start = datetime.strptime(date_str, '%Y-%m-%d')
                            break
                        except Exception:
                            continue
            
            # Buscar cabecera de columnas
            data_start = 0
            for i, line in enumerate(lines):
                if 'Fecha-Hora' in line and 'Estado' in line:
                    data_start = i + 1
                    break
            
            # Procesar datos
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
            
            return data
            
        except Exception as e:
            logger.error(f"Error cargando datos rotativos de {file_path}: {e}")
            return []
    
    def extract_vehicle_from_filename(self, filename: str) -> str:
        """Extrae el nombre del vehículo del nombre del archivo."""
        try:
            # Formato: ROTATIVO_DOBACK022_20250707_0.txt
            parts = filename.split('_')
            if len(parts) >= 2:
                return parts[1].lower()
            return None
        except Exception:
            return None
    
    def extract_date_from_filename(self, filename: str) -> str:
        """Extrae la fecha del nombre del archivo."""
        try:
            # Formato: ROTATIVO_DOBACK022_20250707_0.txt
            parts = filename.split('_')
            if len(parts) >= 3:
                date_str = parts[2]
                # Convertir YYYYMMDD a YYYY-MM-DD
                if len(date_str) == 8:
                    return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
            return None
        except Exception:
            return None
    
    def get_or_create_session(self, conn, vehicle: str, date: str, first_timestamp: datetime) -> str:
        """Obtiene o crea una sesión para el vehículo y fecha."""
        try:
            cur = conn.cursor()
            
            # Buscar vehicleId
            cur.execute('SELECT id FROM "Vehicle" WHERE name = %s', (vehicle,))
            row = cur.fetchone()
            if not row:
                logger.warning(f"⚠️  No se encontró vehicleId para {vehicle}")
                return None
            vehicle_id = row[0]
            
            # Buscar organizationId
            cur.execute('SELECT id FROM "Organization" WHERE name = %s', ('CMadrid',))
            row = cur.fetchone()
            if not row:
                logger.warning(f"⚠️  No se encontró organizationId para CMadrid")
                return None
            organization_id = row[0]
            
            # Buscar sesión existente
            session_id = f"session_{vehicle}_{date}_1"
            cur.execute('SELECT id FROM "Session" WHERE id = %s', (session_id,))
            if cur.fetchone():
                logger.info(f"  ✅ Sesión existente encontrada: {session_id}")
                return session_id
            
            # Crear nueva sesión
            end_time = first_timestamp.replace(hour=23, minute=59, second=59)
            cur.execute('''
                INSERT INTO "Session" (id, "sessionNumber", "startTime", "endTime", 
                                     "vehicleId", "organizationId", "userId", 
                                     "createdAt", "updatedAt", sequence, status, type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                session_id, 1, first_timestamp, end_time, vehicle_id, organization_id,
                '646fdb29-0493-41b4-9df7-41209cfab137', datetime.now(), datetime.now(),
                1, 'ACTIVE', 'ROUTINE'
            ))
            
            logger.info(f"  ✅ Sesión creada: {session_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo/creando sesión: {e}")
            return None
    
    def upload_rotativo_data(self, conn, session_id: str, data: List[Dict]) -> None:
        """Sube datos rotativos a la base de datos."""
        try:
            cur = conn.cursor()
            uploaded_count = 0
            
            for point in data:
                try:
                    cur.execute('''
                        INSERT INTO "RotativoMeasurement" (id, "sessionId", timestamp, state, "createdAt", "updatedAt")
                        VALUES (%s, %s, %s, %s, %s, %s)
                    ''', (
                        f"rot_{session_id}_{point['timestamp'].strftime('%Y%m%d_%H%M%S')}",
                        session_id, point['timestamp'], point['state'], datetime.now(), datetime.now()
                    ))
                    uploaded_count += 1
                except psycopg2.Error as e:
                    if e.pgcode == psycopg2.errorcodes.UNIQUE_VIOLATION:
                        logger.warning(f"    ⚠️  Punto duplicado ignorado: {session_id} {point['timestamp']}")
                        conn.rollback()
                        continue
                    else:
                        logger.error(f"    ❌ Error SQL en punto rotativo: {e}")
                        conn.rollback()
                        continue
            
            logger.info(f"  ✅ Subidos {uploaded_count} puntos rotativos")
            
        except Exception as e:
            logger.error(f"❌ Error subiendo datos rotativos: {e}")

def main():
    """Función principal."""
    processor = FixedProcessor()
    processor.process_all_data()

if __name__ == "__main__":
    main() 