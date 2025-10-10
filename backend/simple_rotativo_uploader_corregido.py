#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script corregido para subir datos rotativos usando las tablas correctas.
"""

import os
import sys
import json
import logging
import psycopg2
import psycopg2.errorcodes
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
    'password': 'cosigein',
    'port': 5432
}

class RotativoUploaderCorregido:
    """Uploader corregido para datos rotativos usando las tablas correctas."""
    
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback')
        self.user_id = "646fdb29-0493-41b4-9df7-41209cfab137"  # ID de usuario fijo
    
    def _split_flexible(self, line: str):
        """Divide una línea por coma o punto y coma."""
        if ';' in line:
            return [x.strip() for x in line.split(';')]
        else:
            return [x.strip() for x in line.split(',')]
    
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
                            logger.info(f"  📅 Fecha de sesión: {session_start}")
                            break
                        except ValueError:
                            continue
            
            if not session_start:
                logger.warning(f"  ⚠️  No se pudo extraer fecha de sesión de {file_path}")
                return []
            
            # Buscar cabecera de columnas
            data_start = None
            for i, line in enumerate(lines):
                if 'fecha' in line.lower() and 'estado' in line.lower():
                    data_start = i + 1
                    break
            
            if data_start is None:
                data_start = 1
            
            # Procesar datos
            for line in lines[data_start:]:
                if not line.strip():
                    continue
                
                parts = self._split_flexible(line)
                if len(parts) >= 2:
                    try:
                        # Formato: 2025-07-07 14:23:49;1
                        date_time_str = parts[0].strip()
                        status = parts[1].strip()
                        
                        # Parsear timestamp completo
                        if ' ' in date_time_str and ':' in date_time_str:
                            # Formato: 2025-07-07 14:23:49
                            dt = datetime.strptime(date_time_str, '%Y-%m-%d %H:%M:%S')
                            
                            # Extraer valor (asumir que es el tercer campo si existe)
                            value = 0
                            if len(parts) >= 3:
                                try:
                                    value = float(parts[2].strip())
                                except (ValueError, IndexError):
                                    value = 0
                            
                            data.append({
                                'timestamp': dt,
                                'value': value,
                                'status': status
                            })
                    except Exception as e:
                        logger.debug(f"    ⚠️  Error procesando línea: {line.strip()} - {e}")
                        continue
            
            logger.info(f"  ✅ Cargados {len(data)} puntos rotativos válidos")
            return data
            
        except Exception as e:
            logger.error(f"❌ Error cargando datos rotativos desde {file_path}: {e}")
            return []
    
    def get_or_create_session(self, vehicle: str, date: str, first_timestamp: datetime) -> str:
        """Obtiene o crea una sesión para un archivo rotativo."""
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
            
            # Buscar organizationId del vehículo
            cur.execute('SELECT "organizationId" FROM "Vehicle" WHERE id = %s', (vehicle_id,))
            row = cur.fetchone()
            if not row:
                logger.warning(f"⚠️  No se encontró organizationId para {vehicle}")
                cur.close()
                conn.close()
                return None
            organization_id = row[0]
            
            # Buscar sesión existente que incluya el timestamp
            cur.execute('''
                SELECT id FROM "Session" 
                WHERE "vehicleId" = %s 
                AND "startTime" <= %s 
                AND "endTime" >= %s
                LIMIT 1
            ''', (vehicle_id, first_timestamp, first_timestamp))
            
            row = cur.fetchone()
            if row:
                session_id = row[0]
                logger.info(f"  ✅ Sesión existente encontrada: {session_id}")
                cur.close()
                conn.close()
                return session_id
            
            # Si no existe, crear nueva sesión
            session_number = 1
            cur.execute('''
                SELECT MAX("sessionNumber") FROM "Session" 
                WHERE "vehicleId" = %s AND DATE("startTime") = %s
            ''', (vehicle_id, date))
            
            row = cur.fetchone()
            if row and row[0]:
                session_number = row[0] + 1
            
            # Crear sesión
            session_id = f"session_{vehicle}_{date}_{session_number}"
            end_time = first_timestamp.replace(hour=23, minute=59, second=59)
            sequence = 1  # Valor fijo si no hay otro criterio
            status = 'ACTIVE'
            type_ = 'ROUTINE'

            cur.execute('''
                INSERT INTO "Session" (id, "sessionNumber", "startTime", "endTime", 
                                     "vehicleId", "organizationId", "userId", 
                                     "createdAt", "updatedAt", sequence, status, type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (session_id, session_number, first_timestamp, end_time,
                  vehicle_id, organization_id, self.user_id,
                  datetime.now(), datetime.now(), sequence, status, type_))
            
            conn.commit()
            logger.info(f"  ✅ Nueva sesión creada: {session_id}")
            
            cur.close()
            conn.close()
            return session_id
            
        except Exception as e:
            import traceback
            logger.error(f"❌ Error obteniendo/creando sesión: {e}\n{traceback.format_exc()}")
            return None
    
    def upload_rotativo_data(self, session_id: str, data: List[Dict]) -> bool:
        """Sube datos rotativos a la base de datos."""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()
            uploaded_count = 0
            for point in data:
                try:
                    cur.execute('''
                        INSERT INTO "RotativoMeasurement" (id, timestamp, "sessionId", state, "createdAt", "updatedAt")
                        VALUES (%s, %s, %s, %s, %s, %s)
                    ''', (
                        f"rot_{session_id}_{point['timestamp'].strftime('%Y%m%d_%H%M%S')}",
                        point['timestamp'],
                        session_id,
                        point['status'],
                        datetime.now(),
                        datetime.now()
                    ))
                    uploaded_count += 1
                except psycopg2.IntegrityError as e:
                    conn.rollback()
                    if hasattr(e, 'pgcode') and e.pgcode == psycopg2.errorcodes.UNIQUE_VIOLATION:
                        logger.warning(f"    ⚠️  Punto duplicado ignorado: rot_{session_id}_{point['timestamp'].strftime('%Y%m%d_%H%M%S')}")
                    else:
                        logger.error(f"    ❌ Error de integridad subiendo punto: {e}")
                except Exception as e:
                    conn.rollback()
                    import traceback
                    logger.error(f"    ❌ Error subiendo punto: {e}\n{traceback.format_exc()}")
            conn.commit()
            logger.info(f"  ✅ Subidos {uploaded_count} puntos rotativos")
            cur.close()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"❌ Error subiendo datos rotativos: {e}")
            return False
    
    def process_all_rotativo_files(self):
        """Procesa todos los archivos rotativos."""
        logger.info("🚀 Iniciando procesamiento de archivos rotativos...")
        
        total_files = 0
        total_points = 0
        successful_uploads = 0
        
        # Recorrer directorios de datos
        for company_dir in os.listdir(self.data_dir):
            company_path = os.path.join(self.data_dir, company_dir)
            if not os.path.isdir(company_path):
                continue
            
            logger.info(f"📁 Procesando empresa: {company_dir}")
            
            for vehicle_dir in os.listdir(company_path):
                vehicle_path = os.path.join(company_path, vehicle_dir)
                if not os.path.isdir(vehicle_path):
                    continue
                
                logger.info(f"  🚗 Procesando vehículo: {vehicle_dir}")
                
                rotativo_dir = os.path.join(vehicle_path, 'ROTATIVO')
                if not os.path.exists(rotativo_dir):
                    logger.info(f"    ⚠️  No hay directorio ROTATIVO para {vehicle_dir}")
                    continue
                
                # Procesar archivos rotativos
                for filename in os.listdir(rotativo_dir):
                    if filename.startswith('ROTATIVO_') and filename.endswith('.txt'):
                        file_path = os.path.join(rotativo_dir, filename)
                        total_files += 1
                        
                        logger.info(f"    📄 Procesando: {filename}")
                        
                        # Cargar datos
                        data = self.load_rotativo_data(file_path)
                        if not data:
                            continue
                        
                        total_points += len(data)
                        
                        # Extraer fecha del nombre del archivo
                        # Formato: ROTATIVO_DOBACK022_20250707_0.txt
                        parts = filename.split('_')
                        if len(parts) >= 3:
                            date_str = parts[2]  # 20250707
                            try:
                                date = datetime.strptime(date_str, '%Y%m%d').strftime('%Y-%m-%d')
                            except ValueError:
                                logger.warning(f"      ⚠️  No se pudo parsear fecha de {filename}")
                                continue
                        else:
                            logger.warning(f"      ⚠️  Formato de nombre incorrecto: {filename}")
                            continue
                        
                        # Obtener o crear sesión
                        first_timestamp = data[0]['timestamp']
                        session_id = self.get_or_create_session(vehicle_dir, date, first_timestamp)
                        
                        if session_id:
                            # Subir datos
                            if self.upload_rotativo_data(session_id, data):
                                successful_uploads += 1
                        else:
                            logger.warning(f"      ❌ No se pudo obtener/crear sesión para {filename}")
        
        logger.info("=" * 60)
        logger.info("📊 RESUMEN DEL PROCESAMIENTO")
        logger.info("=" * 60)
        logger.info(f"📁 Archivos procesados: {total_files}")
        logger.info(f"📊 Puntos rotativos cargados: {total_points}")
        logger.info(f"✅ Subidas exitosas: {successful_uploads}")
        logger.info(f"❌ Subidas fallidas: {total_files - successful_uploads}")

def main():
    """Función principal."""
    uploader = RotativoUploaderCorregido()
    uploader.process_all_rotativo_files()

if __name__ == "__main__":
    main() 