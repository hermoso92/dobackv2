#!/usr/bin/env python3
"""
Procesador Inteligente V2 - Doback Soft
Lee el contenido completo de cada archivo para extraer fechas/horas reales
y hacer combinaciones correctas de sesiones
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
            for line in header_lines:
                dt = self._extract_datetime_from_line(line)
                if dt:
                    logger.debug(f"Fecha encontrada en cabecera de {file_path.name}: {dt}")
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

class SessionMatcher:
    """Encuentra combinaciones correctas de archivos para formar sesiones"""
    
    def __init__(self, time_tolerance_minutes: int = 120):
        self.time_tolerance = timedelta(minutes=time_tolerance_minutes)
        self.analyzer = FileContentAnalyzer()
    
    def find_complete_sessions(self, base_path: Path) -> List[Dict[str, Any]]:
        """Encuentra todas las sesiones completas posibles"""
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
        """Encuentra sesiones completas para un vehículo específico"""
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
            
            # Buscar la mejor combinación para este CAN
            best_session = self._find_best_combination(can_file, type_files, used_files)
            
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
        
        return sessions
    
    def _find_best_combination(self, can_file: Dict[str, Any], type_files: Dict[str, List[Dict[str, Any]]], used_files: set) -> Optional[Dict[str, Any]]:
        """Encuentra la mejor combinación de archivos para un archivo CAN"""
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
                    
                    # Calcular score basado en proximidad temporal
                    score = self._calculate_temporal_score(
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
    
    def _calculate_temporal_score(self, can_time: datetime, gps_time: datetime, estabilidad_time: datetime, rotativo_time: datetime) -> float:
        """Calcula un score basado en la proximidad temporal de los archivos"""
        # Calcular diferencias en minutos
        gps_diff = abs((gps_time - can_time).total_seconds() / 60)
        estabilidad_diff = abs((estabilidad_time - can_time).total_seconds() / 60)
        rotativo_diff = abs((rotativo_time - can_time).total_seconds() / 60)
        
        # Para archivos ROTATIVO que solo tienen fecha (00:00:00), usar tolerancia especial
        if rotativo_time.hour == 0 and rotativo_time.minute == 0 and rotativo_time.second == 0:
            # Si el ROTATIVO solo tiene fecha, verificar que coincida la fecha
            if rotativo_time.date() == can_time.date():
                rotativo_diff = 0  # Considerar como coincidente
            else:
                return -1  # Fechas diferentes, descartar
        
        # Si alguna diferencia es mayor que la tolerancia, descartar
        if max(gps_diff, estabilidad_diff, rotativo_diff) > self.time_tolerance.total_seconds() / 60:
            return -1
        
        # Score basado en la suma de diferencias (menor = mejor)
        total_diff = gps_diff + estabilidad_diff + rotativo_diff
        score = 1.0 / (1.0 + total_diff / 10.0)  # Normalizar
        
        return score

class IntelligentProcessorV2:
    """Procesador inteligente V2 que lee contenido completo de archivos"""
    
    def __init__(self, base_path: Path, db_config: Dict[str, str]):
        self.base_path = base_path
        self.db_config = db_config
        self.session_matcher = SessionMatcher()
    
    def run_full_analysis(self):
        """Ejecuta el análisis completo con emparejador mejorado"""
        logger.info("🚀 Iniciando análisis inteligente V2 con emparejador mejorado...")
        
        # 1. Encontrar sesiones completas con emparejador mejorado
        logger.info("📋 Buscando sesiones completas con emparejador mejorado...")
        
        # Importar el emparejador mejorado
        from agrupar_sesiones import agrupar_sesiones
        
        # Configurar parámetros del emparejador mejorado
        gps_timezone_offset_hours = 2  # +2 horas para GPS
        tolerance_minutes = 30         # 30 minutos de tolerancia
        
        # Ruta base para buscar archivos
        base_path = Path(__file__).parent / 'data' / 'datosDoback'
        
        # Ejecutar emparejador mejorado
        sessions = agrupar_sesiones(
            base_path=str(base_path),
            gps_timezone_offset_hours=gps_timezone_offset_hours,
            tolerance_minutes=tolerance_minutes
        )
        
        logger.info(f"✅ Encontradas {len(sessions)} sesiones completas con emparejador mejorado")
        
        # 2. Procesar cada sesión encontrada
        processed_sessions = []
        for i, session in enumerate(sessions, 1):
            logger.info(f"🔄 Procesando sesión {i}/{len(sessions)}: {session['vehicle']} - {session['date']}")
            
            try:
                # Procesar archivos de la sesión
                session_result = self._process_session_improved(session)
                if session_result:
                    processed_sessions.append(session_result)
                    logger.info(f"✅ Sesión {i} procesada exitosamente")
                else:
                    logger.warning(f"⚠️ Sesión {i} no se pudo procesar completamente")
                    
            except Exception as e:
                logger.error(f"❌ Error procesando sesión {i}: {e}")
                continue
        
        # 3. Generar reporte final
        report = {
            'timestamp': datetime.now().isoformat(),
            'version': 'V2 - Con Emparejador Mejorado',
            'gps_timezone_offset_hours': gps_timezone_offset_hours,
            'tolerance_minutes': tolerance_minutes,
            'total_sessions_found': len(sessions),
            'total_sessions_processed': len(processed_sessions),
            'sessions': processed_sessions
        }
        
        # Guardar reporte
        report_path = Path('intelligent_analysis_v2_improved_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"📊 Reporte guardado en: {report_path}")
        
        return report
    
    def _process_session_improved(self, session: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Procesa una sesión individual con el emparejador mejorado"""
        try:
            # Extraer información de la sesión
            vehicle = session['vehicle']
            date = session['date']
            score = session['score']
            time_diffs = session['time_diffs']
            files = session['files']
            
            # Procesar cada tipo de archivo
            processed_files = {}
            
            for file_type, file_info in files.items():
                file_path = file_info['path']
                filename = file_info['filename']
                real_datetime = file_info['real_datetime']
                
                logger.info(f"    📁 Procesando {file_type}: {filename}")
                
                # Aquí puedes agregar el procesamiento específico para cada tipo de archivo
                # Por ejemplo, decodificación CAN, análisis GPS, etc.
                
                processed_files[file_type] = {
                    'filename': filename,
                    'path': str(file_path),
                    'datetime': real_datetime.isoformat(),
                    'processed': True
                }
            
            # Crear resultado de la sesión
            session_result = {
                'vehicle': vehicle,
                'date': date.isoformat() if hasattr(date, 'isoformat') else str(date),
                'score': score,
                'time_diffs': time_diffs,
                'files': processed_files,
                'status': 'completed'
            }
            
            return session_result
            
        except Exception as e:
            logger.error(f"Error procesando sesión: {e}")
            return None

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
    processor = IntelligentProcessorV2(base_path, db_config)
    results = processor.run_full_analysis()
    
    # Mostrar resumen
    print("\n" + "="*60)
    print("RESUMEN DEL ANÁLISIS INTELIGENTE V2")
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

if __name__ == "__main__":
    main() 