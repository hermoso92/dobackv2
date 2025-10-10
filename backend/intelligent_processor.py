#!/usr/bin/env python3
"""
Procesador Inteligente de Archivos Doback
=========================================

Este procesador:
1. Analiza cada archivo individualmente para determinar su calidad
2. Agrupa archivos en sesiones coherentes basándose en tiempo y vehículo
3. Verifica que cada sesión tenga los 4 tipos de archivos con datos válidos
4. Procesa solo las sesiones completas y válidas
5. Se alinea con el procesamiento manual de la aplicación
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
import importlib.util

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('intelligent_processor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class FileAnalyzer:
    """Analiza la calidad y validez de archivos individuales"""
    
    def __init__(self):
        self.min_valid_lines = 10  # Mínimo de líneas válidas para considerar útil
        self.min_duration_minutes = 1.0  # Mínimo de duración para considerar útil
        
    def analyze_file(self, file_path: Path) -> Dict[str, Any]:
        """Analiza un archivo y retorna información detallada sobre su calidad"""
        try:
            # Información básica
            file_info = {
                'path': str(file_path),
                'size': file_path.stat().st_size,
                'exists': file_path.exists(),
                'valid': False,
                'quality_score': 0.0,
                'issues': [],
                'metadata': {}
            }
            
            if not file_path.exists():
                file_info['issues'].append('Archivo no existe')
                return file_info
                
            if file_path.stat().st_size == 0:
                file_info['issues'].append('Archivo vacío')
                return file_info
            
            # Parsear nombre del archivo
            parsed = self.parse_filename(file_path.name)
            if not parsed:
                file_info['issues'].append('Nombre de archivo no válido')
                return file_info
                
            file_info['metadata'] = parsed
            
            # Analizar contenido según tipo
            content_analysis = self.analyze_content(file_path, parsed['type'])
            file_info.update(content_analysis)
            
            # Calcular score de calidad
            file_info['quality_score'] = self.calculate_quality_score(file_info)
            file_info['valid'] = file_info['quality_score'] >= 0.7
            
            return file_info
            
        except Exception as e:
            logger.error(f"Error analizando {file_path}: {e}")
            return {
                'path': str(file_path),
                'valid': False,
                'issues': [f'Error de análisis: {str(e)}'],
                'quality_score': 0.0
            }
    
    def parse_filename(self, filename: str) -> Optional[Dict[str, Any]]:
        """Parsea el nombre del archivo para extraer metadatos"""
        try:
            # Patrones de nombres de archivo
            patterns = [
                # CAN_DOBACK027_20250708_0.txt
                r'^CAN_DOBACK(\d+)_(\d{8})_(\d+)\.txt$',
                # ESTABILIDAD_DOBACK027_20250708_0.txt
                r'^ESTABILIDAD_DOBACK(\d+)_(\d{8})_(\d+)\.txt$',
                # GPS_DOBACK027_20250708_0.txt
                r'^GPS_DOBACK(\d+)_(\d{8})_(\d+)\.txt$',
                # ROTATIVO_DOBACK027_20250708_0.txt
                r'^ROTATIVO_DOBACK(\d+)_(\d{8})_(\d+)\.txt$',
                # Archivos RealTime
                r'^(\w+)_DOBACK(\d+)_RealTime\.txt$'
            ]
            
            import re
            
            for pattern in patterns:
                match = re.match(pattern, filename)
                if match:
                    if 'RealTime' in filename:
                        return {
                            'type': 'REALTIME',
                            'vehicle': f"DOBACK{match.group(2)}",
                            'date': None,
                            'sequence': None,
                            'is_realtime': True
                        }
                    else:
                        vehicle = f"DOBACK{match.group(1)}"
                        date_str = match.group(2)
                        sequence = int(match.group(3))
                        
                        # Convertir fecha
                        date = datetime.strptime(date_str, '%Y%m%d')
                        
                        return {
                            'type': filename.split('_')[0],
                            'vehicle': vehicle,
                            'date': date,
                            'sequence': sequence,
                            'is_realtime': False
                        }
            
            return None
            
        except Exception as e:
            logger.error(f"Error parseando nombre {filename}: {e}")
            return None
    
    def analyze_content(self, file_path: Path, file_type: str) -> Dict[str, Any]:
        """Analiza el contenido del archivo según su tipo"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            
            total_lines = len(lines)
            header_lines = 0
            data_lines = 0
            valid_data_lines = 0
            invalid_data_lines = 0
            first_data_time = None
            last_data_time = None
            problems = []
            
            # Contar líneas por tipo
            for i, line in enumerate(lines):
                line = line.strip()
                if not line:
                    continue
                    
                # Detectar cabecera
                if line.startswith(file_type + ';') or 'Fecha-Hora' in line:
                    header_lines += 1
                    continue
                
                # Analizar línea de datos según tipo
                if self.is_valid_data_line(line, file_type):
                    data_lines += 1
                    
                    # Extraer timestamp si es posible
                    timestamp = self.extract_timestamp(line, file_type)
                    if timestamp:
                        if not first_data_time:
                            first_data_time = timestamp
                        last_data_time = timestamp
                        valid_data_lines += 1
                    else:
                        invalid_data_lines += 1
                else:
                    invalid_data_lines += 1
            
            # Calcular duración
            duration_minutes = 0.0
            if first_data_time and last_data_time:
                duration = last_data_time - first_data_time
                duration_minutes = duration.total_seconds() / 60.0
            
            # Detectar problemas
            if total_lines == 0:
                problems.append('Archivo vacío')
            elif data_lines == 0:
                problems.append('Sin líneas de datos')
            elif valid_data_lines < self.min_valid_lines:
                problems.append(f'Pocos datos válidos ({valid_data_lines} líneas)')
            elif duration_minutes < self.min_duration_minutes:
                problems.append(f'Sesión muy corta ({duration_minutes:.1f} minutos)')
            
            return {
                'total_lines': total_lines,
                'header_lines': header_lines,
                'data_lines': data_lines,
                'valid_data_lines': valid_data_lines,
                'invalid_data_lines': invalid_data_lines,
                'first_data_time': first_data_time,
                'last_data_time': last_data_time,
                'duration_minutes': duration_minutes,
                'problems': problems
            }
            
        except Exception as e:
            logger.error(f"Error analizando contenido de {file_path}: {e}")
            return {
                'total_lines': 0,
                'header_lines': 0,
                'data_lines': 0,
                'valid_data_lines': 0,
                'invalid_data_lines': 0,
                'problems': [f'Error leyendo archivo: {str(e)}']
            }
    
    def is_valid_data_line(self, line: str, file_type: str) -> bool:
        """Determina si una línea contiene datos válidos según el tipo de archivo"""
        if not line or line.startswith('#'):
            return False
            
        if file_type == 'CAN':
            # Formato: "08/07/2025 07:41:12AM   can0  0CF00400   [8]  F0 7D 84 59 16 FF FF 85"
            return 'can0' in line and '[' in line and ']' in line
        elif file_type == 'ESTABILIDAD':
            # Formato: "2025-07-08 07:41:12,1.234,5.678,9.012"
            return ',' in line and len(line.split(',')) >= 3
        elif file_type == 'GPS':
            # Formato: "2025-07-08 07:41:12,40.4168,-3.7038,123.45"
            return ',' in line and len(line.split(',')) >= 3
        elif file_type == 'ROTATIVO':
            # Formato: "2025-07-08 07:41:12,1"
            return ',' in line and len(line.split(',')) >= 2
        
        return False
    
    def extract_timestamp(self, line: str, file_type: str) -> Optional[datetime]:
        """Extrae el timestamp de una línea de datos"""
        try:
            if file_type == 'CAN':
                # "08/07/2025 07:41:12AM   can0  0CF00400   [8]  F0 7D 84 59 16 FF FF 85"
                parts = line.split()
                if len(parts) >= 2:
                    timestamp_str = f"{parts[0]} {parts[1]}"
                    return datetime.strptime(timestamp_str, '%m/%d/%Y %I:%M:%S%p')
            else:
                # "2025-07-08 07:41:12,data..."
                timestamp_str = line.split(',')[0]
                return datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
        except:
            return None
    
    def calculate_quality_score(self, file_info: Dict[str, Any]) -> float:
        """Calcula un score de calidad del archivo (0.0 a 1.0)"""
        score = 1.0
        
        # Penalizar por problemas
        for problem in file_info.get('problems', []):
            if 'vacío' in problem.lower():
                score -= 1.0
            elif 'sin datos' in problem.lower():
                score -= 0.8
            elif 'pocos datos' in problem.lower():
                score -= 0.3
            elif 'muy corta' in problem.lower():
                score -= 0.2
        
        # Bonus por datos válidos
        valid_lines = file_info.get('valid_data_lines', 0)
        if valid_lines > 100:
            score += 0.1
        elif valid_lines > 50:
            score += 0.05
        
        # Bonus por duración
        duration = file_info.get('duration_minutes', 0)
        if duration > 10:
            score += 0.1
        elif duration > 5:
            score += 0.05
        
        return max(0.0, min(1.0, score))

