#!/usr/bin/env python3
"""
Script para analizar los rangos temporales de todos los archivos
y entender por qué solo se está creando una sesión.
"""

import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional

def parse_can_timestamps(file_path: str) -> Tuple[Optional[datetime], Optional[datetime]]:
    """Extrae el primer y último timestamp de un archivo CAN."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        if not lines:
            return None, None
        
        # Buscar la primera línea con timestamp (formato: 09/07/2025 01:25:29PM)
        first_timestamp = None
        last_timestamp = None
        
        for line in lines:
            # Buscar patrón de timestamp
            match = re.search(r'(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}[AP]M)', line)
            if match:
                try:
                    timestamp_str = match.group(1)
                    timestamp = datetime.strptime(timestamp_str, '%d/%m/%Y %I:%M:%S%p')
                    if first_timestamp is None:
                        first_timestamp = timestamp
                    last_timestamp = timestamp
                except ValueError:
                    continue
        
        return first_timestamp, last_timestamp
    except Exception as e:
        print(f"Error parsing CAN file {file_path}: {e}")
        return None, None

def parse_gps_timestamps(file_path: str) -> Tuple[Optional[datetime], Optional[datetime]]:
    """Extrae el primer y último timestamp de un archivo GPS."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        if not lines:
            return None, None
        
        first_timestamp = None
        last_timestamp = None
        
        for line in lines:
            # Buscar patrón de timestamp (formato: 09/07/2025,10:01:32)
            match = re.search(r'(\d{2}/\d{2}/\d{4}),(\d{2}:\d{2}:\d{2})', line)
            if match:
                try:
                    date_str = match.group(1)
                    time_str = match.group(2)
                    timestamp_str = f"{date_str} {time_str}"
                    timestamp = datetime.strptime(timestamp_str, '%d/%m/%Y %H:%M:%S')
                    if first_timestamp is None:
                        first_timestamp = timestamp
                    last_timestamp = timestamp
                except ValueError:
                    continue
        
        return first_timestamp, last_timestamp
    except Exception as e:
        print(f"Error parsing GPS file {file_path}: {e}")
        return None, None

def parse_stability_timestamps(file_path: str) -> Tuple[Optional[datetime], Optional[datetime]]:
    """Extrae el primer y último timestamp de un archivo de estabilidad."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        if not lines:
            return None, None
        
        first_timestamp = None
        last_timestamp = None
        
        # Buscar timestamp en la cabecera (formato: ESTABILIDAD;09/07/2025 12:28:04PM;DOBACK026;5;1;)
        header_match = re.search(r'ESTABILIDAD;(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}[AP]M)', lines[0])
        if header_match:
            try:
                timestamp_str = header_match.group(1)
                timestamp = datetime.strptime(timestamp_str, '%d/%m/%Y %I:%M:%S%p')
                first_timestamp = timestamp
                last_timestamp = timestamp  # Para estabilidad, asumimos que es el mismo timestamp
            except ValueError:
                pass
        
        return first_timestamp, last_timestamp
    except Exception as e:
        print(f"Error parsing stability file {file_path}: {e}")
        return None, None

def parse_rotativo_timestamps(file_path: str) -> Tuple[Optional[datetime], Optional[datetime]]:
    """Extrae el primer y último timestamp de un archivo rotativo."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        if not lines:
            return None, None
        
        first_timestamp = None
        last_timestamp = None
        
        for line in lines:
            # Buscar patrón de timestamp (formato: 2025-07-09 12:01:30)
            match = re.search(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})', line)
            if match:
                try:
                    timestamp_str = match.group(1)
                    timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                    if first_timestamp is None:
                        first_timestamp = timestamp
                    last_timestamp = timestamp
                except ValueError:
                    continue
        
        return first_timestamp, last_timestamp
    except Exception as e:
        print(f"Error parsing rotativo file {file_path}: {e}")
        return None, None

