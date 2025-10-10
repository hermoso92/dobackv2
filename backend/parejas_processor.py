#!/usr/bin/env python3
"""
Procesador de Parejas - Doback Soft
Algoritmo del juego de las parejas para encontrar TODAS las combinaciones posibles
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
                    return dt
            
            # Si no se encuentra en cabecera, buscar en el contenido
            for i, line in enumerate(lines):
                if i > 100:  # Limitar búsqueda a las primeras 100 líneas
                    break
                dt = self._extract_datetime_from_line(line)
                if dt:
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

class ParejasMatcher:
    """Encuentra TODAS las combinaciones posibles usando el algoritmo de parejas"""
    
    def __init__(self):
        self.analyzer = FileContentAnalyzer()
    
    def find_all_possible_sessions(self, base_path: Path) -> List[Dict[str, Any]]:
        """Encuentra TODAS las sesiones posibles sin restricción de tolerancia temporal"""
        all_sessions = []
        
        # Escanear todos los archivos
        all_files = self._scan_all_files(base_path)
        logger.info(f"Escaneados {len(all_files)} archivos totales")
        
        # Agrupar por vehículo
        files_by_vehicle = defaultdict(lambda: defaultdict(list))
        for file_info in all_files:
            vehicle = file_info['vehicle']
            file_type = file_info['type']
            files_by_vehicle[vehicle][file_type].append(file_info)
        
        # Para cada vehículo, encontrar TODAS las combinaciones posibles
        for vehicle, type_files in files_by_vehicle.items():
            logger.info(f"Analizando vehículo: {vehicle}")
            vehicle_sessions = self._find_all_sessions_for_vehicle(vehicle, type_files)
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
        all_combinations = self._generate_all_combinations(type_files)
        logger.info(f"  Generadas {len(all_combinations)} combinaciones posibles")
        
        # Evaluar cada combinación
        for i, combination in enumerate(all_combinations, 1):
            session = self._evaluate_combination(combination, i)
            if session:
                sessions.append(session)
                logger.info(f"    ✅ Sesión {i} encontrada:")
                logger.info(f"      CAN: {session['files']['CAN']['filename']} ({session['files']['CAN']['real_datetime']})")
                logger.info(f"      GPS: {session['files']['GPS']['filename']} ({session['files']['GPS']['real_datetime']})")
                logger.info(f"      ESTABILIDAD: {session['files']['ESTABILIDAD']['filename']} ({session['files']['ESTABILIDAD']['real_datetime']})")
                logger.info(f"      ROTATIVO: {session['files']['ROTATIVO']['filename']} ({session['files']['ROTATIVO']['real_datetime']})")
                logger.info(f"      Score: {session['score']:.3f}")
        
        return sessions
    
    def _generate_all_combinations(self, type_files: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Genera TODAS las combinaciones posibles de archivos"""
        combinations_list = []
        
        # Para cada archivo CAN, probar con TODOS los archivos GPS, ESTABILIDAD y ROTATIVO
        for can_file in type_files['CAN']:
            for gps_file in type_files['GPS']:
                for estabilidad_file in type_files['ESTABILIDAD']:
                    for rotativo_file in type_files['ROTATIVO']:
                        combination = {
                            'CAN': can_file,
                            'GPS': gps_file,
                            'ESTABILIDAD': estabilidad_file,
                            'ROTATIVO': rotativo_file
                        }
                        combinations_list.append(combination)
        
        return combinations_list
    
    def _evaluate_combination(self, combination: Dict[str, Any], session_number: int) -> Optional[Dict[str, Any]]:
        """Evalúa una combinación y calcula su score"""
        can_time = combination['CAN']['real_datetime']
        gps_time = combination['GPS']['real_datetime']
        estabilidad_time = combination['ESTABILIDAD']['real_datetime']
        rotativo_time = combination['ROTATIVO']['real_datetime']
        
        # Calcular diferencias en minutos
        gps_diff = abs((gps_time - can_time).total_seconds() / 60)
        estabilidad_diff = abs((estabilidad_time - can_time).total_seconds() / 60)
        rotativo_diff = abs((rotativo_time - can_time).total_seconds() / 60)
        
        # Para archivos ROTATIVO que solo tienen fecha (00:00:00), verificar fecha
        if rotativo_time.hour == 0 and rotativo_time.minute == 0 and rotativo_time.second == 0:
            if rotativo_time.date() == can_time.date():
                rotativo_diff = 0  # Considerar como coincidente
            else:
                return None  # Fechas diferentes, descartar
        
        # Calcular score (menor diferencia = mejor score)
        total_diff = gps_diff + estabilidad_diff + rotativo_diff
        score = 1.0 / (1.0 + total_diff / 10.0)  # Normalizar
        
        return {
            'session_number': session_number,
            'vehicle': combination['CAN']['vehicle'],
            'date': combination['CAN']['date'],
            'start_time': can_time,
            'end_time': max(can_time, gps_time, estabilidad_time, rotativo_time),
            'files': combination,
            'score': score,
            'time_diffs': {
                'gps_diff': gps_diff,
                'estabilidad_diff': estabilidad_diff,
                'rotativo_diff': rotativo_diff
            }
        }

