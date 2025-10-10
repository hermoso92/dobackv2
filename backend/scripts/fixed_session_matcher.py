#!/usr/bin/env python3
"""
Emparejador de Sesiones Mejorado - Soluciona problemas del emparejador existente
- Suma +2 horas automáticamente a archivos GPS
- Maneja mejor archivos ROTATIVO con fecha 00:00:00
- Tolerancia más flexible y configurable
- Lee cabeceros internos correctamente
"""

import os
import re
from datetime import datetime, timedelta
from pathlib import Path
import json
import logging
from typing import List, Dict, Optional, Any
from collections import defaultdict

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'fixed_session_matcher_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class FixedSessionMatcher:
    def __init__(self, gps_timezone_offset_hours: int = 2, tolerance_minutes: int = 30):
        self.base_path = Path(__file__).parent.parent / 'data' / 'datosDoback' / 'CMadrid'
        self.gps_timezone_offset = timedelta(hours=gps_timezone_offset_hours)
        self.tolerance = timedelta(minutes=tolerance_minutes)
        self.sessions = {}
        
    def extract_header_datetime(self, file_path: Path, file_type: str) -> Optional[datetime]:
        """Extrae la fecha y hora del cabecero interno del archivo con mejoras"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                # Leer las primeras líneas para encontrar el cabecero
                lines = []
                for i, line in enumerate(f):
                    if i >= 100:  # Aumentar a 100 líneas para mejor cobertura
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
                    # Patrón: 2025-07-14T10:30:15
                    r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})',
                ]
                
                for pattern in datetime_patterns:
                    for line in lines:
                        match = re.search(pattern, line)
                        if match:
                            datetime_str = match.group(1)
                            try:
                                # Intentar parsear la fecha
                                if '-' in datetime_str and len(datetime_str.split()[0]) == 10:
                                    if 'T' in datetime_str:
                                        # Formato: 2025-07-14T10:30:15
                                        dt = datetime.strptime(datetime_str, '%Y-%m-%dT%H:%M:%S')
                                    else:
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
                                
                                # Sumar offset de zona horaria si es GPS
                                if file_type.upper() == 'GPS':
                                    dt = dt + self.gps_timezone_offset
                                    logger.debug(f"GPS: {datetime_str} -> {dt.strftime('%Y-%m-%d %H:%M:%S')} (+{self.gps_timezone_offset})")
                                
                                return dt
                                
                            except ValueError as e:
                                logger.debug(f"No se pudo parsear fecha: {datetime_str} - {e}")
                                continue
                
                # Si no se encuentra en cabecero, buscar en el nombre del archivo
                return self.extract_datetime_from_filename(file_path.name, file_type)
                
        except Exception as e:
            logger.error(f"Error leyendo archivo {file_path}: {e}")
            return None
    
    def extract_datetime_from_filename(self, filename: str, file_type: str) -> Optional[datetime]:
        """Extrae fecha y hora del nombre del archivo con mejoras"""
        try:
            # Patrones comunes en nombres de archivo
            patterns = [
                # CAN_DOBACK022_20250714_3.txt
                r'_(\d{8})_(\d+)\.',
                # GPS_DOBACK022_20250714_1.txt
                r'_(\d{8})_(\d+)\.',
                # ESTABILIDAD_DOBACK022_20250714_0.txt
                r'_(\d{8})_(\d+)\.',
                # ROTATIVO_DOBACK022_20250714_0.txt
                r'_(\d{8})_(\d+)\.',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, filename)
                if match:
                    date_str = match.group(1)
                    session_num = match.group(2)
                    
                    # Convertir YYYYMMDD a datetime
                    dt = datetime.strptime(date_str, '%Y%m%d')
                    
                    # Para archivos ROTATIVO, usar solo la fecha (00:00:00)
                    if file_type.upper() == 'ROTATIVO':
                        # Mantener 00:00:00 para archivos ROTATIVO
                        logger.debug(f"ROTATIVO filename: {date_str} -> {dt.strftime('%Y-%m-%d %H:%M:%S')} (solo fecha)")
                    else:
                        # Sumar offset de zona horaria si es GPS
                        if file_type.upper() == 'GPS':
                            dt = dt + self.gps_timezone_offset
                            logger.debug(f"GPS filename: {date_str} -> {dt.strftime('%Y-%m-%d %H:%M:%S')} (+{self.gps_timezone_offset})")
                    
                    return dt
                    
        except Exception as e:
            logger.error(f"Error extrayendo fecha del nombre {filename}: {e}")
        
        return None
    
    def find_all_files(self) -> Dict[str, List[Dict]]:
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
                                'datetime': None,
                                'filename': file_path.name
                            })
        
        return files_by_type
    
    def extract_datetimes(self, files_by_type: Dict[str, List[Dict]]) -> None:
        """Extrae fechas y horas de todos los archivos"""
        logger.info("Extrayendo fechas y horas de archivos...")
        
        for file_type, files in files_by_type.items():
            logger.info(f"Procesando {len(files)} archivos {file_type}")
            
            for file_info in files:
                dt = self.extract_header_datetime(file_info['file_path'], file_type)
                file_info['datetime'] = dt
                
                if dt:
                    logger.info(f"✅ {file_type}: {file_info['filename']} -> {dt.strftime('%Y-%m-%d %H:%M:%S')}")
                else:
                    logger.warning(f"⚠️ {file_type}: {file_info['filename']} -> No se pudo extraer fecha")
    
    def match_sessions_improved(self, files_by_type: Dict[str, List[Dict]]) -> List[Dict]:
        """Empareja sesiones con lógica mejorada"""
        logger.info(f"Emparejando sesiones con tolerancia de {self.tolerance.total_seconds()/60:.0f} minutos...")
        
        sessions = []
        
        # Agrupar archivos por vehículo
        files_by_vehicle = defaultdict(lambda: defaultdict(list))
        for file_type, files in files_by_type.items():
            for file_info in files:
                if not file_info['datetime']:
                    continue
                vehicle = file_info['vehicle']
                files_by_vehicle[vehicle][file_type].append(file_info)
        
        # Para cada vehículo, encontrar sesiones
        for vehicle, type_files in files_by_vehicle.items():
            logger.info(f"Analizando vehículo: {vehicle}")
            
            # Verificar que tenemos todos los tipos necesarios
            required_types = ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']
            missing_types = [t for t in required_types if t not in type_files]
            if missing_types:
                logger.info(f"  Faltan tipos para {vehicle}: {missing_types}")
                continue
            
            logger.info(f"  Tipos disponibles: {list(type_files.keys())}")
            for file_type in required_types:
                logger.info(f"  {file_type}: {len(type_files[file_type])} archivos")
            
            # Para cada archivo CAN, buscar la mejor combinación
            used_files = set()
            
            for can_file in type_files['CAN']:
                can_path = str(can_file['file_path'])
                if can_path in used_files:
                    continue
                
                logger.info(f"    🔍 Buscando sesión para CAN: {can_file['filename']} ({can_file['datetime']})")
                
                # Buscar la mejor combinación para este CAN
                best_session = self._find_best_combination_improved(can_file, type_files, used_files)
                
                if best_session:
                    # Marcar archivos como usados
                    for file_type, file_info in best_session['files'].items():
                        used_files.add(str(file_info['file_path']))
                    
                    sessions.append(best_session)
                    logger.info(f"    ✅ Sesión encontrada para {vehicle}:")
                    logger.info(f"      CAN: {best_session['files']['CAN']['filename']} ({best_session['files']['CAN']['datetime']})")
                    logger.info(f"      GPS: {best_session['files']['GPS']['filename']} ({best_session['files']['GPS']['datetime']})")
                    logger.info(f"      ESTABILIDAD: {best_session['files']['ESTABILIDAD']['filename']} ({best_session['files']['ESTABILIDAD']['datetime']})")
                    logger.info(f"      ROTATIVO: {best_session['files']['ROTATIVO']['filename']} ({best_session['files']['ROTATIVO']['datetime']})")
                    logger.info(f"      Score: {best_session['score']:.3f}")
                else:
                    logger.warning(f"    ❌ No se pudo formar sesión para CAN: {can_file['filename']}")
        
        return sessions
    
    def _find_best_combination_improved(self, can_file: Dict, type_files: Dict[str, List[Dict]], used_files: set) -> Optional[Dict]:
        """Encuentra la mejor combinación de archivos para un archivo CAN con lógica mejorada"""
        can_time = can_file['datetime']
        best_session = None
        best_score = -1
        
        # Probar todas las combinaciones posibles
        for gps_file in type_files['GPS']:
            gps_path = str(gps_file['file_path'])
            if gps_path in used_files:
                continue
            
            for estabilidad_file in type_files['ESTABILIDAD']:
                estabilidad_path = str(estabilidad_file['file_path'])
                if estabilidad_path in used_files:
                    continue
                
                for rotativo_file in type_files['ROTATIVO']:
                    rotativo_path = str(rotativo_file['file_path'])
                    if rotativo_path in used_files:
                        continue
                    
                    # Calcular score con lógica mejorada
                    score = self._calculate_improved_score(
                        can_time, 
                        gps_file['datetime'],
                        estabilidad_file['datetime'],
                        rotativo_file['datetime']
                    )
                    
                    if score > best_score:
                        best_score = score
                        best_session = {
                            'vehicle': can_file['vehicle'],
                            'date': can_time.date(),
                            'start_time': can_time,
                            'end_time': max(
                                can_time,
                                gps_file['datetime'],
                                estabilidad_file['datetime'],
                                rotativo_file['datetime']
                            ),
                            'files': {
                                'CAN': can_file,
                                'GPS': gps_file,
                                'ESTABILIDAD': estabilidad_file,
                                'ROTATIVO': rotativo_file
                            },
                            'score': score,
                            'time_diffs': {
                                'gps_diff': abs((gps_file['datetime'] - can_time).total_seconds() / 60),
                                'estabilidad_diff': abs((estabilidad_file['datetime'] - can_time).total_seconds() / 60),
                                'rotativo_diff': abs((rotativo_file['datetime'] - can_time).total_seconds() / 60)
                            }
                        }
        
        return best_session
    
    def _calculate_improved_score(self, can_time: datetime, gps_time: datetime, estabilidad_time: datetime, rotativo_time: datetime) -> float:
        """Calcula score con lógica mejorada"""
        # Calcular diferencias en minutos
        gps_diff = abs((gps_time - can_time).total_seconds() / 60)
        estabilidad_diff = abs((estabilidad_time - can_time).total_seconds() / 60)
        rotativo_diff = abs((rotativo_time - can_time).total_seconds() / 60)
        
        # Para archivos ROTATIVO que solo tienen fecha (00:00:00), verificar fecha
        if rotativo_time.hour == 0 and rotativo_time.minute == 0 and rotativo_time.second == 0:
            if rotativo_time.date() == can_time.date():
                rotativo_diff = 0  # Considerar como coincidente si es la misma fecha
            else:
                return -1  # Fechas diferentes, descartar
        
        # Verificar que todas las diferencias estén dentro de la tolerancia
        max_diff = max(gps_diff, estabilidad_diff, rotativo_diff)
        if max_diff > self.tolerance.total_seconds() / 60:
            return -1
        
        # Score basado en la suma de diferencias (menor = mejor)
        total_diff = gps_diff + estabilidad_diff + rotativo_diff
        score = 1.0 / (1.0 + total_diff / 10.0)  # Normalizar
        
        return score
    
    def generate_report(self, sessions: List[Dict]) -> Dict[str, Any]:
        """Genera un reporte de las sesiones emparejadas"""
        logger.info("Generando reporte de sesiones...")
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_sessions_found': len(sessions),
            'gps_timezone_offset_hours': self.gps_timezone_offset.total_seconds() / 3600,
            'tolerance_minutes': self.tolerance.total_seconds() / 60,
            'sessions': []
        }
        
        for i, session in enumerate(sessions, 1):
            session_info = {
                'session_number': i,
                'vehicle': session['vehicle'],
                'date': session['date'].isoformat(),
                'start_time': session['start_time'].isoformat(),
                'end_time': session['end_time'].isoformat(),
                'duration_minutes': int((session['end_time'] - session['start_time']).total_seconds() / 60),
                'score': session['score'],
                'time_diffs': session['time_diffs'],
                'files': {
                    'CAN': session['files']['CAN']['filename'],
                    'GPS': session['files']['GPS']['filename'],
                    'ESTABILIDAD': session['files']['ESTABILIDAD']['filename'],
                    'ROTATIVO': session['files']['ROTATIVO']['filename']
                }
            }
            report['sessions'].append(session_info)
        
        return report
    
    def save_report(self, report: Dict[str, Any], output_file: str = 'fixed_session_matching_report.json') -> None:
        """Guarda el reporte en un archivo JSON"""
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            logger.info(f"Reporte guardado: {output_file}")
        except Exception as e:
            logger.error(f"Error guardando reporte: {e}")
    
    def print_summary(self, report: Dict[str, Any]) -> None:
        """Imprime un resumen del reporte"""
        print("\n" + "="*80)
        print("📊 RESUMEN DE EMPAREJAMIENTO DE SESIONES MEJORADO - CMADRID")
        print("="*80)
        
        print(f"📁 Total de sesiones encontradas: {report['total_sessions_found']}")
        print(f"🕐 Offset GPS: +{report['gps_timezone_offset_hours']} horas")
        print(f"⏱️ Tolerancia: {report['tolerance_minutes']} minutos")
        
        if report['sessions']:
            print(f"\n📋 Detalles por sesión:")
            for session in report['sessions']:
                print(f"\n📅 Sesión {session['session_number']}: {session['date']} - {session['vehicle']}")
                print(f"   ⏰ {session['start_time']} -> {session['end_time']} ({session['duration_minutes']} min)")
                print(f"   🎯 Score: {session['score']:.3f}")
                print(f"   📊 Diferencias (min): GPS={session['time_diffs']['gps_diff']:.1f}, EST={session['time_diffs']['estabilidad_diff']:.1f}, ROT={session['time_diffs']['rotativo_diff']:.1f}")
                print(f"   📁 Archivos:")
                for file_type, filename in session['files'].items():
                    print(f"      {file_type}: {filename}")
        else:
            print("\n❌ No se encontraron sesiones válidas")
        
        print("="*80)
    
    def run(self) -> Dict[str, Any]:
        """Ejecuta el proceso completo de emparejamiento mejorado"""
        logger.info("🚀 Iniciando emparejamiento de sesiones mejorado")
        
        # 1. Encontrar todos los archivos
        files_by_type = self.find_all_files()
        
        # 2. Extraer fechas y horas
        self.extract_datetimes(files_by_type)
        
        # 3. Emparejar sesiones con lógica mejorada
        sessions = self.match_sessions_improved(files_by_type)
        
        # 4. Generar reporte
        report = self.generate_report(sessions)
        
        # 5. Guardar y mostrar resultados
        self.save_report(report)
        self.print_summary(report)
        
        return report

def main():
    print("🔧 Emparejador de Sesiones Mejorado - CMadrid")
    print("=" * 60)
    
    # Configuración mejorada
    matcher = FixedSessionMatcher(
        gps_timezone_offset_hours=2,  # +2 horas para GPS
        tolerance_minutes=30          # 30 minutos de tolerancia
    )
    
    report = matcher.run()
    
    print(f"\n✅ Proceso completado. Reporte guardado en: fixed_session_matching_report.json")

if __name__ == "__main__":
    main() 