#!/usr/bin/env python3
"""
Procesador Estricto Temporal - Doback Soft
Lee internamente TODOS los archivos y encuentra sesiones completas
con menos de 2 minutos de diferencia entre TODOS los archivos
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import re
from collections import defaultdict
from itertools import combinations, product

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FileContentAnalyzer:
    """Analiza el contenido completo de archivos para extraer fechas/horas reales de los DATOS (no cabecera)"""
    
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
    
    def extract_real_datetime_from_file(self, file_path: Path, file_type: str) -> Optional[datetime]:
        """Extrae la PRIMERA fecha/hora real de los datos (no cabecera) del archivo"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            if not lines:
                return None
            # Saltar cabecera: buscar la primera línea de datos real
            data_start = self._find_data_start_line(lines, file_type)
            for i in range(data_start, len(lines)):
                line = lines[i].strip()
                if not line or line.lower().startswith('fecha') or line.lower().startswith('canid'):
                    continue
                dt = self._extract_datetime_from_data_line(line, file_type)
                if dt:
                    logger.debug(f"Fecha encontrada en datos ({file_type}) línea {i+1} de {file_path.name}: {dt}")
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
            if file_type in ['GPS', 'ESTABILIDAD', 'ROTATIVO'] and ('fecha' in l and 'hora' in l):
                return idx + 1
        # Si no se detecta cabecera, asumir datos desde la segunda línea
        return 1
    def _extract_datetime_from_data_line(self, line: str, file_type: str) -> Optional[datetime]:
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
            elif file_type in ['GPS', 'ESTABILIDAD', 'ROTATIVO']:
                # Ejemplo línea: 2025-07-08 09:12:31;1;...
                parts = line.split(';')
                if len(parts) < 1:
                    return None
                fecha_hora = parts[0].strip()
                return self._parse_datetime_str(fecha_hora)
            else:
                return None
        except Exception as e:
            logger.debug(f"Error parseando datos de línea: {e}")
            return None
    def _parse_datetime_str(self, fecha_hora: str) -> Optional[datetime]:
        """Parsea un string de fecha-hora a datetime"""
        for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S.%f", "%d/%m/%Y %H:%M:%S", "%d-%m-%Y %H:%M:%S"]:
            try:
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