class SessionGrouper:
    """Agrupa archivos válidos en sesiones coherentes"""
    
    def __init__(self, time_window_minutes: int = 30):
        self.time_window = timedelta(minutes=time_window_minutes)
    
    def group_files_into_sessions(self, valid_files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Agrupa archivos válidos en sesiones basándose en tiempo y vehículo"""
        sessions = []
        
        # Agrupar por vehículo
        by_vehicle = {}
        for file_info in valid_files:
            vehicle = file_info['metadata']['vehicle']
            if vehicle not in by_vehicle:
                by_vehicle[vehicle] = []
            by_vehicle[vehicle].append(file_info)
        
        # Para cada vehículo, agrupar por tiempo
        for vehicle, files in by_vehicle.items():
            vehicle_sessions = self.group_by_time(vehicle, files)
            sessions.extend(vehicle_sessions)
        
        return sessions
    
    def group_by_time(self, vehicle: str, files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Agrupa archivos de un vehículo por ventana de tiempo"""
        sessions = []
        
        # Ordenar por tiempo de inicio
        files_with_time = []
        for file_info in files:
            if file_info.get('first_data_time'):
                files_with_time.append(file_info)
        
        files_with_time.sort(key=lambda x: x['first_data_time'])
        
        current_session = None
        
        for file_info in files_with_time:
            file_time = file_info['first_data_time']
            
            if current_session is None:
                # Iniciar nueva sesión
                current_session = {
                    'vehicle': vehicle,
                    'start_time': file_time,
                    'end_time': file_info.get('last_data_time', file_time),
                    'files': [file_info],
                    'types': {file_info['metadata']['type']: file_info}
                }
            else:
                # Verificar si está dentro de la ventana de tiempo
                time_diff = abs((file_time - current_session['start_time']).total_seconds() / 60)
                
                if time_diff <= self.time_window.total_seconds() / 60:
                    # Agregar a sesión actual
                    current_session['files'].append(file_info)
                    current_session['types'][file_info['metadata']['type']] = file_info
                    current_session['end_time'] = max(
                        current_session['end_time'],
                        file_info.get('last_data_time', file_time)
                    )
                else:
                    # Finalizar sesión actual y crear nueva
                    if self.is_complete_session(current_session):
                        sessions.append(current_session)
                    
                    current_session = {
                        'vehicle': vehicle,
                        'start_time': file_time,
                        'end_time': file_info.get('last_data_time', file_time),
                        'files': [file_info],
                        'types': {file_info['metadata']['type']: file_info}
                    }
        
        # Agregar última sesión si está completa
        if current_session and self.is_complete_session(current_session):
            sessions.append(current_session)
        
        return sessions
    
    def is_complete_session(self, session: Dict[str, Any]) -> bool:
        """Verifica si una sesión tiene todos los tipos de archivos necesarios"""
        required_types = {'CAN', 'ESTABILIDAD', 'GPS', 'ROTATIVO'}
        session_types = set(session['types'].keys())
        
        return required_types.issubset(session_types)

class IntelligentProcessor:
    """Procesador inteligente principal"""
    
    def __init__(self, base_path: Path, db_config: Dict[str, str]):
        self.base_path = Path(base_path)
        self.db_config = db_config
        self.analyzer = FileAnalyzer()
        self.grouper = SessionGrouper()
        
        # Cargar decodificador CAN
        self.can_decoder = self.load_can_decoder()
    
    def load_can_decoder(self):
        """Carga el decodificador CAN"""
        try:
            decoder_path = Path(__file__).parent / 'data' / 'DECODIFICADOR CAN' / 'decodificador_can_unificado.py'
            if decoder_path.exists():
                spec = importlib.util.spec_from_file_location("decodificador_can_unificado", str(decoder_path))
                decoder_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(decoder_module)
                return decoder_module.DecodificadorCAN()
            else:
                logger.error("Decodificador CAN no encontrado")
                return None
        except Exception as e:
            logger.error(f"Error cargando decodificador CAN: {e}")
            return None
    
    def scan_all_files(self) -> List[Path]:
        """Escanea todos los archivos en la estructura de datos"""
        all_files = []
        
        for company_dir in self.base_path.iterdir():
            if company_dir.is_dir():
                for vehicle_dir in company_dir.iterdir():
                    if vehicle_dir.is_dir():
                        for type_dir in vehicle_dir.iterdir():
                            if type_dir.is_dir():
                                for file_path in type_dir.glob('*.txt'):
                                    all_files.append(file_path)
        
        return all_files
    
    def analyze_all_files(self, files: List[Path]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Analiza todos los archivos y retorna estadísticas"""
        logger.info(f"Analizando {len(files)} archivos...")
        
        valid_files = []
        stats = {
            'total_files': len(files),
            'valid_files': 0,
            'invalid_files': 0,
            'by_type': {},
            'by_vehicle': {},
            'quality_distribution': {'excellent': 0, 'good': 0, 'poor': 0, 'invalid': 0}
        }
        
        for i, file_path in enumerate(files):
            if i % 10 == 0:
                logger.info(f"Progreso: {i}/{len(files)} archivos analizados")
            
            file_info = self.analyzer.analyze_file(file_path)
            
            if file_info['valid']:
                valid_files.append(file_info)
                stats['valid_files'] += 1
                
                # Estadísticas por tipo
                file_type = file_info['metadata']['type']
                if file_type not in stats['by_type']:
                    stats['by_type'][file_type] = 0
                stats['by_type'][file_type] += 1
                
                # Estadísticas por vehículo
                vehicle = file_info['metadata']['vehicle']
                if vehicle not in stats['by_vehicle']:
                    stats['by_vehicle'][vehicle] = 0
                stats['by_vehicle'][vehicle] += 1
                
                # Distribución de calidad
                score = file_info['quality_score']
                if score >= 0.9:
                    stats['quality_distribution']['excellent'] += 1
                elif score >= 0.7:
                    stats['quality_distribution']['good'] += 1
                else:
                    stats['quality_distribution']['poor'] += 1
            else:
                stats['invalid_files'] += 1
                stats['quality_distribution']['invalid'] += 1
        
        logger.info(f"Análisis completado: {stats['valid_files']} archivos válidos de {stats['total_files']}")
        return valid_files, stats
    
    def decode_can_files(self, valid_files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Decodifica archivos CAN válidos"""
        if not self.can_decoder:
            logger.warning("Decodificador CAN no disponible, saltando decodificación")
            return valid_files
        
        logger.info("Decodificando archivos CAN...")
        
        for file_info in valid_files:
            if file_info['metadata']['type'] == 'CAN':
                try:
                    file_path = Path(file_info['path'])
                    success = self.can_decoder.procesar_archivo(str(file_path))
                    
                    if success:
                        # Buscar archivo traducido
                        translated_path = file_path.with_suffix('').with_suffix('_TRADUCIDO.csv')
                        if translated_path.exists():
                            file_info['can_decoded'] = True
                            file_info['translated_path'] = str(translated_path)
                            logger.info(f"CAN decodificado exitosamente: {file_path.name}")
                        else:
                            file_info['can_decoded'] = False
                            logger.warning(f"Archivo CAN procesado pero no se encontró traducción: {file_path.name}")
                    else:
                        file_info['can_decoded'] = False
                        logger.warning(f"Error decodificando CAN: {file_path.name}")
                        
                except Exception as e:
                    file_info['can_decoded'] = False
                    logger.error(f"Error procesando CAN {file_info['path']}: {e}")
        
        return valid_files
    
    def group_into_sessions(self, valid_files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Agrupa archivos válidos en sesiones coherentes"""
        logger.info("Agrupando archivos en sesiones...")
        
        sessions = group_files_into_sessions(valid_files, time_window_minutes=120)
        
        logger.info(f"Se encontraron {len(sessions)} sesiones completas")
        
        # Log detallado de sesiones
        for i, session in enumerate(sessions):
            logger.info(f"Sesion {i+1}: {session['vehicle']} - {session['date']}")
            logger.info(f"  CAN: {Path(session['files']['CAN']['path']).name}")
            logger.info(f"  GPS: {Path(session['files']['GPS']['path']).name}")
            logger.info(f"  ESTABILIDAD: {Path(session['files']['ESTABILIDAD']['path']).name}")
            logger.info(f"  ROTATIVO: {Path(session['files']['ROTATIVO']['path']).name}")
        
        return sessions
    
    def process_sessions(self, sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Procesa las sesiones completas (aquí se integraría con el procesador existente)"""
        logger.info(f"Procesando {len(sessions)} sesiones completas...")
        
        results = {
            'sessions_processed': 0,
            'sessions_failed': 0,
            'errors': []
        }
        
        for session in sessions:
            try:
                # Aquí se integraría con el procesador existente
                # Por ahora solo loggeamos la información
                logger.info(f"Procesando sesión: {session['vehicle']} - {session['start_time']}")
                
                # Verificar que todos los archivos CAN estén decodificados
                can_file = session['files'].get('CAN')
                if can_file:
                    # Verificar si existe el archivo traducido
                    can_path = Path(can_file['path'])
                    translated_path = can_path.parent / f"{can_path.stem}_TRADUCIDO.csv"
                    if not translated_path.exists():
                        logger.warning(f"Sesión {session['vehicle']} - CAN no decodificado, saltando")
                        results['sessions_failed'] += 1
                        continue
                    # Marcar como decodificado
                    can_file['can_decoded'] = True
                
                # Integrar con procesador existente
                success = self.process_session_with_existing_processor(session)
                if success:
                    results['sessions_processed'] += 1
                else:
                    results['sessions_failed'] += 1
                
            except Exception as e:
                logger.error(f"Error procesando sesión {session['vehicle']}: {e}")
                results['sessions_failed'] += 1
                results['errors'].append(str(e))
        
        return results
    
    def process_session_with_existing_processor(self, session: Dict[str, Any]) -> bool:
        """Procesa una sesión usando el procesador existente"""
        try:
            # Importar el procesador existente
            from processors.postgres_processor import PostgresProcessor, SessionGroup, FileInfo
            
            # Crear instancia del procesador
            processor = PostgresProcessor()
            
            # Convertir la sesión al formato esperado por PostgresProcessor
            session_group = self.convert_session_to_group(session)
            
            # Procesar la sesión
            success = processor.process_session(session_group)
            
            if success:
                logger.info(f"Sesión {session['vehicle']} procesada exitosamente")
            else:
                logger.error(f"Error procesando sesión {session['vehicle']}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error en process_session_with_existing_processor: {e}")
            return False
    
    def convert_session_to_group(self, session: Dict[str, Any]) -> 'SessionGroup':
        """Convierte una sesión del formato inteligente al formato del procesador existente"""
        from processors.postgres_processor import SessionGroup, FileInfo
        
        # Extraer información de la sesión
        vehicle = session['vehicle']
        date = session['date']
        
        # Determinar la empresa (asumimos CMadrid por ahora)
        company = "CMadrid"
        
        # Convertir archivos al formato FileInfo
        files = {}
        for file_type, file_info in session['files'].items():
            file_path = Path(file_info['path'])
            
            # Crear FileInfo
            file_info_obj = FileInfo(
                path=file_path,
                company=company,
                vehicle=vehicle,
                date=date,
                sequence=0,  # Por defecto
                file_type=file_type
            )
            
            files[file_type] = file_info_obj
        
        # Crear SessionGroup
        session_group = SessionGroup(
            company=company,
            vehicle=vehicle,
            date=date,
            files=files
        )
        
        return session_group
    
    def run_full_analysis(self) -> Dict[str, Any]:
        """Ejecuta el análisis completo"""
        logger.info("Iniciando análisis inteligente completo...")
        
        # 1. Escanear archivos
        files = self.scan_all_files()
        logger.info(f"Encontrados {len(files)} archivos")
        
        # 2. Analizar archivos
        valid_files, analysis_stats = self.analyze_all_files(files)
        
        # 3. Decodificar archivos CAN
        valid_files = self.decode_can_files(valid_files)
        
        # 4. Agrupar en sesiones
        sessions = self.group_into_sessions(valid_files)
        
        # 5. Procesar sesiones
        processing_results = self.process_sessions(sessions)
        
        # 6. Generar reporte final
        final_report = {
            'timestamp': datetime.now().isoformat(),
            'analysis_stats': analysis_stats,
            'sessions_found': len(sessions),
            'processing_results': processing_results,
            'summary': {
                'total_files': analysis_stats['total_files'],
                'valid_files': analysis_stats['valid_files'],
                'complete_sessions': len(sessions),
                'sessions_processed': processing_results['sessions_processed'],
                'sessions_failed': processing_results['sessions_failed']
            }
        }
        
        # Guardar reporte
        report_path = Path('intelligent_analysis_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(final_report, f, indent=2, default=str)
        
        logger.info(f"Análisis completado. Reporte guardado en: {report_path}")

        cross = cross_analysis_by_vehicle_and_date(valid_files)
        with open('cross_analysis_report.json', 'w', encoding='utf-8') as f:
            json.dump(cross, f, indent=2, default=str)
        logger.info(f"Reporte cruzado guardado en: cross_analysis_report.json")

        return final_report

def cross_analysis_by_vehicle_and_date(valid_files: list) -> dict:
    """Analiza por vehículo y fecha cuántos archivos válidos hay de cada tipo y qué falta para sesiones completas."""
    from collections import defaultdict
    summary = defaultdict(lambda: defaultdict(lambda: {'CAN': 0, 'GPS': 0, 'ESTABILIDAD': 0, 'ROTATIVO': 0, 'archivos': {}}))
    for f in valid_files:
        meta = f['metadata']
        if not meta.get('date'):
            continue
        veh = meta['vehicle']
        fecha = meta['date'].strftime('%Y-%m-%d')
        tipo = meta['type']
        summary[veh][fecha][tipo] += 1
        summary[veh][fecha]['archivos'][tipo] = f['path']
    # Detectar bloqueos
    bloqueos = []
    for veh, fechas in summary.items():
        for fecha, tipos in fechas.items():
            faltan = [t for t in ['CAN','GPS','ESTABILIDAD','ROTATIVO'] if tipos[t] == 0]
            if faltan:
                bloqueos.append({
                    'vehiculo': veh,
                    'fecha': fecha,
                    'faltan': faltan,
                    'presentes': {k: v for k, v in tipos.items() if k in ['CAN','GPS','ESTABILIDAD','ROTATIVO']},
                    'archivos': tipos['archivos']
                })
    return {'summary': summary, 'bloqueos': bloqueos}

def group_files_into_sessions(valid_files: list, time_window_minutes: int = 120) -> list:
    """Agrupa archivos válidos en sesiones completas basándose en vehículo y tiempo."""
    sessions = []
    
    # Agrupar por vehículo y fecha
    vehicle_date_groups = {}
    for file_info in valid_files:
        metadata = file_info['metadata']
        vehicle = metadata['vehicle']
        date = metadata.get('date')
        if not date:
            continue  # Saltar archivos sin fecha válida
        date_str = date.strftime('%Y-%m-%d')
        key = f"{vehicle}_{date_str}"
        
        if key not in vehicle_date_groups:
            vehicle_date_groups[key] = []
        vehicle_date_groups[key].append(file_info)
    
    # Para cada grupo, intentar formar sesiones
    for group_key, files in vehicle_date_groups.items():
        logger.info(f"Analizando grupo: {group_key} con {len(files)} archivos")
        
        # Agrupar por tipo
        files_by_type = {'CAN': [], 'GPS': [], 'ESTABILIDAD': [], 'ROTATIVO': []}
        for file_info in files:
            file_type = file_info['metadata']['type']
            if file_type in files_by_type:
                files_by_type[file_type].append(file_info)
        
        # Verificar que tenemos al menos un archivo de cada tipo
        missing_types = [tipo for tipo, archivos in files_by_type.items() if len(archivos) == 0]
        if missing_types:
            logger.info(f"  [ERROR] Faltan tipos: {missing_types}")
            continue
        
        logger.info(f"  [OK] Todos los tipos presentes: CAN({len(files_by_type['CAN'])}), GPS({len(files_by_type['GPS'])}), ESTABILIDAD({len(files_by_type['ESTABILIDAD'])}), ROTATIVO({len(files_by_type['ROTATIVO'])})")
        
        # Crear todas las combinaciones posibles de archivos
        time_window = timedelta(minutes=time_window_minutes)
        used_files = set()  # Conjunto para rastrear archivos ya usados
        
        # Ordenar archivos por tiempo
        can_files = sorted(files_by_type['CAN'], key=lambda x: x['metadata']['date'])
        gps_files = sorted(files_by_type['GPS'], key=lambda x: x['metadata']['date'])
        estabilidad_files = sorted(files_by_type['ESTABILIDAD'], key=lambda x: x['metadata']['date'])
        rotativo_files = sorted(files_by_type['ROTATIVO'], key=lambda x: x['metadata']['date'])
        
        # Para cada archivo CAN, buscar la mejor combinación de otros archivos
        for can_file in can_files:
            can_time = can_file['metadata']['date']
            can_path = str(can_file['path'])
            
            # Verificar que el archivo CAN no haya sido usado
            if can_path in used_files:
                continue
            
            # Buscar la mejor combinación de archivos para este CAN
            best_session = None
            best_score = -1
            
            # Probar diferentes combinaciones de GPS, ESTABILIDAD y ROTATIVO
            for gps_file in gps_files:
                gps_path = str(gps_file['path'])
                if gps_path in used_files:
                    continue
                    
                for estabilidad_file in estabilidad_files:
                    estabilidad_path = str(estabilidad_file['path'])
                    if estabilidad_path in used_files:
                        continue
                        
                    for rotativo_file in rotativo_files:
                        rotativo_path = str(rotativo_file['path'])
                        if rotativo_path in used_files:
                            continue
                        
                        # Verificar que todos los archivos estén dentro de la ventana temporal
                        gps_time = gps_file['metadata']['date']
                        estabilidad_time = estabilidad_file['metadata']['date']
                        rotativo_time = rotativo_file['metadata']['date']
                        
                        # Calcular la diferencia máxima de tiempo
                        max_time_diff = max(
                            abs((gps_time - can_time).total_seconds()),
                            abs((estabilidad_time - can_time).total_seconds()),
                            abs((rotativo_time - can_time).total_seconds())
                        )
                        
                        # Si todos están dentro de la ventana temporal, calcular score
                        if max_time_diff <= time_window.total_seconds():
                            # Score basado en proximidad temporal (menor diferencia = mejor score)
                            time_score = 1.0 / (1.0 + max_time_diff / 60.0)  # Normalizar a minutos
                            
                            if time_score > best_score:
                                best_score = time_score
                                best_session = {
                                    'vehicle': can_file['metadata']['vehicle'],
                                    'date': can_file['metadata']['date'],
                                    'start_time': can_time,
                                    'end_time': max(can_time, gps_time, estabilidad_time, rotativo_time),
                                    'files': {
                                        'CAN': can_file,
                                        'GPS': gps_file,
                                        'ESTABILIDAD': estabilidad_file,
                                        'ROTATIVO': rotativo_file
                                    },
                                    'can_time': can_time,
                                    'gps_time': gps_time,
                                    'estabilidad_time': estabilidad_time,
                                    'rotativo_time': rotativo_time,
                                    'score': time_score
                                }
            
            # Si encontramos una sesión válida, agregarla y marcar archivos como usados
            if best_session:
                logger.info(f"    [OK] Sesión completa encontrada (score: {best_session['score']:.3f}):")
                logger.info(f"      CAN: {Path(best_session['files']['CAN']['path']).name} ({best_session['can_time']})")
                logger.info(f"      GPS: {Path(best_session['files']['GPS']['path']).name} ({best_session['gps_time']})")
                logger.info(f"      ESTABILIDAD: {Path(best_session['files']['ESTABILIDAD']['path']).name} ({best_session['estabilidad_time']})")
                logger.info(f"      ROTATIVO: {Path(best_session['files']['ROTATIVO']['path']).name} ({best_session['rotativo_time']})")
                
                # Marcar archivos como usados
                used_files.add(str(best_session['files']['CAN']['path']))
                used_files.add(str(best_session['files']['GPS']['path']))
                used_files.add(str(best_session['files']['ESTABILIDAD']['path']))
                used_files.add(str(best_session['files']['ROTATIVO']['path']))
                
                sessions.append(best_session)
            else:
                logger.info(f"    [ERROR] No se pudo formar sesión para CAN {Path(can_file['path']).name}")
    
    return sessions

def main():
    """Función principal"""
    # Configuración de base de datos (usar la misma que el procesador existente)
    db_config = {
        'host': 'localhost',
        'database': 'dobacksoft',
        'user': 'postgres',
        'password': 'postgres'
    }
    
    # Ruta base de datos
    base_path = Path(__file__).parent / 'data' / 'datosDoback'
    
    # Crear y ejecutar procesador
    processor = IntelligentProcessor(base_path, db_config)
    results = processor.run_full_analysis()
    
    # Mostrar resumen
    print("\n" + "="*60)
    print("RESUMEN DEL ANÁLISIS INTELIGENTE")
    print("="*60)
    print(f"Total archivos: {results['summary']['total_files']}")
    print(f"Archivos válidos: {results['summary']['valid_files']}")
    print(f"Sesiones completas encontradas: {results['summary']['complete_sessions']}")
    print(f"Sesiones procesadas: {results['summary']['sessions_processed']}")
    print(f"Sesiones fallidas: {results['summary']['sessions_failed']}")
    print("="*60)

if __name__ == "__main__":
    main() 