def analyze_file_ranges():
    """Analiza todos los archivos y sus rangos temporales."""
    base_path = Path("data/datosDoback/CMadrid/doback025")
    
    file_ranges = {
        'CAN': [],
        'GPS': [],
        'estabilidad': [],
        'ROTATIVO': []
    }
    
    # Analizar archivos CAN
    can_path = base_path / "CAN"
    for file_path in can_path.glob("*.txt"):
        if "RealTime" not in file_path.name:
            start_time, end_time = parse_can_timestamps(str(file_path))
            if start_time and end_time:
                file_ranges['CAN'].append({
                    'file': file_path.name,
                    'start': start_time,
                    'end': end_time,
                    'duration': (end_time - start_time).total_seconds() / 60  # minutos
                })
    
    # Analizar archivos GPS
    gps_path = base_path / "GPS"
    for file_path in gps_path.glob("*.txt"):
        if "realTime" not in file_path.name:
            start_time, end_time = parse_gps_timestamps(str(file_path))
            if start_time and end_time:
                file_ranges['GPS'].append({
                    'file': file_path.name,
                    'start': start_time,
                    'end': end_time,
                    'duration': (end_time - start_time).total_seconds() / 60  # minutos
                })
    
    # Analizar archivos de estabilidad
    stability_path = base_path / "estabilidad"
    for file_path in stability_path.glob("*.txt"):
        if "realTime" not in file_path.name:
            start_time, end_time = parse_stability_timestamps(str(file_path))
            if start_time and end_time:
                file_ranges['estabilidad'].append({
                    'file': file_path.name,
                    'start': start_time,
                    'end': end_time,
                    'duration': (end_time - start_time).total_seconds() / 60  # minutos
                })
    
    # Analizar archivos rotativo
    rotativo_path = base_path / "ROTATIVO"
    for file_path in rotativo_path.glob("*.txt"):
        if "REALTIME" not in file_path.name:
            start_time, end_time = parse_rotativo_timestamps(str(file_path))
            if start_time and end_time:
                file_ranges['ROTATIVO'].append({
                    'file': file_path.name,
                    'start': start_time,
                    'end': end_time,
                    'duration': (end_time - start_time).total_seconds() / 60  # minutos
                })
    
    # Mostrar resultados
    print("=== ANÁLISIS DE RANGOS TEMPORALES ===\n")
    
    for file_type, files in file_ranges.items():
        print(f"\n--- {file_type} ---")
        if not files:
            print("  No se encontraron archivos válidos")
            continue
        
        # Ordenar por tiempo de inicio
        files.sort(key=lambda x: x['start'])
        
        for file_info in files:
            print(f"  {file_info['file']}")
            print(f"    Inicio: {file_info['start'].strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"    Fin:    {file_info['end'].strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"    Duración: {file_info['duration']:.1f} minutos")
            print()
    
    # Analizar posibles sesiones
    print("\n=== ANÁLISIS DE POSIBLES SESIONES ===\n")
    
    # Encontrar rangos temporales que se solapan
    all_files = []
    for file_type, files in file_ranges.items():
        for file_info in files:
            all_files.append({
                'type': file_type,
                **file_info
            })
    
    # Ordenar por tiempo de inicio
    all_files.sort(key=lambda x: x['start'])
    
    # Buscar grupos de archivos que se solapan
    sessions = []
    current_session = []
    
    for file_info in all_files:
        if not current_session:
            current_session = [file_info]
        else:
            # Verificar si se solapa con algún archivo de la sesión actual
            overlaps = False
            for session_file in current_session:
                # Verificar solapamiento
                if (file_info['start'] <= session_file['end'] and 
                    file_info['end'] >= session_file['start']):
                    overlaps = True
                    break
            
            if overlaps:
                current_session.append(file_info)
            else:
                # Nueva sesión
                if len(current_session) >= 2:  # Al menos 2 tipos de archivos
                    sessions.append(current_session)
                current_session = [file_info]
    
    # Agregar la última sesión
    if len(current_session) >= 2:
        sessions.append(current_session)
    
    print(f"Se encontraron {len(sessions)} posibles sesiones:\n")
    
    for i, session in enumerate(sessions, 1):
        print(f"Sesión {i}:")
        
        # Calcular rango temporal de la sesión
        session_start = min(f['start'] for f in session)
        session_end = max(f['end'] for f in session)
        session_duration = (session_end - session_start).total_seconds() / 60
        
        print(f"  Rango: {session_start.strftime('%Y-%m-%d %H:%M:%S')} - {session_end.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Duración: {session_duration:.1f} minutos")
        
        # Contar tipos de archivos
        file_types = set(f['type'] for f in session)
        print(f"  Tipos de archivos: {', '.join(sorted(file_types))}")
        print(f"  Total archivos: {len(session)}")
        
        print("  Archivos:")
        for file_info in session:
            print(f"    - {file_info['type']}: {file_info['file']}")
        print()

if __name__ == "__main__":
    analyze_file_ranges() 