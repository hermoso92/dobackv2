#!/usr/bin/env python3
"""
Procesador Inteligente V3 - Doback Soft
Tolerancia estricta de 1 minuto máximo
Encuentra TODAS las sesiones posibles para cada archivo CAN
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import re
import csv
from collections import defaultdict

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FileContentAnalyzer:
    """Analiza el contenido completo de archivos para extraer fechas/horas reales"""
    
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
        """Extrae la fecha/hora real del contenido del archivo"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            
            if not lines:
                return None
            
            # Buscar en las primeras líneas (cabecera)
            header_lines = lines[:10]
            for i, line in enumerate(header_lines):
                dt = self._extract_datetime_from_line(line)
                if dt:
                    logger.debug(f"Fecha encontrada en línea {i+1} de {file_path.name}: {dt}")
                    return dt
            
            # Si no se encuentra en cabecera, buscar en el contenido
            for i, line in enumerate(lines):
                if i > 100:  # Limitar búsqueda a las primeras 100 líneas
                    break
                dt = self._extract_datetime_from_line(line)
                if dt:
                    logger.debug(f"Fecha encontrada en línea {i+1} de {file_path.name}: {dt}")
                    return dt
            
            # Si no se encuentra, intentar extraer del nombre del archivo
            return self._extract_datetime_from_filename(file_path.name)
            
        except Exception as e:
            logger.error(f"Error leyendo {file_path}: {e}")
            return None
    
    def _extract_datetime_from_line(self, line: str) -> Optional[datetime]:
        """Extrae fecha y hora de una línea de texto"""
        try:
            # Buscar fecha
            date_match = None
            for pattern in self.date_patterns:
                match = re.search(pattern, line)
                if match:
                    date_match = match.group(1)
                    break
            
            if not date_match:
                return None
            
            # Buscar hora
            time_match = None
            for pattern in self.time_patterns:
                match = re.search(pattern, line)
                if match:
                    time_match = match.group(1)
                    break
            
            if not time_match:
                # Solo fecha, usar 00:00:00
                time_match = "00:00:00"
            
            # Parsear fecha y hora
            if '-' in date_match:
                if len(date_match.split('-')[0]) == 4:  # YYYY-MM-DD
                    date_str = f"{date_match} {time_match}"
                    return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
                else:  # DD-MM-YYYY
                    date_str = f"{date_match} {time_match}"
                    return datetime.strptime(date_str, "%d-%m-%Y %H:%M:%S")
            elif '/' in date_match:  # DD/MM/YYYY
                date_str = f"{date_match} {time_match}"
                return datetime.strptime(date_str, "%d/%m/%Y %H:%M:%S")
            
        except Exception as e:
            logger.debug(f"Error parseando fecha/hora de línea: {e}")
            return None
    
    def _extract_datetime_from_filename(self, filename: str) -> Optional[datetime]:
        """Extrae fecha del nombre del archivo como fallback"""
        try:
            # Buscar patrón YYYYMMDD en el nombre
            match = re.search(r'(\d{8})', filename)
            if match:
                date_str = match.group(1)
                return datetime.strptime(date_str, "%Y%m%d")
        except:
            pass
        return None