class ParejasProcessor:
    """Procesador de parejas que encuentra TODAS las combinaciones posibles"""
    
    def __init__(self, base_path: Path, db_config: Dict[str, str]):
        self.base_path = base_path
        self.db_config = db_config
        self.parejas_matcher = ParejasMatcher()
    
    def run_full_analysis(self) -> Dict[str, Any]:
        """Ejecuta el análisis completo usando el algoritmo de parejas"""
        logger.info("🚀 Iniciando análisis de parejas (TODAS las combinaciones)...")
        
        # 1. Encontrar TODAS las sesiones posibles
        logger.info("📋 Buscando TODAS las combinaciones posibles...")
        all_sessions = self.parejas_matcher.find_all_possible_sessions(self.base_path)
        
        logger.info(f"✅ Encontradas {len(all_sessions)} sesiones posibles")
        
        # 2. Ordenar por score (mejor primero)
        all_sessions.sort(key=lambda x: x['score'], reverse=True)
        
        # 3. Generar reporte detallado
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_sessions_found': len(all_sessions),
            'sessions': []
        }
        
        for session in all_sessions:
            session_info = {
                'session_number': session['session_number'],
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
        
        # 4. Guardar reporte
        report_path = Path('parejas_analysis_report.json')
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
    processor = ParejasProcessor(base_path, db_config)
    results = processor.run_full_analysis()
    
    # Mostrar resumen
    print("\n" + "="*60)
    print("RESUMEN DEL ANÁLISIS DE PAREJAS (TODAS LAS COMBINACIONES)")
    print("="*60)
    print(f"Sesiones posibles encontradas: {results['total_sessions_found']}")
    print("="*60)
    
    if results['sessions']:
        print("\nMEJORES SESIONES (ordenadas por score):")
        for i, session in enumerate(results['sessions'][:10], 1):  # Mostrar solo las 10 mejores
            print(f"\n{i}. Sesión {session['session_number']}: {session['vehicle']} - {session['date']}")
            print(f"   Score: {session['score']:.3f}")
            print(f"   Diferencias temporales (minutos):")
            print(f"     GPS: {session['time_diffs']['gps_diff']:.1f}")
            print(f"     ESTABILIDAD: {session['time_diffs']['estabilidad_diff']:.1f}")
            print(f"     ROTATIVO: {session['time_diffs']['rotativo_diff']:.1f}")
            print(f"   Archivos:")
            for file_type, filename in session['files'].items():
                print(f"     {file_type}: {filename}")
        
        if len(results['sessions']) > 10:
            print(f"\n... y {len(results['sessions']) - 10} sesiones más")
    else:
        print("\n❌ No se encontraron sesiones")

if __name__ == "__main__":
    main() 