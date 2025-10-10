#!/usr/bin/env python3
"""
Analizador de debug para la sesión doback022_20250711_1
Analiza por qué estos 4 archivos no se reconocen como una sesión válida.
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import pandas as pd

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('session_debug.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

class SessionAnalyzer:
    def __init__(self):
        self.data_dir = "backend/data/datosDoback"
        self.session_files = {
            'GPS': 'CMadrid/doback022/GPS/GPS_DOBACK022_20250711_1.txt',
            'ESTABILIDAD': 'CMadrid/doback022/estabilidad/ESTABILIDAD_DOBACK022_20250711_1.txt',
            'ROTATIVO': 'CMadrid/doback022/ROTATIVO/ROTATIVO_DOBACK022_20250711_1.txt',
            'CAN': 'CMadrid/doback022/CAN/CAN_DOBACK022_20250711_1_TRADUCIDO.csv'
        }
    
    def analyze_session(self):
        """Analiza la sesión completa paso a paso."""
        logger.info("🔍 === ANÁLISIS DE SESIÓN DOBACK022_20250711_1 ===")
        
        # Paso 1: Verificar existencia de archivos
        self._check_files_existence()
        
        # Paso 2: Extraer rangos temporales
        file_info = self._extract_time_ranges()
        
        # Paso 3: Analizar compatibilidad temporal
        self._analyze_temporal_compatibility(file_info)
        
        # Paso 4: Simular lógica del procesador original
        self._simulate_original_processor(file_info)
        
        # Paso 5: Simular lógica del procesador mejorado
        self._simulate_improved_processor(file_info)
        
        # Paso 6: Recomendaciones
        self._provide_recommendations(file_info)
        
        logger.info("✅ === FIN DEL ANÁLISIS ===")
    
    def _check_files_existence(self):
        """Verifica que todos los archivos existan."""
        logger.info("📁 PASO 1: Verificando existencia de archivos...")
        
        all_exist = True
        for file_type, relative_path in self.session_files.items():
            full_path = os.path.join(self.data_dir, relative_path)
            exists = os.path.exists(full_path)
            size = os.path.getsize(full_path) if exists else 0
            
            logger.info(f"  {file_type}: {relative_path}")
            logger.info(f"    Existe: {'✅' if exists else '❌'}")
            logger.info(f"    Tamaño: {size:,} bytes")
            
            if not exists:
                all_exist = False
        
        if all_exist:
            logger.info("✅ Todos los archivos existen")
        else:
            logger.error("❌ Algunos archivos no existen")
    
    def _extract_time_ranges(self) -> Dict[str, Dict]:
        """Extrae rangos temporales de cada archivo."""
        logger.info("⏰ PASO 2: Extrayendo rangos temporales...")
        
        file_info = {}
        
        for file_type, relative_path in self.session_files.items():
            full_path = os.path.join(self.data_dir, relative_path)
            
            if not os.path.exists(full_path):
                continue
            
            try:
                start_time, end_time = self._extract_time_range_from_file(full_path, file_type)
                
                file_info[file_type] = {
                    'path': full_path,
                    'filename': os.path.basename(full_path),
                    'start_time': start_time,
                    'end_time': end_time,
                    'duration': (end_time - start_time).total_seconds() / 60 if start_time and end_time else None
                }
                
                logger.info(f"  {file_type}:")
                logger.info(f"    Inicio: {start_time}")
                logger.info(f"    Fin: {end_time}")
                logger.info(f"    Duración: {file_info[file_type]['duration']:.1f} minutos")
                
            except Exception as e:
                logger.error(f"  ❌ Error procesando {file_type}: {e}")
                file_info[file_type] = {'error': str(e)}
        
        return file_info
    
    def _extract_time_range_from_file(self, file_path: str, file_type: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        """Extrae el rango temporal de un archivo específico."""
        try:
            if file_type == 'GPS':
                return self._extract_gps_time_range(file_path)
            elif file_type == 'ESTABILIDAD':
                return self._extract_stability_time_range(file_path)
            elif file_type == 'ROTATIVO':
                return self._extract_rotativo_time_range(file_path)
            elif file_type == 'CAN':
                return self._extract_can_time_range(file_path)
            else:
                return None, None
        except Exception as e:
            logger.error(f"Error extrayendo tiempo de {file_path}: {e}")
            return None, None
    
    def _split_flexible(self, line: str):
        """Divide una línea por coma o punto y coma."""
        if ';' in line:
            return [x.strip() for x in line.split(';')]
        return [x.strip() for x in line.split(',')]

    def _clean_time(self, s: str) -> str:
        """Limpia puntos y ceros extra en los segundos."""
        s = s.replace('.', '')
        if len(s.split(':')) == 3:
            h, m, sec = s.split(':')
            sec = sec.zfill(2)
            return f"{h}:{m}:{sec}"
        return s

    def _extract_gps_time_range(self, file_path: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            if not lines:
                return None, None
            # Saltar cabecera y columnas
            for i, line in enumerate(lines):
                if line.lower().startswith('fecha'):
                    data_start = i + 1
                    break
            else:
                data_start = 1
            first_data = None
            last_data = None
            for line in lines[data_start:]:
                if not line.strip():
                    continue
                parts = self._split_flexible(line)
                if len(parts) >= 2:
                    try:
                        date_str = parts[0].replace('.', '').strip()
                        time_str = self._clean_time(parts[1])
                        if date_str and time_str and date_str != 'Fecha':
                            dt_str = f"{date_str} {time_str}"
                            dt = datetime.strptime(dt_str, '%d/%m/%Y %H:%M:%S')
                            if first_data is None:
                                first_data = dt
                            last_data = dt
                    except Exception:
                        continue
            
            # Aplicar corrección de offset GPS (+2 horas)
            if first_data and last_data:
                gps_offset_hours = 2
                first_data_corrected = first_data + timedelta(hours=gps_offset_hours)
                last_data_corrected = last_data + timedelta(hours=gps_offset_hours)
                logger.info(f"    🔧 Aplicando corrección GPS: +{gps_offset_hours} horas")
                logger.info(f"    Original: {first_data} - {last_data}")
                logger.info(f"    Corregido: {first_data_corrected} - {last_data_corrected}")
                return first_data_corrected, last_data_corrected
            
            return first_data, last_data
        except Exception as e:
            logger.error(f"Error procesando GPS {file_path}: {e}")
            return None, None

    def _extract_stability_time_range(self, file_path: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            if not lines:
                return None, None
            
            # Parsear fecha de la cabecera
            first_line = lines[0].strip()
            session_start = None
            if first_line.startswith('ESTABILIDAD;'):
                parts = self._split_flexible(first_line)
                if len(parts) >= 2:
                    date_str = parts[1].strip()
                    for fmt in ('%Y%m%d %H:%M:%S', '%d/%m/%Y %I:%M:%S%p', '%d/%m/%Y %H:%M:%S'):
                        try:
                            session_start = datetime.strptime(date_str, fmt)
                            break
                        except Exception:
                            continue
            
            # Buscar timestamps intercalados en el archivo
            timestamps = []
            for line in lines:
                line = line.strip()
                if line and ':' in line and ('AM' in line or 'PM' in line):
                    # Formato: 11:32:30AM
                    try:
                        # Asumir que es del mismo día que la sesión
                        if session_start:
                            time_str = line
                            date_str = session_start.strftime('%d/%m/%Y')
                            dt_str = f"{date_str} {time_str}"
                            dt = datetime.strptime(dt_str, '%d/%m/%Y %I:%M:%S%p')
                            timestamps.append(dt)
                    except Exception:
                        continue
            
            if timestamps:
                first_data = min(timestamps)
                last_data = max(timestamps)
            elif session_start:
                first_data = session_start
                last_data = session_start
            else:
                first_data = None
                last_data = None
            
            return first_data, last_data
        except Exception as e:
            logger.error(f"Error procesando ESTABILIDAD {file_path}: {e}")
            return None, None

    def _extract_rotativo_time_range(self, file_path: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            if not lines:
                return None, None
            # Buscar cabecera de columnas
            for i, line in enumerate(lines):
                if 'fecha' in line.lower() and 'estado' in line.lower():
                    data_start = i + 1
                    break
            else:
                data_start = 1
            first_data = None
            last_data = None
            for line in lines[data_start:]:
                if not line.strip():
                    continue
                parts = self._split_flexible(line)
                if len(parts) >= 1:
                    try:
                        date_str = parts[0].replace('.', '').strip()
                        if date_str and date_str != 'Fecha-Hora':
                            dt = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                            if first_data is None:
                                first_data = dt
                            last_data = dt
                    except Exception:
                        continue
            # Si no hay datos, intentar parsear la fecha de la primera línea
            if first_data is None:
                first_line = lines[0].strip()
                if first_line.startswith('ROTATIVO;'):
                    parts = self._split_flexible(first_line)
                    if len(parts) >= 2:
                        date_str = parts[1].strip()
                        for fmt in ('%Y%m%d %H:%M:%S', '%Y-%m-%d', '%d/%m/%Y'):
                            try:
                                first_data = datetime.strptime(date_str, fmt)
                                break
                            except Exception:
                                continue
            return first_data, last_data
        except Exception as e:
            logger.error(f"Error procesando ROTATIVO {file_path}: {e}")
            return None, None

    def _extract_can_time_range(self, file_path: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Buscar línea de cabecera CAN
            session_start = None
            for line in lines:
                if line.strip().startswith('CAN\t'):
                    parts = line.strip().split('\t')
                    if len(parts) >= 2:
                        date_str = parts[1].strip()
                        try:
                            session_start = datetime.strptime(date_str, '%d/%m/%Y %I:%M:%S%p')
                            break
                        except Exception:
                            continue
            
            # Buscar cabecera de columnas
            data_start = None
            for i, line in enumerate(lines):
                if 'Timestamp' in line and 'length' in line:
                    data_start = i + 1
                    break
            
            if data_start is None:
                return session_start, session_start
            
            first_data = None
            last_data = None
            
            for line in lines[data_start:]:
                if not line.strip():
                    continue
                parts = self._split_flexible(line)
                if len(parts) >= 1:
                    try:
                        date_str = parts[0].strip()
                        if date_str and 'AM' in date_str or 'PM' in date_str:
                            dt = datetime.strptime(date_str, '%d/%m/%Y %I:%M:%S%p')
                            if first_data is None:
                                first_data = dt
                            last_data = dt
                    except Exception:
                        continue
            
            # Si no se encontraron datos, usar la fecha de sesión
            if first_data is None and session_start:
                first_data = session_start
                last_data = session_start
            
            return first_data, last_data
        except Exception as e:
            logger.error(f"Error procesando CAN {file_path}: {e}")
            return None, None
    
    def _analyze_temporal_compatibility(self, file_info: Dict[str, Dict]):
        """Analiza la compatibilidad temporal entre archivos."""
        logger.info("🔗 PASO 3: Analizando compatibilidad temporal...")
        
        can_info = file_info.get('CAN', {})
        if 'start_time' not in can_info or 'end_time' not in can_info:
            logger.error("❌ No se pudo obtener rango temporal del archivo CAN")
            return
        
        can_start = can_info['start_time']
        can_end = can_info['end_time']
        
        logger.info(f"📊 Rango CAN: {can_start} a {can_end}")
        
        for file_type in ['GPS', 'ESTABILIDAD', 'ROTATIVO']:
            if file_type not in file_info or 'start_time' not in file_info[file_type]:
                logger.warning(f"  ❌ {file_type}: No se pudo obtener rango temporal")
                continue
            
            file_start = file_info[file_type]['start_time']
            file_end = file_info[file_type]['end_time']
            
            # Calcular diferencias
            start_diff = abs((can_start - file_start).total_seconds() / 60)
            end_diff = abs((can_end - file_end).total_seconds() / 60)
            
            # Verificar solapamiento
            overlap_start = max(can_start, file_start)
            overlap_end = min(can_end, file_end)
            overlap_minutes = (overlap_end - overlap_start).total_seconds() / 60 if overlap_end > overlap_start else 0
            
            logger.info(f"  {file_type}:")
            logger.info(f"    Rango: {file_start} a {file_end}")
            logger.info(f"    Diferencia inicio: {start_diff:.1f} minutos")
            logger.info(f"    Diferencia fin: {end_diff:.1f} minutos")
            logger.info(f"    Solapamiento: {overlap_minutes:.1f} minutos")
            logger.info(f"    Compatible: {'✅' if overlap_minutes > 0 else '❌'}")
    
    def _simulate_original_processor(self, file_info: Dict[str, Dict]):
        """Simula la lógica del procesador original."""
        logger.info("🔄 PASO 4: Simulando procesador original...")
        
        # Verificar que todos los tipos estén disponibles
        required_types = ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']
        available_types = [t for t in required_types if t in file_info and 'start_time' in file_info[t]]
        
        logger.info(f"  Tipos disponibles: {available_types}")
        logger.info(f"  Tipos requeridos: {required_types}")
        
        missing_types = [t for t in required_types if t not in available_types]
        if missing_types:
            logger.error(f"  ❌ FALTAN TIPOS: {missing_types}")
            logger.error("  ❌ PROCESADOR ORIGINAL RECHAZARÍA ESTA SESIÓN")
            return
        
        # Verificar solapamiento temporal
        can_info = file_info['CAN']
        can_start = can_info['start_time']
        can_end = can_info['end_time']
        
        session_files = {'CAN': can_info}
        found_types = 0
        
        for file_type in ['GPS', 'ESTABILIDAD', 'ROTATIVO']:
            file_info_type = file_info[file_type]
            file_start = file_info_type['start_time']
            file_end = file_info_type['end_time']
            
            # Calcular solapamiento
            latest_start = max(can_start, file_start)
            earliest_end = min(can_end, file_end)
            overlap = (earliest_end - latest_start).total_seconds()
            
            if overlap > 0:
                session_files[file_type] = file_info_type
                found_types += 1
                logger.info(f"  ✅ {file_type}: Solapamiento {overlap:.1f}s")
            else:
                logger.error(f"  ❌ {file_type}: Sin solapamiento")
        
        if found_types >= 2:
            logger.info(f"  ✅ PROCESADOR ORIGINAL ACEPTARÍA ESTA SESIÓN ({found_types} tipos)")
        else:
            logger.error(f"  ❌ PROCESADOR ORIGINAL RECHAZARÍA ESTA SESIÓN (solo {found_types} tipos)")
    
    def _simulate_improved_processor(self, file_info: Dict[str, Dict]):
        """Simula la lógica del procesador mejorado."""
        logger.info("🚀 PASO 5: Simulando procesador mejorado...")
        
        can_info = file_info.get('CAN', {})
        if 'start_time' not in can_info:
            logger.error("  ❌ No hay archivo CAN válido")
            return
        
        can_start = can_info['start_time']
        can_end = can_info['end_time']
        
        # Tolerancia de 15 minutos
        tolerance_seconds = 15 * 60
        session_files = {'CAN': can_info, 'GPS': None, 'ESTABILIDAD': None, 'ROTATIVO': None}
        
        for file_type in ['GPS', 'ESTABILIDAD', 'ROTATIVO']:
            if file_type not in file_info or 'start_time' not in file_info[file_type]:
                logger.info(f"  ⚠️  {file_type}: No disponible")
                continue
            
            file_info_type = file_info[file_type]
            file_start = file_info_type['start_time']
            file_end = file_info_type['end_time']
            
            # Calcular proximidad temporal
            start_diff = abs((can_start - file_start).total_seconds())
            end_diff = abs((can_end - file_end).total_seconds())
            
            # Verificar si está dentro de tolerancia
            if start_diff <= tolerance_seconds and end_diff <= tolerance_seconds:
                score = (start_diff + end_diff) / 2
                session_files[file_type] = file_info_type
                logger.info(f"  ✅ {file_type}: Compatible (score: {score:.1f}s)")
            elif file_start <= can_end and file_end >= can_start:
                # Hay solapamiento real
                score = min(start_diff, end_diff)
                session_files[file_type] = file_info_type
                logger.info(f"  ✅ {file_type}: Solapamiento real (score: {score:.1f}s)")
            else:
                logger.info(f"  ❌ {file_type}: Fuera de tolerancia (start_diff: {start_diff/60:.1f}min, end_diff: {end_diff/60:.1f}min)")
        
        # Contar tipos disponibles
        available_types = [t for t, f in session_files.items() if f is not None]
        logger.info(f"  📊 Tipos disponibles: {available_types} ({len(available_types)}/4)")
        
        if len(available_types) >= 2:
            logger.info("  ✅ PROCESADOR MEJORADO ACEPTARÍA ESTA SESIÓN")
        else:
            logger.error("  ❌ PROCESADOR MEJORADO RECHAZARÍA ESTA SESIÓN")
    
    def _provide_recommendations(self, file_info: Dict[str, Dict]):
        """Proporciona recomendaciones basadas en el análisis."""
        logger.info("💡 PASO 6: Recomendaciones...")
        
        # Verificar problemas comunes
        issues = []
        
        for file_type, info in file_info.items():
            if 'error' in info:
                issues.append(f"Error en {file_type}: {info['error']}")
            elif 'start_time' not in info:
                issues.append(f"No se pudo extraer tiempo de {file_type}")
        
        if issues:
            logger.warning("  ⚠️  Problemas detectados:")
            for issue in issues:
                logger.warning(f"    - {issue}")
        
        # Verificar rangos temporales
        can_info = file_info.get('CAN', {})
        if 'start_time' in can_info and 'end_time' in can_info:
            can_start = can_info['start_time']
            can_end = can_info['end_time']
            
            logger.info("  📊 Análisis de rangos:")
            for file_type in ['GPS', 'ESTABILIDAD', 'ROTATIVO']:
                if file_type in file_info and 'start_time' in file_info[file_type]:
                    file_start = file_info[file_type]['start_time']
                    file_end = file_info[file_type]['end_time']
                    
                    start_diff = (can_start - file_start).total_seconds() / 60
                    end_diff = (can_end - file_end).total_seconds() / 60
                    
                    logger.info(f"    {file_type}: {start_diff:+.1f}min inicio, {end_diff:+.1f}min fin")
        
        logger.info("  🎯 Recomendaciones:")
        logger.info("    1. Verificar que todos los archivos tengan datos válidos")
        logger.info("    2. Ajustar tolerancia temporal si es necesario")
        logger.info("    3. Considerar archivos con nombres similares pero no idénticos")
        logger.info("    4. Implementar logging más detallado en el procesador principal")

if __name__ == "__main__":
    analyzer = SessionAnalyzer()
    analyzer.analyze_session() 