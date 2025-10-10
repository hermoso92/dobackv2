#!/usr/bin/env python3
"""
Emparejador de Sesiones - Lee cabeceros internos y empareja por fecha/hora
Considera +2 horas para archivos GPS
"""

import os
import re
from datetime import datetime, timedelta
from pathlib import Path
import json
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'session_matcher_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SessionMatcher:
    def __init__(self):
        self.base_path = Path(__file__).parent.parent / 'data' / 'datosDoback' / 'CMadrid'
        self.sessions = {}
        
    def extract_header_datetime(self, file_path, file_type):
        """Extrae la fecha y hora del cabecero interno del archivo"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                # Leer las primeras líneas para encontrar el cabecero
                lines = []
                for i, line in enumerate(f):
                    if i >= 50:  # Limitar a las primeras 50 líneas
                        break
                    lines.append(line.strip())
                
                # Buscar patrones de fecha/hora en el cabecero
                datetime_patterns = [
                    # Patrón: 2025-07-14 10:30:15
                    r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})',
                    # Patrón: 14/07/2025 10:30:15
                    r'(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2})',
                    # Patrón: 20250714 10:30:15
                    r'(\d{8}\s+\d{2}:\d{2}:\d{2})',
                    # Patrón: 14-07-2025 10:30:15
                    r'(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2})',
                    # Patrón: 2025/07/14 10:30:15
                    r'(\d{4}/\d{2}/\d{2}\s+\d{2}:\d{2}:\d{2})',
                ]
                
                for pattern in datetime_patterns:
                    for line in lines:
                        match = re.search(pattern, line)
                        if match:
                            datetime_str = match.group(1)
                            try:
                                # Intentar parsear la fecha
                                if '-' in datetime_str and len(datetime_str.split()[0]) == 10:
                                    # Formato: 2025-07-14 10:30:15
                                    dt = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')
                                elif '/' in datetime_str and len(datetime_str.split()[0]) == 10:
                                    # Formato: 14/07/2025 10:30:15
                                    dt = datetime.strptime(datetime_str, '%d/%m/%Y %H:%M:%S')
                                elif len(datetime_str.split()[0]) == 8:
                                    # Formato: 20250714 10:30:15
                                    dt = datetime.strptime(datetime_str, '%Y%m%d %H:%M:%S')
                                elif '-' in datetime_str and len(datetime_str.split()[0]) == 10:
                                    # Formato: 14-07-2025 10:30:15
                                    dt = datetime.strptime(datetime_str, '%d-%m-%Y %H:%M:%S')
                                elif '/' in datetime_str and len(datetime_str.split()[0]) == 10:
                                    # Formato: 2025/07/14 10:30:15
                                    dt = datetime.strptime(datetime_str, '%Y/%m/%d %H:%M:%S')
                                else:
                                    continue
                                
                                # Sumar 2 horas si es GPS
                                if file_type.upper() == 'GPS':
                                    dt = dt + timedelta(hours=2)
                                    logger.info(f"GPS: {datetime_str} -> {dt.strftime('%Y-%m-%d %H:%M:%S')} (+2h)")
                                
                                return dt
                                
                            except ValueError as e:
                                logger.debug(f"No se pudo parsear fecha: {datetime_str} - {e}")
                                continue
                
                # Si no se encuentra en cabecero, buscar en el nombre del archivo
                return self.extract_datetime_from_filename(file_path.name, file_type)
                
        except Exception as e:
            logger.error(f"Error leyendo archivo {file_path}: {e}")
            return None
    
    def extract_datetime_from_filename(self, filename, file_type):
        """Extrae fecha y hora del nombre del archivo"""
        try:
            # Patrones comunes en nombres de archivo
            patterns = [
                # CAN_DOBACK022_20250714_3.txt
                r'_(\d{8})_(\d+)\.',
                # GPS_DOBACK022_20250714_1.txt
                r'_(\d{8})_(\d+)\.',
                # ESTABILIDAD_DOBACK022_20250714_0.txt
                r'_(\d{8})_(\d+)\.',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, filename)
                if match:
                    date_str = match.group(1)
                    session_num = match.group(2)
                    
                    # Convertir YYYYMMDD a datetime
                    dt = datetime.strptime(date_str, '%Y%m%d')
                    
                    # Sumar 2 horas si es GPS
                    if file_type.upper() == 'GPS':
                        dt = dt + timedelta(hours=2)
                        logger.info(f"GPS filename: {date_str} -> {dt.strftime('%Y-%m-%d %H:%M:%S')} (+2h)")
                    
                    return dt
                    
        except Exception as e:
            logger.error(f"Error extrayendo fecha del nombre {filename}: {e}")
        
        return None
    
    def find_all_files(self):
        """Encuentra todos los archivos de datos en CMadrid"""
        files_by_type = {
            'CAN': [],
            'GPS': [],
            'ESTABILIDAD': [],
            'ROTATIVO': []
        }
        
        if not self.base_path.exists():
            logger.error(f"No se encuentra el directorio base: {self.base_path}")
            return files_by_type
        
        # Buscar en todos los vehículos
        for vehicle_dir in self.base_path.iterdir():
            if not vehicle_dir.is_dir():
                continue
                
            vehicle_name = vehicle_dir.name
            logger.info(f"Procesando vehículo: {vehicle_name}")
            
            # Buscar archivos por tipo
            for file_type in files_by_type.keys():
                type_dir = vehicle_dir / file_type
                if type_dir.exists():
                    for file_path in type_dir.iterdir():
                        if file_path.is_file() and file_path.suffix.lower() in ['.txt', '.csv']:
                            files_by_type[file_type].append({
                                'vehicle': vehicle_name,
                                'file_path': file_path,
                                'file_type': file_type,
                                'datetime': None
                            })
        
        return files_by_type
    
    def extract_datetimes(self, files_by_type):
        """Extrae fechas y horas de todos los archivos"""
        logger.info("Extrayendo fechas y horas de archivos...")
        
        for file_type, files in files_by_type.items():
            logger.info(f"Procesando {len(files)} archivos {file_type}")
            
            for file_info in files:
                dt = self.extract_header_datetime(file_info['file_path'], file_type)
                file_info['datetime'] = dt
                
                if dt:
                    logger.info(f"✅ {file_type}: {file_info['file_path'].name} -> {dt.strftime('%Y-%m-%d %H:%M:%S')}")
                else:
                    logger.warning(f"⚠️ {file_type}: {file_info['file_path'].name} -> No se pudo extraer fecha")
    
    def match_sessions(self, files_by_type, tolerance_minutes=30):
        """Empareja sesiones por fecha y hora con tolerancia"""
        logger.info(f"Emparejando sesiones con tolerancia de {tolerance_minutes} minutos...")
        
        sessions = {}
        
        # Agrupar archivos por fecha (día)
        for file_type, files in files_by_type.items():
            for file_info in files:
                if not file_info['datetime']:
                    continue
                
                # Clave de sesión: fecha + tolerancia
                session_date = file_info['datetime'].date()
                session_key = f"{session_date}_{file_info['vehicle']}"
                
                if session_key not in sessions:
                    sessions[session_key] = {
                        'date': session_date,
                        'vehicle': file_info['vehicle'],
                        'files': {},
                        'start_time': file_info['datetime'],
                        'end_time': file_info['datetime']
                    }
                
                # Agregar archivo a la sesión
                if file_type not in sessions[session_key]['files']:
                    sessions[session_key]['files'][file_type] = []
                
                sessions[session_key]['files'][file_type].append(file_info)
                
                # Actualizar tiempos de sesión
                if file_info['datetime'] < sessions[session_key]['start_time']:
                    sessions[session_key]['start_time'] = file_info['datetime']
                if file_info['datetime'] > sessions[session_key]['end_time']:
                    sessions[session_key]['end_time'] = file_info['datetime']
        
        return sessions
    
    def generate_report(self, sessions):
        """Genera un reporte de las sesiones emparejadas"""
        logger.info("Generando reporte de sesiones...")
        
        report = {
            'total_sessions': len(sessions),
            'sessions': [],
            'summary': {}
        }
        
        for session_key, session_data in sessions.items():
            session_info = {
                'session_key': session_key,
                'date': session_data['date'].strftime('%Y-%m-%d'),
                'vehicle': session_data['vehicle'],
                'start_time': session_data['start_time'].strftime('%Y-%m-%d %H:%M:%S'),
                'end_time': session_data['end_time'].strftime('%Y-%m-%d %H:%M:%S'),
                'duration_minutes': int((session_data['end_time'] - session_data['start_time']).total_seconds() / 60),
                'files': {}
            }
            
            # Contar archivos por tipo
            for file_type, files in session_data['files'].items():
                session_info['files'][file_type] = {
                    'count': len(files),
                    'files': [f['file_path'].name for f in files]
                }
            
            report['sessions'].append(session_info)
        
        # Resumen por vehículo
        for session in report['sessions']:
            vehicle = session['vehicle']
            if vehicle not in report['summary']:
                report['summary'][vehicle] = {
                    'total_sessions': 0,
                    'total_files': 0,
                    'file_types': {}
                }
            
            report['summary'][vehicle]['total_sessions'] += 1
            for file_type, file_info in session['files'].items():
                if file_type not in report['summary'][vehicle]['file_types']:
                    report['summary'][vehicle]['file_types'][file_type] = 0
                report['summary'][vehicle]['file_types'][file_type] += file_info['count']
                report['summary'][vehicle]['total_files'] += file_info['count']
        
        return report
    
    def save_report(self, report, output_file='session_matching_report.json'):
        """Guarda el reporte en un archivo JSON"""
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            logger.info(f"Reporte guardado: {output_file}")
        except Exception as e:
            logger.error(f"Error guardando reporte: {e}")
    
    def print_summary(self, report):
        """Imprime un resumen del reporte"""
        print("\n" + "="*80)
        print("📊 RESUMEN DE EMPAREJAMIENTO DE SESIONES - CMADRID")
        print("="*80)
        
        print(f"📁 Total de sesiones encontradas: {report['total_sessions']}")
        print(f"🚗 Vehículos procesados: {len(report['summary'])}")
        
        for vehicle, summary in report['summary'].items():
            print(f"\n🚗 {vehicle}:")
            print(f"   📅 Sesiones: {summary['total_sessions']}")
            print(f"   📁 Archivos totales: {summary['total_files']}")
            for file_type, count in summary['file_types'].items():
                print(f"   📋 {file_type}: {count} archivos")
        
        print(f"\n📋 Detalles por sesión:")
        for session in report['sessions']:
            print(f"\n📅 {session['date']} - {session['vehicle']}")
            print(f"   ⏰ {session['start_time']} -> {session['end_time']} ({session['duration_minutes']} min)")
            for file_type, file_info in session['files'].items():
                print(f"   📁 {file_type}: {file_info['count']} archivos")
                for filename in file_info['files'][:3]:  # Mostrar solo los primeros 3
                    print(f"      - {filename}")
                if len(file_info['files']) > 3:
                    print(f"      ... y {len(file_info['files']) - 3} más")
        
        print("="*80)
    
    def run(self):
        """Ejecuta el proceso completo de emparejamiento"""
        logger.info("🚀 Iniciando emparejamiento de sesiones")
        
        # 1. Encontrar todos los archivos
        files_by_type = self.find_all_files()
        
        # 2. Extraer fechas y horas
        self.extract_datetimes(files_by_type)
        
        # 3. Emparejar sesiones
        sessions = self.match_sessions(files_by_type)
        
        # 4. Generar reporte
        report = self.generate_report(sessions)
        
        # 5. Guardar y mostrar resultados
        self.save_report(report)
        self.print_summary(report)
        
        return report

def main():
    print("🔧 Emparejador de Sesiones - CMadrid")
    print("=" * 50)
    
    matcher = SessionMatcher()
    report = matcher.run()
    
    print(f"\n✅ Proceso completado. Reporte guardado en: session_matching_report.json")

if __name__ == "__main__":
    main() 