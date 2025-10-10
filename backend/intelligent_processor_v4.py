#!/usr/bin/env python3
"""
Procesador Inteligente V4 - Integra el emparejador mejorado
- Suma +2 horas automáticamente a archivos GPS
- Tolerancia configurable (30 minutos por defecto)
- Mejor manejo de archivos ROTATIVO
- Filtrado de archivos traducidos
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
        logging.FileHandler(f'intelligent_processor_v4_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class FileContentAnalyzerV4:
    """Analizador de contenido de archivos mejorado"""
    
    def __init__(self):
        pass
    
    def extract_real_datetime_from_file(self, file_path: Path, file_type: str, gps_timezone_offset_hours: int = 2) -> Optional[datetime]:
        """Extrae la fecha y hora real del contenido del archivo con mejoras"""
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
                                    dt = dt + timedelta(hours=gps_timezone_offset_hours)
                                    logger.debug(f"GPS: {datetime_str} -> {dt.strftime('%Y-%m-%d %H:%M:%S')} (+{gps_timezone_offset_hours}h)")
                                
                                return dt
                                
                            except ValueError as e:
                                logger.debug(f"No se pudo parsear fecha: {datetime_str} - {e}")
                                continue
                
                # Si no se encuentra en cabecero, buscar en el nombre del archivo
                return self.extract_datetime_from_filename(file_path.name, file_type, gps_timezone_offset_hours)
                
        except Exception as e:
            logger.error(f"Error leyendo archivo {file_path}: {e}")
            return None
    
    def extract_datetime_from_filename(self, filename: str, file_type: str, gps_timezone_offset_hours: int = 2) -> Optional[datetime]:
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
                            dt = dt + timedelta(hours=gps_timezone_offset_hours)
                            logger.debug(f"GPS filename: {date_str} -> {dt.strftime('%Y-%m-%d %H:%M:%S')} (+{gps_timezone_offset_hours}h)")
                    
                    return dt
                    
        except Exception as e:
            logger.error(f"Error extrayendo fecha del nombre {filename}: {e}")
        
        return None

class ImprovedSessionMatcher:
    """Emparejador de sesiones mejorado con +2h para GPS y tolerancia flexible"""
    
    def __init__(self, gps_timezone_offset_hours: int = 2, tolerance_minutes: int = 30):
        self.gps_timezone_offset = timedelta(hours=gps_timezone_offset_hours)
        self.tolerance = timedelta(minutes=tolerance_minutes)
        self.analyzer = FileContentAnalyzerV4()
    
    def find_complete_sessions(self, base_path: Path) -> List[Dict[str, Any]]:
        """Encuentra todas las sesiones completas posibles con mejoras"""
        sessions = []
        
        # Escanear todos los archivos y extraer fechas reales
        all_files = self._scan_all_files(base_path)
        logger.info(f"Escaneados {len(all_files)} archivos totales")
        
        # Agrupar por vehículo
        files_by_vehicle = defaultdict(lambda: defaultdict(list))
        for file_info in all_files:
            vehicle = file_info['vehicle']
            file_type = file_info['type']
            files_by_vehicle[vehicle][file_type].append(file_info)
        
        # Para cada vehículo, encontrar sesiones completas
        for vehicle, type_files in files_by_vehicle.items():
            logger.info(f"Analizando vehículo: {vehicle}")
            vehicle_sessions = self._find_sessions_for_vehicle(vehicle, type_files)
            sessions.extend(vehicle_sessions)
        
        return sessions
    
    def _scan_all_files(self, base_path: Path) -> List[Dict[str, Any]]:
        """Escanea todos los archivos y extrae fechas reales"""
        all_files = []
        
        if not base_path.exists():
            logger.error(f"No se encuentra el directorio base: {base_path}")
            return all_files
        
        # Buscar en todos los vehículos
        for vehicle_dir in base_path.iterdir():
            if not vehicle_dir.is_dir():
                continue
                
            vehicle_name = vehicle_dir.name
            logger.info(f"Procesando vehículo: {vehicle_name}")
            
            # Buscar archivos por tipo
            for file_type in ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']:
                type_dir = vehicle_dir / file_type
                if type_dir.exists():
                    for file_path in type_dir.iterdir():
                        if file_path.is_file() and file_path.suffix.lower() in ['.txt', '.csv']:
                            # Filtrar archivos traducidos
                            if '_TRADUCIDO' in file_path.name:
                                continue
                            
                            # Extraer fecha y hora real
                            real_datetime = self.analyzer.extract_real_datetime_from_file(
                                file_path, file_type, self.gps_timezone_offset.total_seconds() / 3600
                            )
                            
                            if real_datetime:
                                file_info = {
                                    'vehicle': vehicle_name,
                                    'type': file_type,
                                    'path': file_path,
                                    'filename': file_path.name,
                                    'real_datetime': real_datetime,
                                    'date': real_datetime.date()
                                }
                                all_files.append(file_info)
                                logger.info(f"✅ {file_type}: {file_path.name} -> {real_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
                            else:
                                logger.warning(f"⚠️ {file_type}: {file_path.name} -> No se pudo extraer fecha")
        
        return all_files
    
    def _find_sessions_for_vehicle(self, vehicle: str, type_files: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Encuentra sesiones completas para un vehículo específico"""
        sessions = []
        
        # Verificar que tenemos todos los tipos necesarios
        required_types = ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']
        missing_types = [t for t in required_types if t not in type_files]
        if missing_types:
            logger.info(f"  Faltan tipos para {vehicle}: {missing_types}")
            return sessions
        
        logger.info(f"  Tipos disponibles: {list(type_files.keys())}")
        for file_type in required_types:
            logger.info(f"  {file_type}: {len(type_files[file_type])} archivos")
        
        # Para cada archivo CAN, buscar la mejor combinación
        used_files = set()
        
        for can_file in type_files['CAN']:
            can_path = str(can_file['path'])
            if can_path in used_files:
                continue
            
            logger.info(f"    🔍 Buscando sesión para CAN: {can_file['filename']} ({can_file['real_datetime']})")
            
            # Buscar la mejor combinación para este CAN
            best_session = self._find_best_combination_improved(can_file, type_files, used_files)
            
            if best_session:
                # Marcar archivos como usados
                for file_type, file_info in best_session['files'].items():
                    used_files.add(str(file_info['path']))
                
                sessions.append(best_session)
                logger.info(f"    ✅ Sesión encontrada para {vehicle}:")
                logger.info(f"      CAN: {best_session['files']['CAN']['filename']} ({best_session['files']['CAN']['real_datetime']})")
                logger.info(f"      GPS: {best_session['files']['GPS']['filename']} ({best_session['files']['GPS']['real_datetime']})")
                logger.info(f"      ESTABILIDAD: {best_session['files']['ESTABILIDAD']['filename']} ({best_session['files']['ESTABILIDAD']['real_datetime']})")
                logger.info(f"      ROTATIVO: {best_session['files']['ROTATIVO']['filename']} ({best_session['files']['ROTATIVO']['real_datetime']})")
                logger.info(f"      Score: {best_session['score']:.3f}")
            else:
                logger.warning(f"    ❌ No se pudo formar sesión para CAN: {can_file['filename']}")
        
        return sessions
    
    def _find_best_combination_improved(self, can_file: Dict, type_files: Dict[str, List[Dict[str, Any]]], used_files: set) -> Optional[Dict[str, Any]]:
        """Encuentra la mejor combinación de archivos para un archivo CAN con lógica mejorada"""
        can_time = can_file['real_datetime']
        best_session = None
        best_score = -1
        
        # Probar todas las combinaciones posibles
        for gps_file in type_files['GPS']:
            gps_path = str(gps_file['path'])
            if gps_path in used_files:
                continue
            
            for estabilidad_file in type_files['ESTABILIDAD']:
                estabilidad_path = str(estabilidad_file['path'])
                if estabilidad_path in used_files:
                    continue
                
                for rotativo_file in type_files['ROTATIVO']:
                    rotativo_path = str(rotativo_file['path'])
                    if rotativo_path in used_files:
                        continue
                    
                    # Calcular score con lógica mejorada
                    score = self._calculate_improved_score(
                        can_time, 
                        gps_file['real_datetime'],
                        estabilidad_file['real_datetime'],
                        rotativo_file['real_datetime']
                    )
                    
                    if score > best_score:
                        best_score = score
                        best_session = {
                            'vehicle': can_file['vehicle'],
                            'date': can_file['date'],
                            'start_time': can_time,
                            'end_time': max(
                                can_time,
                                gps_file['real_datetime'],
                                estabilidad_file['real_datetime'],
                                rotativo_file['real_datetime']
                            ),
                            'files': {
                                'CAN': can_file,
                                'GPS': gps_file,
                                'ESTABILIDAD': estabilidad_file,
                                'ROTATIVO': rotativo_file
                            },
                            'score': score,
                            'time_diffs': {
                                'gps_diff': abs((gps_file['real_datetime'] - can_time).total_seconds() / 60),
                                'estabilidad_diff': abs((estabilidad_file['real_datetime'] - can_time).total_seconds() / 60),
                                'rotativo_diff': abs((rotativo_file['real_datetime'] - can_time).total_seconds() / 60)
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

class IntelligentProcessorV4:
    """Procesador inteligente V4 con emparejador mejorado"""
    
    def __init__(self, base_path: Path, db_config: Dict[str, str], gps_timezone_offset_hours: int = 2, tolerance_minutes: int = 30):
        self.base_path = base_path
        self.db_config = db_config
        self.gps_timezone_offset_hours = gps_timezone_offset_hours
        self.tolerance_minutes = tolerance_minutes
        self.session_matcher = ImprovedSessionMatcher(gps_timezone_offset_hours, tolerance_minutes)
    
    def run_full_analysis(self) -> Dict[str, Any]:
        """Ejecuta el análisis completo con emparejador mejorado"""
        logger.info("🚀 Iniciando análisis inteligente V4 (emparejador mejorado)...")
        logger.info(f"🕐 Offset GPS: +{self.gps_timezone_offset_hours} horas")
        logger.info(f"⏱️ Tolerancia: {self.tolerance_minutes} minutos")
        
        # 1. Encontrar sesiones completas
        logger.info("📋 Buscando sesiones completas con emparejador mejorado...")
        sessions = self.session_matcher.find_complete_sessions(self.base_path)
        
        logger.info(f"✅ Encontradas {len(sessions)} sesiones completas")
        
        # 2. Generar reporte detallado
        report = {
            'timestamp': datetime.now().isoformat(),
            'version': 'V4 - Emparejador Mejorado',
            'gps_timezone_offset_hours': self.gps_timezone_offset_hours,
            'tolerance_minutes': self.tolerance_minutes,
            'total_sessions_found': len(sessions),
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
        
        # 3. Guardar reporte
        report_path = Path('intelligent_analysis_v4_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"📊 Reporte guardado en: {report_path}")
        
        return report

def main():
    """Función principal"""
    # Configuración
    db_config = {
        'host': 'localhost',
        'database': 'dobacksoft',
        'user': 'postgres',
        'password': 'postgres'
    }
    
    # Ruta base de datos - apuntar específicamente a CMadrid
    base_path = Path(__file__).parent / 'data' / 'datosDoback' / 'CMadrid'
    
    # Crear y ejecutar procesador V4 con configuración mejorada
    processor = IntelligentProcessorV4(
        base_path, 
        db_config,
        gps_timezone_offset_hours=2,  # +2 horas para GPS
        tolerance_minutes=30          # 30 minutos de tolerancia
    )
    
    results = processor.run_full_analysis()
    
    # Mostrar resumen
    print("\n" + "="*80)
    print("RESUMEN DEL ANÁLISIS INTELIGENTE V4 - EMPAREJADOR MEJORADO")
    print("="*80)
    print(f"Versión: {results['version']}")
    print(f"Offset GPS: +{results['gps_timezone_offset_hours']} horas")
    print(f"Tolerancia: {results['tolerance_minutes']} minutos")
    print(f"Sesiones completas encontradas: {results['total_sessions_found']}")
    print("="*80)
    
    if results['sessions']:
        print("\nSESIONES ENCONTRADAS:")
        for session in results['sessions']:
            print(f"\nSesión {session['session_number']}: {session['vehicle']} - {session['date']}")
            print(f"  Duración: {session['duration_minutes']} minutos")
            print(f"  Score: {session['score']:.3f}")
            print(f"  Diferencias temporales (minutos):")
            print(f"    GPS: {session['time_diffs']['gps_diff']:.1f}")
            print(f"    ESTABILIDAD: {session['time_diffs']['estabilidad_diff']:.1f}")
            print(f"    ROTATIVO: {session['time_diffs']['rotativo_diff']:.1f}")
            print(f"  Archivos:")
            for file_type, filename in session['files'].items():
                print(f"    {file_type}: {filename}")
    else:
        print("\n❌ No se encontraron sesiones válidas")

if __name__ == "__main__":
    main() 