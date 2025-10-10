#!/usr/bin/env python3
"""
Buscador Correcto de Sesiones - Doback Soft
Encuentra exactamente una sesión por archivo CAN
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional, Tuple
import re
from collections import defaultdict

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FileContentAnalyzer:
    """Analiza el contenido completo de archivos para extraer fechas/horas reales de los DATOS"""
    
    def __init__(self):
        self.date_patterns = [
            r'(\d{4}-\d{2}-\d{2})',  # YYYY-MM-DD
            r'(\d{2}/\d{2}/\d{4})',  # DD/MM/YYYY
            r'(\d{2}-\d{2}-\d{4})',  # DD-MM-YYYY
        ]
        self.time_patterns = [
            r'(\d{2}:\d{2}:\d{2})',  # HH:MM:SS
            r'(\d{2}:\d{2}:\d{2}\.\d{3})',  # HH:MM:SS.mmm
        ]
    
    def extract_real_datetime_from_file(self, file_path: Path, file_type: str, reference_date: Optional[date] = None) -> Optional[datetime]:
        """Extrae la fecha-hora real del contenido del archivo según el tipo"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = [l.strip() for l in f.readlines() if l.strip()]
            if not lines:
                return None
            if file_type == 'ROTATIVO':
                # Buscar la primera línea de datos real (después de cabecera)
                for i, line in enumerate(lines):
                    if line.lower().startswith('fecha-hora') or line.lower().startswith('rotativo'):
                        continue
                    # Formato: YYYY-MM-DD HH:MM:SS;estado
                    parts = line.split(';')
                    if len(parts) >= 1:
                        dt = self._parse_datetime_str(parts[0].strip())
                        if dt:
                            logger.debug(f"Fecha ROTATIVO encontrada en línea {i+1} de {file_path.name}: {dt}")
                            return dt
            elif file_type == 'GPS':
                # Buscar la primera línea de datos real (después de cabecera)
                for line in lines:
                    if line.lower().startswith('fecha') or line.lower().startswith('gps'):
                        continue
                    # Formato: DD/MM/YYYY,HH:MM:SS,...
                    parts = line.split(',')
                    if len(parts) >= 2:
                        fecha = parts[0].strip()
                        hora = parts[1].strip()
                        dt = self._parse_datetime_str(f"{fecha} {hora}")
                        if dt:
                            return dt
            elif file_type == 'ESTABILIDAD':
                # Usar la fecha/hora de la cabecera (línea 1, columna 2)
                cabecera = lines[0].split(';')
                if len(cabecera) >= 2:
                    dt = self._parse_datetime_str(cabecera[1].strip())
                    if dt:
                        return dt
            elif file_type == 'CAN':
                # Buscar la primera línea de datos real (después de cabecera)
                for line in lines:
                    if line.lower().startswith('timestamp') or line.lower().startswith('can') or line.startswith('#'):
                        continue
                    # Formato: DD/MM/YYYY HH:MM:SSAM,...
                    parts = line.split(',')
                    if len(parts) >= 1:
                        dt = self._parse_datetime_str(parts[0].strip())
                        if dt:
                            return dt
            # Si no se encuentra, intentar extraer del nombre del archivo
            return self._extract_datetime_from_filename(file_path.name)
        except Exception as e:
            logger.error(f"Error leyendo {file_path}: {e}")
            return None
    
    def _find_data_start_line(self, lines: list, file_type: str) -> int:
        """Detecta el índice de la primera línea de datos según el tipo de archivo"""
        for idx, line in enumerate(lines):
            l = line.strip().lower()
            if file_type == 'CAN' and ('fecha' in l and 'canid' in l):
                return idx + 1
            if file_type in ['GPS', 'ESTABILIDAD'] and ('fecha' in l and 'hora' in l):
                return idx + 1
            if file_type == 'ROTATIVO' and ('fecha-hora' in l):
                return idx + 1
        # Si no se detecta cabecera, asumir datos desde la segunda línea
        return 1
    
    def _extract_datetime_from_data_line(self, line: str, file_type: str, reference_date: Optional[date] = None) -> Optional[datetime]:
        """Extrae fecha-hora real de una línea de datos según el tipo de archivo"""
        try:
            if file_type == 'CAN':
                # Para archivos CSV decodificados: Timestamp,length,response,service,...
                if ',' in line:
                    parts = line.split(',')
                    if len(parts) >= 1:
                        fecha_hora = parts[0].strip()
                        return self._parse_datetime_str(fecha_hora)
                # Para archivos TXT originales: 2025-07-08 09:12:37;0x18FF50E5;...
                elif ';' in line:
                    parts = line.split(';')
                    if len(parts) < 2:
                        return None
                    fecha_hora = parts[0].strip()
                    return self._parse_datetime_str(fecha_hora)
            elif file_type == 'GPS':
                # Formato GPS: 08/07/2025,07:41:06,sin datos GPS
                if ',' in line and '/' in line:
                    parts = line.split(',')
                    if len(parts) >= 2:
                        fecha = parts[0].strip()
                        hora = parts[1].strip()
                        fecha_hora = f"{fecha} {hora}"
                        return self._parse_datetime_str(fecha_hora)
            elif file_type == 'ESTABILIDAD':
                # Formato ESTABILIDAD: 08/07/2025 07:40:34AM
                if '/' in line and ('AM' in line or 'PM' in line):
                    # Buscar patrón de fecha y hora con AM/PM
                    match = re.search(r'(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}[AP]M)', line)
                    if match:
                        fecha_hora = match.group(1)
                        return self._parse_datetime_str(fecha_hora)
            elif file_type == 'ROTATIVO':
                # Formato ROTATIVO: 07:41:09AM (solo hora)
                if 'AM' in line or 'PM' in line:
                    match = re.search(r'(\d{2}:\d{2}:\d{2}[AP]M)', line)
                    if match:
                        hora = match.group(1)
                        # Para ROTATIVO, usar la fecha de referencia si está disponible
                        if reference_date:
                            fecha_hora = f"{reference_date.strftime('%Y-%m-%d')} {hora}"
                        else:
                            # Usar fecha actual como fallback
                            fecha_actual = datetime.now().date()
                            fecha_hora = f"{fecha_actual} {hora}"
                        return self._parse_datetime_str(fecha_hora)
            else:
                return None
        except Exception as e:
            logger.debug(f"Error parseando datos de línea: {e}")
            return None
    
    def _parse_datetime_str(self, fecha_hora: str) -> Optional[datetime]:
        """Parsea un string de fecha-hora a datetime"""
        formats = [
            "%Y-%m-%d %H:%M:%S",           # 2025-07-08 07:41:06 (ROTATIVO)
            "%Y-%m-%d %H:%M:%S.%f",        # 2025-07-08 09:12:37.123
            "%d/%m/%Y %H:%M:%S",           # 08/07/2025 07:41:06
            "%d-%m-%Y %H:%M:%S",           # 08-07-2025 07:41:06
            "%d/%m/%Y %I:%M:%S%p",         # 08/07/2025 07:40:34AM
            "%I:%M:%S%p",                  # 07:41:09AM (solo hora)
        ]
        
        for fmt in formats:
            try:
                if fmt == "%I:%M:%S%p":
                    # Para solo hora, usar fecha actual
                    fecha_actual = datetime.now().date()
                    hora = datetime.strptime(fecha_hora, fmt).time()
                    return datetime.combine(fecha_actual, hora)
                else:
                    return datetime.strptime(fecha_hora, fmt)
            except Exception:
                continue
        return None
    
    def _extract_datetime_from_filename(self, filename: str) -> Optional[datetime]:
        """Extrae fecha del nombre del archivo como último recurso"""
        try:
            match = re.search(r'(\d{8})', filename)
            if match:
                date_str = match.group(1)
                return datetime.strptime(date_str, "%Y%m%d")
        except:
            pass
        return None