class StrictSessionMatcher:
    """Encuentra combinaciones correctas de archivos con tolerancia estricta de 1 minuto"""
    
    def __init__(self, time_tolerance_minutes: int = 1):
        self.time_tolerance = timedelta(minutes=time_tolerance_minutes)
        self.analyzer = FileContentAnalyzer()
    
    def find_complete_sessions(self, base_path: Path) -> List[Dict[str, Any]]:
        """Encuentra todas las sesiones completas posibles con tolerancia estricta"""
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
        """Encuentra sesiones completas para un vehículo específico con tolerancia estricta"""
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
        
        # Para cada archivo CAN, buscar la mejor combinación
        used_files = set()
        
        for can_file in type_files['CAN']:
            can_path = str(can_file['path'])
            if can_path in used_files:
                continue
            
            logger.info(f"    🔍 Buscando sesión para CAN: {can_file['filename']} ({can_file['real_datetime']})")
            
            # Buscar la mejor combinación para este CAN
            best_session = self._find_best_combination_strict(can_file, type_files, used_files)
            
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
                logger.info(f"      Diferencias: GPS={best_session['time_diffs']['gps_diff']:.1f}min, EST={best_session['time_diffs']['estabilidad_diff']:.1f}min, ROT={best_session['time_diffs']['rotativo_diff']:.1f}min")
            else:
                logger.warning(f"    ❌ No se pudo formar sesión para CAN: {can_file['filename']}")
        
        return sessions
    
    def _find_best_combination_strict(self, can_file: Dict[str, Any], type_files: Dict[str, List[Dict[str, Any]]], used_files: set) -> Optional[Dict[str, Any]]:
        """Encuentra la mejor combinación de archivos con tolerancia estricta"""
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
                    
                    # Calcular score con tolerancia estricta
                    score = self._calculate_strict_temporal_score(
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
    
    def _calculate_strict_temporal_score(self, can_time: datetime, gps_time: datetime, estabilidad_time: datetime, rotativo_time: datetime) -> float:
        """Calcula un score con tolerancia estricta de 1 minuto"""
        # Calcular diferencias en minutos
        gps_diff = abs((gps_time - can_time).total_seconds() / 60)
        estabilidad_diff = abs((estabilidad_time - can_time).total_seconds() / 60)
        rotativo_diff = abs((rotativo_time - can_time).total_seconds() / 60)
        
        # Para archivos ROTATIVO que solo tienen fecha (00:00:00), verificar fecha
        if rotativo_time.hour == 0 and rotativo_time.minute == 0 and rotativo_time.second == 0:
            if rotativo_time.date() == can_time.date():
                rotativo_diff = 0  # Considerar como coincidente
            else:
                return -1  # Fechas diferentes, descartar
        
        # Tolerancia estricta: máximo 1 minuto para GPS y ESTABILIDAD
        if gps_diff > 1.0 or estabilidad_diff > 1.0:
            return -1
        
        # Score basado en la suma de diferencias (menor = mejor)
        total_diff = gps_diff + estabilidad_diff + rotativo_diff
        score = 1.0 / (1.0 + total_diff)  # Normalizar
        
        return score

class IntelligentProcessorV3:
    """Procesador inteligente V3 con tolerancia estricta"""
    
    def __init__(self, base_path: Path, db_config: Dict[str, str]):
        self.base_path = base_path
        self.db_config = db_config
        self.session_matcher = StrictSessionMatcher()
    
    def run_full_analysis(self) -> Dict[str, Any]:
        """Ejecuta el análisis completo con tolerancia estricta"""
        logger.info("🚀 Iniciando análisis inteligente V3 (tolerancia 1 minuto)...")
        
        # 1. Encontrar sesiones completas
        logger.info("📋 Buscando sesiones completas con tolerancia estricta...")
        sessions = self.session_matcher.find_complete_sessions(self.base_path)
        
        logger.info(f"✅ Encontradas {len(sessions)} sesiones completas")
        
        # 2. Generar reporte detallado
        report = {
            'timestamp': datetime.now().isoformat(),
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
        report_path = Path('intelligent_analysis_v3_report.json')
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
    processor = IntelligentProcessorV3(base_path, db_config)
    results = processor.run_full_analysis()
    
    # Mostrar resumen
    print("\n" + "="*60)
    print("RESUMEN DEL ANÁLISIS INTELIGENTE V3 (TOLERANCIA 1 MINUTO)")
    print("="*60)
    print(f"Sesiones completas encontradas: {results['total_sessions_found']}")
    print("="*60)
    
    if results['sessions']:
        print("\nSESIONES ENCONTRADAS:")
        for session in results['sessions']:
            print(f"\nSesión {session['session_number']}: {session['vehicle']} - {session['date']}")
            print(f"  Score: {session['score']:.3f}")
            print(f"  Diferencias temporales (minutos):")
            print(f"    GPS: {session['time_diffs']['gps_diff']:.1f}")
            print(f"    ESTABILIDAD: {session['time_diffs']['estabilidad_diff']:.1f}")
            print(f"    ROTATIVO: {session['time_diffs']['rotativo_diff']:.1f}")
            print(f"  Archivos:")
            for file_type, filename in session['files'].items():
                print(f"    {file_type}: {filename}")
    else:
        print("\n❌ No se encontraron sesiones con tolerancia de 1 minuto")
        print("💡 Intenta aumentar la tolerancia o verificar las fechas de los archivos")

if __name__ == "__main__":
    main() 