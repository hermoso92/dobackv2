#!/usr/bin/env python3
"""
Buscador Completo de Sesiones - Doback Soft
Encuentra TODAS las sesiones completas posibles, ordenadas por proximidad temporal
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
            if file_type in ['GPS', 'ESTABILIDAD'] and ('fecha' in l and 'hora' in l):
                return idx + 1
            if file_type == 'ROTATIVO' and ('fecha-hora' in l):
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
        for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S.%f", "%d/%m/%Y %H:%M:%S", "%d-%m-%Y %H:%M:%S", "%d/%m/%Y %I:%M:%S%p"]:
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

class ComprehensiveSessionFinder:
    """Encuentra TODAS las sesiones completas posibles, ordenadas por proximidad temporal"""
    
    def __init__(self):
        self.analyzer = FileContentAnalyzer()
    
    def find_all_complete_sessions(self, base_path: Path) -> List[Dict[str, Any]]:
        """Encuentra TODAS las sesiones completas posibles"""
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
        
        # Para cada vehículo, encontrar TODAS las sesiones posibles
        for vehicle, type_files in files_by_vehicle.items():
            logger.info(f"Analizando vehículo: {vehicle}")
            vehicle_sessions = self._find_all_sessions_for_vehicle(vehicle, type_files)
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
    
    def _find_all_sessions_for_vehicle(self, vehicle: str, type_files: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Encuentra TODAS las sesiones posibles para un vehículo"""
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
        
        # Generar TODAS las combinaciones posibles
        total_combinations = len(type_files['CAN']) * len(type_files['GPS']) * len(type_files['ESTABILIDAD']) * len(type_files['ROTATIVO'])
        logger.info(f"  Generando {total_combinations} combinaciones posibles...")
        
        combination_count = 0
        for can_file in type_files['CAN']:
            for gps_file in type_files['GPS']:
                for estabilidad_file in type_files['ESTABILIDAD']:
                    for rotativo_file in type_files['ROTATIVO']:
                        combination_count += 1
                        
                        # Calcular diferencias temporales
                        time_diffs = self._calculate_time_differences(
                            can_file['real_datetime'],
                            gps_file['real_datetime'],
                            estabilidad_file['real_datetime'],
                            rotativo_file['real_datetime']
                        )
                        
                        # Crear sesión (aceptar todas las combinaciones)
                        session = {
                            'vehicle': vehicle,
                            'date': can_file['date'],
                            'start_time': can_file['real_datetime'],
                            'end_time': max(
                                can_file['real_datetime'],
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
                            'max_time_diff': time_diffs['max_diff'],
                            'time_diffs': time_diffs,
                            'combination_number': combination_count
                        }
                        
                        sessions.append(session)
                        
                        if combination_count % 1000 == 0:
                            logger.info(f"    Procesadas {combination_count}/{total_combinations} combinaciones...")
        
        logger.info(f"  Generadas {len(sessions)} sesiones completas para {vehicle}")
        return sessions
    
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

class ComprehensiveProcessor:
    """Procesador completo que encuentra todas las sesiones posibles"""
    
    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.session_finder = ComprehensiveSessionFinder()
    
    def run_comprehensive_analysis(self) -> Dict[str, Any]:
        """Ejecuta el análisis completo de todas las sesiones"""
        logger.info("🚀 Iniciando análisis completo de todas las sesiones posibles...")
        
        # 1. Encontrar todas las sesiones completas
        logger.info("📋 Buscando todas las sesiones completas posibles...")
        all_sessions = self.session_finder.find_all_complete_sessions(self.base_path)
        
        logger.info(f"✅ Encontradas {len(all_sessions)} sesiones completas totales")
        
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
                'combination_number': session['combination_number'],
                'files': {
                    'CAN': session['files']['CAN']['filename'],
                    'GPS': session['files']['GPS']['filename'],
                    'ESTABILIDAD': session['files']['ESTABILIDAD']['filename'],
                    'ROTATIVO': session['files']['ROTATIVO']['filename']
                }
            }
            report['sessions'].append(session_info)
        
        # 3. Guardar reporte
        report_path = Path('comprehensive_sessions_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"📊 Reporte guardado en: {report_path}")
        
        return report

def main():
    """Función principal"""
    # Ruta base de datos
    base_path = Path(__file__).parent / 'data' / 'datosDoback'
    
    # Crear y ejecutar procesador
    processor = ComprehensiveProcessor(base_path)
    results = processor.run_comprehensive_analysis()
    
    # Mostrar resumen
    print("\n" + "="*60)
    print("RESUMEN DEL ANÁLISIS COMPLETO DE SESIONES")
    print("="*60)
    print(f"Sesiones completas encontradas: {results['total_sessions_found']}")
    print("="*60)
    
    if results['sessions']:
        print("\nMEJORES SESIONES (ordenadas por proximidad temporal):")
        for i, session in enumerate(results['sessions'][:10], 1):  # Mostrar las 10 mejores
            print(f"\nSesión {i}: {session['vehicle']} - {session['date']}")
            print(f"  Máxima diferencia temporal: {session['max_time_diff']:.1f} min")
            print(f"  Diferencias individuales (minutos):")
            print(f"    GPS: {session['time_diffs']['gps_diff']:.1f}")
            print(f"    ESTABILIDAD: {session['time_diffs']['estabilidad_diff']:.1f}")
            print(f"    ROTATIVO: {session['time_diffs']['rotativo_diff']:.1f}")
            print(f"  Archivos:")
            for file_type, filename in session['files'].items():
                print(f"    {file_type}: {filename}")
        
        if len(results['sessions']) > 10:
            print(f"\n... y {len(results['sessions']) - 10} sesiones más")
    else:
        print("\n❌ No se encontraron sesiones completas")

if __name__ == "__main__":
    main() 