class CorrectSessionFinder:
    """Encuentra exactamente una sesión por archivo CAN"""
    
    def __init__(self):
        self.analyzer = FileContentAnalyzer()
    
    def find_correct_sessions(self, base_path: Path) -> List[Dict[str, Any]]:
        """Encuentra exactamente una sesión por archivo CAN"""
        all_sessions = []
        
        # Escanear todos los archivos y extraer fechas reales
        all_files = self._scan_all_files(base_path)
        logger.info(f"Escaneados {len(all_files)} archivos totales")
        
        # Agrupar por vehículo
        files_by_vehicle = defaultdict(lambda: defaultdict(list))
        for file_info in all_files:
            vehicle = file_info['vehicle']
            file_type = file_info['type']
            files_by_vehicle[vehicle][file_type].append(file_info)
        
        # Para cada vehículo, encontrar una sesión por archivo CAN
        for vehicle, type_files in files_by_vehicle.items():
            logger.info(f"Analizando vehículo: {vehicle}")
            vehicle_sessions = self._find_sessions_for_vehicle(vehicle, type_files)
            all_sessions.extend(vehicle_sessions)
        
        # Ordenar por proximidad temporal (menor diferencia primero)
        all_sessions.sort(key=lambda x: x['max_time_diff'])
        
        return all_sessions
    
    def _scan_all_files(self, base_path: Path) -> List[Dict[str, Any]]:
        """Escanea todos los archivos y extrae sus fechas reales"""
        all_files = []
        
        for company_dir in base_path.iterdir():
            if not company_dir.is_dir():
                continue
            
            for vehicle_dir in company_dir.iterdir():
                if not vehicle_dir.is_dir():
                    continue
                
                vehicle_name = vehicle_dir.name
                
                # Buscar carpetas de tipos de archivo
                for type_dir in vehicle_dir.iterdir():
                    if not type_dir.is_dir():
                        continue
                    
                    file_type = type_dir.name.upper()
                    if file_type not in ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']:
                        continue
                    
                    # Procesar archivos de este tipo
                    if file_type == 'CAN':
                        # Para archivos CAN, buscar archivos CSV decodificados
                        for file_path in type_dir.glob('*_TRADUCIDO.csv'):
                            if file_path.name.startswith('._') or 'realtime' in file_path.name.lower():
                                continue
                            
                            # Extraer fecha real del contenido CSV decodificado
                            real_datetime = self.analyzer.extract_real_datetime_from_file(file_path, file_type)
                            
                            if real_datetime:
                                file_info = {
                                    'path': file_path,
                                    'vehicle': vehicle_name,
                                    'type': file_type,
                                    'real_datetime': real_datetime,
                                    'date': real_datetime.date(),
                                    'time': real_datetime.time(),
                                    'filename': file_path.name
                                }
                                all_files.append(file_info)
                                logger.debug(f"Archivo procesado: {file_path.name} -> {real_datetime}")
                            else:
                                logger.warning(f"No se pudo extraer fecha de: {file_path.name}")
                    elif file_type == 'ROTATIVO':
                        for file_path in type_dir.glob('*.txt'):
                            if file_path.name.startswith('._') or 'realtime' in file_path.name.lower():
                                continue
                            # Extraer fecha real del contenido usando el extractor robusto
                            real_datetime = self.analyzer.extract_real_datetime_from_file(file_path, file_type)
                            if real_datetime:
                                file_info = {
                                    'path': file_path,
                                    'vehicle': vehicle_name,
                                    'type': file_type,
                                    'real_datetime': real_datetime,
                                    'date': real_datetime.date(),
                                    'time': real_datetime.time(),
                                    'filename': file_path.name
                                }
                                all_files.append(file_info)
                                logger.debug(f"Archivo ROTATIVO procesado: {file_path.name} -> {real_datetime}")
                            else:
                                logger.warning(f"No se pudo extraer fecha de: {file_path.name}")
                    else:
                        # Para otros tipos, usar archivos TXT originales
                        for file_path in type_dir.glob('*.txt'):
                            if file_path.name.startswith('._') or 'realtime' in file_path.name.lower():
                                continue
                            
                            # Extraer fecha real del contenido
                            real_datetime = self.analyzer.extract_real_datetime_from_file(file_path, file_type)
                            
                            if real_datetime:
                                file_info = {
                                    'path': file_path,
                                    'vehicle': vehicle_name,
                                    'type': file_type,
                                    'real_datetime': real_datetime,
                                    'date': real_datetime.date(),
                                    'time': real_datetime.time(),
                                    'filename': file_path.name
                                }
                                all_files.append(file_info)
                                logger.debug(f"Archivo procesado: {file_path.name} -> {real_datetime}")
                            else:
                                logger.warning(f"No se pudo extraer fecha de: {file_path.name}")
        
        return all_files
    
    def _find_sessions_for_vehicle(self, vehicle: str, type_files: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Encuentra exactamente una sesión por archivo CAN"""
        sessions = []
        
        # Verificar que tenemos todos los tipos necesarios
        required_types = ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']
        missing_types = [t for t in required_types if t not in type_files]
        if missing_types:
            logger.info(f"  Faltan tipos para {vehicle}: {missing_types}")
            return sessions
        
        logger.info(f"  Tipos disponibles: {list(type_files.keys())}")
        logger.info(f"  CAN: {len(type_files['CAN'])} archivos")
        logger.info(f"  GPS: {len(type_files['GPS'])} archivos")
        logger.info(f"  ESTABILIDAD: {len(type_files['ESTABILIDAD'])} archivos")
        logger.info(f"  ROTATIVO: {len(type_files['ROTATIVO'])} archivos")
        
        # Para cada archivo CAN, encontrar la mejor sesión
        for can_file in type_files['CAN']:
            logger.info(f"    🔍 Buscando sesión para CAN: {can_file['filename']} ({can_file['real_datetime']})")
            
            # Encontrar los archivos más cercanos temporalmente
            best_gps = self._find_closest_file(can_file['real_datetime'], type_files['GPS'])
            best_estabilidad = self._find_closest_file(can_file['real_datetime'], type_files['ESTABILIDAD'])
            best_rotativo = self._find_closest_file(can_file['real_datetime'], type_files['ROTATIVO'])
            
            if best_gps and best_estabilidad and best_rotativo:
                # Calcular diferencias temporales
                time_diffs = self._calculate_time_differences(
                    can_file['real_datetime'],
                    best_gps['real_datetime'],
                    best_estabilidad['real_datetime'],
                    best_rotativo['real_datetime']
                )
                
                session = {
                    'vehicle': vehicle,
                    'date': can_file['date'],
                    'start_time': can_file['real_datetime'],
                    'end_time': max(
                        can_file['real_datetime'],
                        best_gps['real_datetime'],
                        best_estabilidad['real_datetime'],
                        best_rotativo['real_datetime']
                    ),
                    'files': {
                        'CAN': can_file,
                        'GPS': best_gps,
                        'ESTABILIDAD': best_estabilidad,
                        'ROTATIVO': best_rotativo
                    },
                    'max_time_diff': time_diffs['max_diff'],
                    'time_diffs': time_diffs
                }
                
                sessions.append(session)
                logger.info(f"    ✅ Sesión encontrada para {vehicle}:")
                logger.info(f"      CAN: {can_file['filename']} ({can_file['real_datetime']})")
                logger.info(f"      GPS: {best_gps['filename']} ({best_gps['real_datetime']}) - {time_diffs['gps_diff']:.1f} min")
                logger.info(f"      ESTABILIDAD: {best_estabilidad['filename']} ({best_estabilidad['real_datetime']}) - {time_diffs['estabilidad_diff']:.1f} min")
                logger.info(f"      ROTATIVO: {best_rotativo['filename']} ({best_rotativo['real_datetime']}) - {time_diffs['rotativo_diff']:.1f} min")
                logger.info(f"      Máxima diferencia: {time_diffs['max_diff']:.1f} min")
                logger.info(f"      Diferencias: GPS={time_diffs['gps_diff']:.1f}min, ESTABILIDAD={time_diffs['estabilidad_diff']:.1f}min, ROTATIVO={time_diffs['rotativo_diff']:.1f}min")
            else:
                logger.warning(f"    ❌ No se pudo formar sesión para CAN: {can_file['filename']}")
        
        return sessions
    
    def _find_closest_file(self, target_time: datetime, file_list: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Encuentra el archivo con fecha/hora más cercana al tiempo objetivo"""
        if not file_list:
            return None
        
        closest_file = None
        min_diff = float('inf')
        
        for file_info in file_list:
            diff = abs((file_info['real_datetime'] - target_time).total_seconds() / 60)
            if diff < min_diff:
                min_diff = diff
                closest_file = file_info
        
        return closest_file
    
    def _calculate_time_differences(self, can_time: datetime, gps_time: datetime, estabilidad_time: datetime, rotativo_time: datetime) -> Dict[str, float]:
        """Calcula las diferencias temporales entre todos los archivos"""
        # Calcular diferencias en minutos (sin filtrar por fecha)
        gps_diff = abs((gps_time - can_time).total_seconds() / 60)
        estabilidad_diff = abs((estabilidad_time - can_time).total_seconds() / 60)
        rotativo_diff = abs((rotativo_time - can_time).total_seconds() / 60)
        
        max_diff = max(gps_diff, estabilidad_diff, rotativo_diff)
        
        return {
            'gps_diff': gps_diff,
            'estabilidad_diff': estabilidad_diff,
            'rotativo_diff': rotativo_diff,
            'max_diff': max_diff
        }

class CorrectProcessor:
    """Procesador correcto que encuentra una sesión por archivo CAN"""
    
    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.session_finder = CorrectSessionFinder()
    
    def run_correct_analysis(self) -> Dict[str, Any]:
        """Ejecuta el análisis correcto de sesiones"""
        logger.info("🚀 Iniciando análisis correcto de sesiones (una por archivo CAN)...")
        
        # 1. Encontrar una sesión por archivo CAN
        logger.info("📋 Buscando una sesión por archivo CAN...")
        all_sessions = self.session_finder.find_correct_sessions(self.base_path)
        
        logger.info(f"✅ Encontradas {len(all_sessions)} sesiones (una por archivo CAN)")
        
        # 2. Generar reporte detallado
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_sessions_found': len(all_sessions),
            'sessions': []
        }
        
        for i, session in enumerate(all_sessions, 1):
            session_info = {
                'session_number': i,
                'vehicle': session['vehicle'],
                'date': session['date'].isoformat(),
                'start_time': session['start_time'].isoformat(),
                'end_time': session['end_time'].isoformat(),
                'max_time_diff': session['max_time_diff'],
                'time_diffs': session['time_diffs'],
                'files': {
                    'CAN': session['files']['CAN']['filename'],
                    'GPS': session['files']['GPS']['filename'],
                    'ESTABILIDAD': session['files']['ESTABILIDAD']['filename'],
                    'ROTATIVO': session['files']['ROTATIVO']['filename']
                }
            }
            report['sessions'].append(session_info)
        
        # 3. Guardar reporte
        report_path = Path('correct_sessions_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"📊 Reporte guardado en: {report_path}")
        
        return report

def main():
    """Función principal"""
    # Ruta base de datos
    base_path = Path(__file__).parent / 'data' / 'datosDoback'
    
    # Crear y ejecutar procesador
    processor = CorrectProcessor(base_path)
    results = processor.run_correct_analysis()
    
    # Mostrar resumen
    print("\n" + "="*60)
    print("RESUMEN DEL ANÁLISIS CORRECTO DE SESIONES")
    print("="*60)
    print(f"Sesiones encontradas: {results['total_sessions_found']} (una por archivo CAN)")
    print("="*60)
    
    if results['sessions']:
        print("\nSESIONES ENCONTRADAS (ordenadas por proximidad temporal):")
        for session in results['sessions']:
            print(f"\nSesión {session['session_number']}: {session['vehicle']} - {session['date']}")
            print(f"  Máxima diferencia temporal: {session['max_time_diff']:.1f} min")
            print(f"  Diferencias individuales (minutos):")
            print(f"    GPS: {session['time_diffs']['gps_diff']:.1f}")
            print(f"    ESTABILIDAD: {session['time_diffs']['estabilidad_diff']:.1f}")
            print(f"    ROTATIVO: {session['time_diffs']['rotativo_diff']:.1f}")
            print(f"  Archivos:")
            for file_type, filename in session['files'].items():
                print(f"    {file_type}: {filename}")
    else:
        print("\n❌ No se encontraron sesiones")

if __name__ == "__main__":
    main() 