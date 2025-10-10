#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script simple para subir datos rotativos a la base de datos.
"""

import os
import sys
import json
import logging
import psycopg2
from datetime import datetime
from typing import List, Dict
from psycopg2.extras import RealDictCursor

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
    'password': 'postgres',
    'port': 5432
}

class SimpleRotativoUploader:
    """Uploader simple para datos rotativos."""
    
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback')
        
    def _split_flexible(self, line: str):
        """Divide una línea por coma o punto y coma."""
        if ';' in line:
            return [x.strip() for x in line.split(';')]
        else:
            return [x.strip() for x in line.split(',')]
    
    def find_rotativo_files(self) -> List[Dict]:
        """Encuentra todos los archivos rotativos."""
        rotativo_files = []
        
        for root, dirs, files in os.walk(self.data_dir):
            for file in files:
                if file.startswith('ROTATIVO_') and file.endswith('.txt'):
                    file_path = os.path.join(root, file)
                    
                    # Extraer información del archivo
                    vehicle = os.path.basename(root)
                    date_str = file.split('_')[2] if len(file.split('_')) > 2 else 'unknown'
                    
                    rotativo_files.append({
                        'path': file_path,
                        'filename': file,
                        'vehicle': vehicle,
                        'date': date_str
                    })
        
        logger.info(f"📁 Encontrados {len(rotativo_files)} archivos rotativos")
        return rotativo_files
    
    def load_rotativo_data(self, file_path: str) -> List[Dict]:
        """Carga datos rotativos desde un archivo."""
        try:
            data = []
            logger.info(f"📖 Cargando datos rotativos desde {file_path}")
            
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
                        except ValueError:
                            continue
            
            # Buscar cabecera de columnas
            data_start = 1
            for i, line in enumerate(lines):
                if 'fecha' in line.lower() and 'estado' in line.lower():
                    data_start = i + 1
                    break
            
            # Procesar datos
            for line in lines[data_start:]:
                if not line.strip():
                    continue
                    
                parts = self._split_flexible(line)
                if len(parts) >= 2:
                    try:
                        # Formato: Fecha-Hora; Estado
                        date_str = parts[0].strip()
                        status_str = parts[1].strip()
                        
                        if date_str and date_str != 'Fecha-Hora':
                            # Parsear fecha y hora
                            dt = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                            
                            # Para datos rotativos, el valor es siempre 1 (activo) o 0 (inactivo)
                            value = 1 if status_str == '1' else 0
                            
                            data.append({
                                'timestamp': dt,
                                'value': value,
                                'status': status_str
                            })
                    except Exception as e:
                        logger.debug(f"Error parseando línea: {line.strip()} - {e}")
                        continue
            
            logger.info(f"  ✅ Cargados {len(data)} puntos rotativos")
            return data
            
        except Exception as e:
            logger.error(f"❌ Error cargando datos rotativos {file_path}: {e}")
            return []
    
    def get_session_id(self, vehicle: str, date: str, filename: str, first_timestamp: datetime = None) -> str:
        """Obtiene el ID de sesión para un archivo rotativo, buscando por rango temporal."""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()

            # Buscar vehicleId
            cur.execute('SELECT id FROM "Vehicle" WHERE name = %s', (vehicle,))
            row = cur.fetchone()
            if not row:
                logger.warning(f"⚠️  No se encontró vehicleId para {vehicle}")
                cur.close()
                conn.close()
                return None
            vehicle_id = row[0]

            # Buscar sesiones del vehículo en ese día
            cur.execute('''
                SELECT id, "startTime", "endTime" FROM "Session"
                WHERE "vehicleId" = %s AND DATE("startTime") = %s
            ''', (vehicle_id, date))
            sessions = cur.fetchall()

            if not sessions:
                logger.warning(f"⚠️  No se encontró sesión para {vehicle} en {date}")
                cur.close()
                conn.close()
                return None

            # Si hay timestamp, buscar la sesión cuyo rango lo incluya
            if first_timestamp:
                for sess in sessions:
                    sess_id, start, end = sess
                    if start and end and start <= first_timestamp <= end:
                        cur.close()
                        conn.close()
                        return sess_id
                # Si no hay coincidencia exacta, buscar la más cercana
                min_diff = None
                best_id = None
                for sess in sessions:
                    sess_id, start, end = sess
                    if start and end:
                        diff = abs((start - first_timestamp).total_seconds())
                        if min_diff is None or diff < min_diff:
                            min_diff = diff
                            best_id = sess_id
                if best_id:
                    cur.close()
                    conn.close()
                    return best_id
            # Si no hay timestamp, devolver la primera sesión encontrada
            cur.close()
            conn.close()
            return sessions[0][0]
        except Exception as e:
            logger.error(f"❌ Error obteniendo session_id: {e}")
            return None
    
    def upload_rotativo_data(self, session_id: str, data: List[Dict]) -> bool:
        """Sube datos rotativos a la base de datos."""
        if not data:
            return True
            
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()
            
            # Insertar datos rotativos
            for point in data:
                cur.execute('''
                    INSERT INTO "RotativoData" (
                        "sessionId", "timestamp", "value", "status", 
                        "createdAt", "updatedAt"
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                ''', (
                    session_id,
                    point['timestamp'],
                    point['value'],
                    point['status'],
                    datetime.now(),
                    datetime.now()
                ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.info(f"  ✅ Subidos {len(data)} puntos rotativos a sesión {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error subiendo datos rotativos: {e}")
            return False
    
    def process_all_rotativo_files(self):
        """Procesa todos los archivos rotativos."""
        logger.info("🚀 Iniciando procesamiento de archivos rotativos...")
        rotativo_files = self.find_rotativo_files()
        if not rotativo_files:
            logger.warning("⚠️  No se encontraron archivos rotativos")
            return
        total_files = len(rotativo_files)
        successful_files = 0
        total_points = 0
        for i, file_info in enumerate(rotativo_files, 1):
            logger.info(f"📊 Procesando archivo {i}/{total_files}: {file_info['filename']}")
            data = self.load_rotativo_data(file_info['path'])
            if not data:
                logger.warning(f"  ⚠️  No se pudieron cargar datos de {file_info['filename']}")
                continue
            # Usar el primer timestamp para buscar la sesión
            first_timestamp = data[0]['timestamp'] if data else None
            session_id = self.get_session_id(
                file_info['vehicle'], 
                file_info['date'], 
                file_info['filename'],
                first_timestamp
            )
            if not session_id:
                logger.warning(f"  ⚠️  No se encontró sesión para {file_info['filename']}")
                continue
            if self.upload_rotativo_data(session_id, data):
                successful_files += 1
                total_points += len(data)
        logger.info(f"🎉 Procesamiento completado:")
        logger.info(f"  📁 Archivos procesados: {successful_files}/{total_files}")
        logger.info(f"  📊 Puntos rotativos subidos: {total_points}")

def main():
    """Función principal."""
    uploader = SimpleRotativoUploader()
    uploader.process_all_rotativo_files()

if __name__ == "__main__":
    main() 