class StrictTemporalMatcher:
    """Encuentra sesiones completas con menos de 2 minutos de diferencia entre TODOS los archivos"""
    
    def __init__(self, max_tolerance_minutes: int = 2):
        self.max_tolerance = timedelta(minutes=max_tolerance_minutes)
        self.analyzer = FileContentAnalyzer()
    
    def find_strict_temporal_sessions(self, base_path: Path) -> List[Dict[str, Any]]:
        """Encuentra sesiones completas con tolerancia estricta entre TODOS los archivos"""
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
        
        # Para cada vehículo, encontrar sesiones con coincidencia temporal estricta
        for vehicle, type_files in files_by_vehicle.items():
            logger.info(f"Analizando vehículo: {vehicle}")
            vehicle_sessions = self._find_strict_sessions_for_vehicle(vehicle, type_files)
            all_sessions.extend(vehicle_sessions)
        
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
    
    def _find_strict_sessions_for_vehicle(self, vehicle: str, type_files: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Encuentra sesiones con coincidencia temporal estricta para un vehículo"""
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
        
        # Para cada archivo CAN, buscar combinaciones estrictas
        used_files = set()
        
        for can_file in type_files['CAN']:
            can_path = str(can_file['path'])
            if can_path in used_files:
                continue
            
            logger.info(f"    🔍 Buscando sesión estricta para CAN: {can_file['filename']} ({can_file['real_datetime']})")
            
            # Buscar la mejor combinación estricta para este CAN
            best_session = self._find_best_strict_combination(can_file, type_files, used_files)
            
            if best_session:
                # Marcar archivos como usados
                for file_type, file_info in best_session['files'].items():
                    used_files.add(str(file_info['path']))
                
                sessions.append(best_session)
                logger.info(f"    ✅ Sesión estricta encontrada para {vehicle}:")
                logger.info(f"      CAN: {best_session['files']['CAN']['filename']} ({best_session['files']['CAN']['real_datetime']})")
                logger.info(f"      GPS: {best_session['files']['GPS']['filename']} ({best_session['files']['GPS']['real_datetime']})")
                logger.info(f"      ESTABILIDAD: {best_session['files']['ESTABILIDAD']['filename']} ({best_session['files']['ESTABILIDAD']['real_datetime']})")
                logger.info(f"      ROTATIVO: {best_session['files']['ROTATIVO']['filename']} ({best_session['files']['ROTATIVO']['real_datetime']})")
                logger.info(f"      Máxima diferencia: {best_session['max_time_diff']:.1f} min")
            else:
                logger.warning(f"    ❌ No se pudo formar sesión estricta para CAN: {can_file['filename']}")
        
        return sessions
    
    def _find_best_strict_combination(self, can_file: Dict[str, Any], type_files: Dict[str, List[Dict[str, Any]]], used_files: set) -> Optional[Dict[str, Any]]:
        """Encuentra la mejor combinación con coincidencia temporal estricta"""
        can_time = can_file['real_datetime']
        best_session = None
        best_max_diff = float('inf')
        
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
                    
                    # Verificar coincidencia temporal estricta
                    is_valid, max_diff = self._check_strict_temporal_match(
                        can_time, 
                        gps_file['real_datetime'],
                        estabilidad_file['real_datetime'],
                        rotativo_file['real_datetime']
                    )
                    
                    if is_valid and max_diff < best_max_diff:
                        best_max_diff = max_diff
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
                            'max_time_diff': max_diff,
                            'time_diffs': {
                                'gps_diff': abs((gps_file['real_datetime'] - can_time).total_seconds() / 60),
                                'estabilidad_diff': abs((estabilidad_file['real_datetime'] - can_time).total_seconds() / 60),
                                'rotativo_diff': 0 if (rotativo_file['real_datetime'].hour == 0 and rotativo_file['real_datetime'].minute == 0 and rotativo_file['real_datetime'].second == 0 and rotativo_file['real_datetime'].date() == can_time.date()) else abs((rotativo_file['real_datetime'] - can_time).total_seconds() / 60)
                            }
                        }
        
        return best_session
    
    def _check_strict_temporal_match(self, can_time: datetime, gps_time: datetime, estabilidad_time: datetime, rotativo_time: datetime) -> Tuple[bool, float]:
        """Verifica que TODOS los archivos tengan menos de 2 minutos de diferencia"""
        # Calcular diferencias en minutos
        gps_diff = abs((gps_time - can_time).total_seconds() / 60)
        estabilidad_diff = abs((estabilidad_time - can_time).total_seconds() / 60)
        
        # Para archivos ROTATIVO que solo tienen fecha (00:00:00), verificar fecha
        if rotativo_time.hour == 0 and rotativo_time.minute == 0 and rotativo_time.second == 0:
            if rotativo_time.date() == can_time.date():
                rotativo_diff = 0  # Considerar como coincidente
            else:
                return False, float('inf')  # Fechas diferentes, descartar
        else:
            rotativo_diff = abs((rotativo_time - can_time).total_seconds() / 60)
        
        # Verificar que TODAS las diferencias sean menores a 2 minutos
        max_diff = max(gps_diff, estabilidad_diff, rotativo_diff)
        
        if max_diff <= 2.0:  # Tolerancia estricta de 2 minutos
            return True, max_diff
        else:
            return False, max_diff

class StrictTemporalProcessor:
    """Procesador estricto temporal que encuentra sesiones con coincidencia temporal real"""
    
    def __init__(self, base_path: Path, db_config: Dict[str, str]):
        self.base_path = base_path
        self.db_config = db_config
        self.temporal_matcher = StrictTemporalMatcher()
    
    def run_strict_analysis(self) -> Dict[str, Any]:
        """Ejecuta el análisis estricto temporal"""
        logger.info("🚀 Iniciando análisis estricto temporal (máximo 2 min entre TODOS los archivos)...")
        
        # 1. Encontrar sesiones con coincidencia temporal estricta
        logger.info("📋 Buscando sesiones con coincidencia temporal estricta...")
        strict_sessions = self.temporal_matcher.find_strict_temporal_sessions(self.base_path)
        
        logger.info(f"✅ Encontradas {len(strict_sessions)} sesiones con coincidencia temporal estricta")
        
        # 2. Ordenar por máxima diferencia temporal (menor primero)
        strict_sessions.sort(key=lambda x: x['max_time_diff'])
        
        # 3. Generar reporte detallado
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_strict_sessions_found': len(strict_sessions),
            'max_tolerance_minutes': 2,
            'sessions': []
        }
        
        for i, session in enumerate(strict_sessions, 1):
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
        
        # 4. Guardar reporte
        report_path = Path('strict_temporal_analysis_report.json')
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
    
    # Ruta base de datos
    base_path = Path(__file__).parent / 'data' / 'datosDoback'
    
    # Crear y ejecutar procesador
    processor = StrictTemporalProcessor(base_path, db_config)
    results = processor.run_strict_analysis()
    
    # Mostrar resumen
    print("\n" + "="*60)
    print("RESUMEN DEL ANÁLISIS ESTRICTO TEMPORAL (MÁXIMO 2 MIN)")
    print("="*60)
    print(f"Sesiones con coincidencia temporal estricta: {results['total_strict_sessions_found']}")
    print("="*60)
    
    if results['sessions']:
        print("\nSESIONES ENCONTRADAS (ordenadas por máxima diferencia):")
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
        print("\n❌ No se encontraron sesiones con coincidencia temporal estricta")
        print("💡 Intenta aumentar la tolerancia o verificar las fechas de los archivos")

if __name__ == "__main__":
    main() 