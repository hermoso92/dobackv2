#!/usr/bin/env python3
"""
Emparejador de Sesiones Mejorado - Reemplaza la funcionalidad existente
- Suma +2 horas automáticamente a archivos GPS
- Maneja mejor archivos ROTATIVO con fecha 00:00:00
- Tolerancia más flexible y configurable
- Lee cabeceros internos correctamente
- Filtrado de archivos traducidos
"""

import os
import re
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import argparse

# Configurar logging sin emojis para evitar errores de codificación en Windows
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('session_matcher.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class FileContentAnalyzer:
    """Analizador de contenido de archivos para extraer fechas reales"""
    
    def __init__(self):
        self.datetime_patterns = [
            r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})',
            r'(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2})',
            r'(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2})',
            r'(\d{4}\d{2}\d{2}\s+\d{2}\d{2}\d{2})'
        ]
    
    def extract_real_datetime_from_file(self, file_path: Path, file_type: str, gps_timezone_offset_hours: int = 2) -> Optional[datetime]:
        """
        Extrae la fecha y hora real del contenido del archivo
        
        Args:
            file_path: Ruta al archivo
            file_type: Tipo de archivo (CAN, GPS, ESTABILIDAD, ROTATIVO)
            gps_timezone_offset_hours: Offset de zona horaria para GPS
        
        Returns:
            datetime extraído o None si no se encuentra
        """
        try:
            if not file_path.exists():
                return None
            
            # Leer las primeras líneas del archivo
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = []
                for i, line in enumerate(f):
                    if i >= 10:  # Solo las primeras 10 líneas
                        break
                    lines.append(line.strip())
            
            content = '\n'.join(lines)
            
            # Buscar patrones de fecha y hora
            for pattern in self.datetime_patterns:
                matches = re.findall(pattern, content)
                if matches:
                    try:
                        # Intentar parsear la primera coincidencia
                        date_str = matches[0]
                        
                        # Normalizar formato
                        if re.match(r'\d{4}\d{2}\d{2}\s+\d{2}\d{2}\d{2}', date_str):
                            # Formato: 20250708 143022
                            dt = datetime.strptime(date_str, '%Y%m%d %H%M%S')
                        elif re.match(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', date_str):
                            # Formato: 2025-07-08 14:30:22
                            dt = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                        elif re.match(r'\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}', date_str):
                            # Formato: 08/07/2025 14:30:22
                            dt = datetime.strptime(date_str, '%d/%m/%Y %H:%M:%S')
                        elif re.match(r'\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2}', date_str):
                            # Formato: 08-07-2025 14:30:22
                            dt = datetime.strptime(date_str, '%d-%m-%Y %H:%M:%S')
                        else:
                            continue
                        
                        # Aplicar offset de zona horaria para GPS
                        if file_type == 'GPS':
                            dt += timedelta(hours=gps_timezone_offset_hours)
                            logger.debug(f"    Aplicado offset GPS (+{gps_timezone_offset_hours}h): {dt}")
                        
                        return dt
                        
                    except ValueError as e:
                        logger.debug(f"    Error parseando fecha '{date_str}': {e}")
                        continue
            
            # Si no se encuentra en el contenido, intentar con el nombre del archivo
            return self.extract_datetime_from_filename(file_path.name, file_type, gps_timezone_offset_hours)
            
        except Exception as e:
            logger.debug(f"    Error leyendo archivo {file_path}: {e}")
            return None
    
    def extract_datetime_from_filename(self, filename: str, file_type: str, gps_timezone_offset_hours: int = 2) -> Optional[datetime]:
        """
        Extrae fecha y hora del nombre del archivo
        
        Args:
            filename: Nombre del archivo
            file_type: Tipo de archivo
            gps_timezone_offset_hours: Offset de zona horaria para GPS
        
        Returns:
            datetime extraído o None si no se encuentra
        """
        try:
            # Patrones para diferentes formatos de nombre
            patterns = [
                # CAN_DOBACK022_20250708_1.txt
                r'_(\d{8})_(\d+)\.',
                # GPS_DOBACK022_20250708_0.txt
                r'_(\d{8})_(\d+)\.',
                # ESTABILIDAD_DOBACK022_20250708_2.txt
                r'_(\d{8})_(\d+)\.',
                # ROTATIVO_DOBACK022_20250708_1.txt
                r'_(\d{8})_(\d+)\.'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, filename)
                if match:
                    date_str = match.group(1)
                    # Parsear fecha YYYYMMDD
                    dt = datetime.strptime(date_str, '%Y%m%d')
                    
                    # Para archivos ROTATIVO que solo tienen fecha, usar 00:00:00
                    if file_type == 'ROTATIVO':
                        dt = dt.replace(hour=0, minute=0, second=0)
                        logger.debug(f"    ROTATIVO: usando fecha sin hora: {dt}")
                    else:
                        # Para otros archivos, intentar extraer hora del segundo grupo
                        try:
                            hour_str = match.group(2)
                            if len(hour_str) >= 2:
                                hour = int(hour_str[:2]) % 24
                                dt = dt.replace(hour=hour, minute=0, second=0)
                        except (ValueError, IndexError):
                            # Si no se puede extraer hora, usar 00:00:00
                            dt = dt.replace(hour=0, minute=0, second=0)
                    
                    # Aplicar offset de zona horaria para GPS
                    if file_type == 'GPS':
                        dt += timedelta(hours=gps_timezone_offset_hours)
                        logger.debug(f"    Aplicado offset GPS (+{gps_timezone_offset_hours}h): {dt}")
                    
                    return dt
            
            return None
            
        except Exception as e:
            logger.debug(f"    Error extrayendo fecha de nombre '{filename}': {e}")
            return None

class ImprovedSessionMatcher:
    """Emparejador mejorado de sesiones con análisis de contenido"""
    
    def __init__(self, gps_timezone_offset_hours: int = 2, tolerance_minutes: int = 30):
        self.gps_timezone_offset_hours = gps_timezone_offset_hours
        self.tolerance = timedelta(minutes=tolerance_minutes)
        self.analyzer = FileContentAnalyzer()
    
    def find_complete_sessions(self, base_path: Path) -> List[Dict[str, Any]]:
        """
        Encuentra sesiones completas con todos los tipos de archivos
        
        Args:
            base_path: Ruta base donde buscar archivos
        
        Returns:
            Lista de sesiones completas encontradas
        """
        logger.info("Iniciando emparejador de sesiones mejorado...")
        logger.info(f"Offset GPS: +{self.gps_timezone_offset_hours} horas")
        logger.info(f"Tolerancia: {self.tolerance.total_seconds() / 60} minutos")
        logger.info(f"Ruta base: {base_path}")
        
        # Escanear todos los archivos
        all_files = self._scan_all_files(base_path)
        
        # Agrupar por vehículo
        vehicles = {}
        for file_info in all_files:
            vehicle = file_info['vehicle']
            file_type = file_info['file_type']
            
            if vehicle not in vehicles:
                vehicles[vehicle] = {}
            
            if file_type not in vehicles[vehicle]:
                vehicles[vehicle][file_type] = []
            
            vehicles[vehicle][file_type].append(file_info)
        
        # Encontrar sesiones para cada vehículo
        all_sessions = []
        for vehicle, type_files in vehicles.items():
            logger.info(f"Analizando vehículo: {vehicle}")
            
            # Verificar que tenga todos los tipos necesarios
            required_types = {'CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO'}
            available_types = set(type_files.keys())
            
            if not required_types.issubset(available_types):
                missing = required_types - available_types
                logger.info(f"  Faltan tipos para {vehicle}: {list(missing)}")
                continue
            
            # Mostrar estadísticas
            logger.info(f"  Tipos disponibles: {list(available_types)}")
            for file_type, files in type_files.items():
                logger.info(f"  {file_type}: {len(files)} archivos")
            
            # Buscar sesiones para este vehículo
            vehicle_sessions = self._find_sessions_for_vehicle(vehicle, type_files)
            all_sessions.extend(vehicle_sessions)
        
        logger.info(f"Encontradas {len(all_sessions)} sesiones completas")
        return all_sessions
    
    def _scan_all_files(self, base_path: Path) -> List[Dict[str, Any]]:
        """Escanea todos los archivos en la ruta base"""
        all_files = []
        
        if not base_path.exists():
            logger.error(f"La ruta base no existe: {base_path}")
            return all_files
        
        # Recorrer todos los subdirectorios
        for vehicle_dir in base_path.iterdir():
            if not vehicle_dir.is_dir():
                continue
            
            vehicle = vehicle_dir.name
            
            # Buscar archivos en subdirectorios por tipo
            for file_type in ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']:
                type_dir = vehicle_dir / file_type
                if not type_dir.exists():
                    continue
                
                for file_path in type_dir.glob('*'):
                    if not file_path.is_file():
                        continue
                    
                    # Filtrar archivos traducidos
                    if '_TRADUCIDO' in file_path.name:
                        continue
                    
                    # Extraer fecha real del archivo
                    real_datetime = self.analyzer.extract_real_datetime_from_file(
                        file_path, file_type, self.gps_timezone_offset_hours
                    )
                    
                    if real_datetime:
                        file_info = {
                            'vehicle': vehicle,
                            'file_type': file_type,
                            'filename': file_path.name,
                            'file_path': file_path,
                            'real_datetime': real_datetime
                        }
                        all_files.append(file_info)
                        logger.debug(f"  Encontrado: {file_type} - {file_path.name} ({real_datetime})")
        
        return all_files
    
    def _find_sessions_for_vehicle(self, vehicle: str, type_files: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Encuentra sesiones para un vehículo específico"""
        sessions = []
        used_files = set()
        
        # Procesar cada archivo CAN como punto de partida
        for can_file in type_files['CAN']:
            logger.info(f"    Buscando sesión para CAN: {can_file['filename']} ({can_file['real_datetime']})")
            
            # Buscar la mejor combinación para este archivo CAN
            best_session = self._find_best_combination_improved(can_file, type_files, used_files)
            
            if best_session:
                sessions.append(best_session)
                # Marcar archivos como usados
                for file_type, file_info in best_session['files'].items():
                    used_files.add(file_info['file_path'])
                logger.info(f"    SESSION ENCONTRADA: Score {best_session['score']:.3f}")
            else:
                logger.warning(f"    No se pudo formar sesión para CAN: {can_file['filename']}")
        
        return sessions
    
    def _find_best_combination_improved(self, can_file: Dict, type_files: Dict[str, List[Dict[str, Any]]], used_files: set) -> Optional[Dict[str, Any]]:
        """Encuentra la mejor combinación de archivos para un archivo CAN"""
        can_time = can_file['real_datetime']
        best_session = None
        best_score = -1
        
        # Buscar en cada tipo de archivo
        for gps_file in type_files['GPS']:
            if gps_file['file_path'] in used_files:
                continue
                
            for estabilidad_file in type_files['ESTABILIDAD']:
                if estabilidad_file['file_path'] in used_files:
                    continue
                    
                for rotativo_file in type_files['ROTATIVO']:
                    if rotativo_file['file_path'] in used_files:
                        continue
                    
                    # Calcular score para esta combinación
                    score = self._calculate_improved_score(
                        can_time, gps_file['real_datetime'], 
                        estabilidad_file['real_datetime'], rotativo_file['real_datetime']
                    )
                    
                    if score > best_score:
                        best_score = score
                        best_session = {
                            'vehicle': can_file['vehicle'],
                            'date': can_time.date(),
                            'score': score,
                            'files': {
                                'CAN': can_file,
                                'GPS': gps_file,
                                'ESTABILIDAD': estabilidad_file,
                                'ROTATIVO': rotativo_file
                            },
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

def agrupar_sesiones(base_path: str = None, gps_timezone_offset_hours: int = 2, tolerance_minutes: int = 30) -> List[Dict[str, Any]]:
    """
    Función principal para agrupar sesiones con el emparejador mejorado
    
    Args:
        base_path: Ruta base donde buscar archivos (opcional)
        gps_timezone_offset_hours: Offset de zona horaria para GPS (por defecto +2)
        tolerance_minutes: Tolerancia en minutos para emparejamiento (por defecto 30)
    
    Returns:
        Lista de sesiones completas encontradas
    """
    if base_path is None:
        # Ruta por defecto
        base_path = Path(__file__).parent / 'data' / 'datosDoback'
    else:
        base_path = Path(base_path)
    
    logger.info("Iniciando emparejador de sesiones mejorado...")
    logger.info(f"Offset GPS: +{gps_timezone_offset_hours} horas")
    logger.info(f"Tolerancia: {tolerance_minutes} minutos")
    logger.info(f"Ruta base: {base_path}")
    
    # Crear emparejador mejorado
    matcher = ImprovedSessionMatcher(gps_timezone_offset_hours, tolerance_minutes)
    
    # Encontrar sesiones
    sessions = matcher.find_complete_sessions(base_path)
    
    logger.info(f"Encontradas {len(sessions)} sesiones completas")
    
    return sessions

def main():
    """Función principal para ejecutar el emparejador desde línea de comandos"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Emparejador de sesiones mejorado')
    parser.add_argument('--base-path', type=str, help='Ruta base donde buscar archivos')
    parser.add_argument('--gps-offset', type=int, default=2, help='Offset de zona horaria para GPS (por defecto 2)')
    parser.add_argument('--tolerance', type=int, default=30, help='Tolerancia en minutos (por defecto 30)')
    
    args = parser.parse_args()
    
    # Ejecutar emparejador
    sessions = agrupar_sesiones(args.base_path, args.gps_offset, args.tolerance)
    
    # Mostrar resultados
    print(f"\n{'='*80}")
    print("RESULTADOS DEL EMPAREJADOR MEJORADO")
    print(f"{'='*80}")
    print(f"Offset GPS: +{args.gps_offset} horas")
    print(f"Tolerancia: {args.tolerance} minutos")
    print(f"Sesiones encontradas: {len(sessions)}")
    print(f"{'='*80}")
    
    if sessions:
        for i, session in enumerate(sessions, 1):
            print(f"\nSesión {i}: {session['vehicle']} - {session['date']}")
            print(f"  Score: {session['score']:.3f}")
            print(f"  Diferencias temporales (minutos):")
            print(f"    GPS: {session['time_diffs']['gps_diff']:.1f}")
            print(f"    ESTABILIDAD: {session['time_diffs']['estabilidad_diff']:.1f}")
            print(f"    ROTATIVO: {session['time_diffs']['rotativo_diff']:.1f}")
            print(f"  Archivos:")
            for file_type, file_info in session['files'].items():
                print(f"    {file_type}: {file_info['filename']}")
    else:
        print("\nNo se encontraron sesiones válidas")

if __name__ == "__main__":
    main() 