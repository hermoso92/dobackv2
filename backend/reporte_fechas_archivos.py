#!/usr/bin/env python3
"""
Script para generar un reporte detallado con todas las fechas y horas
de todos los archivos CAN, GPS, estabilidad y rotativo.
"""

import os
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple, Optional

def parse_can_timestamps(file_path: str) -> Tuple[Optional[datetime], Optional[datetime]]:
    """Extrae el primer y último timestamp de un archivo CAN."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        if not lines:
            return None, None
        
        first_timestamp = None
        last_timestamp = None
        
        for line in lines:
            # Buscar patrón de timestamp (formato: 09/07/2025 01:25:29PM)
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
    """Extrae el primer y último timestamp de un archivo de estabilidad usando 100 ms por muestra."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        if len(lines) < 3:
            return None, None
        # Cabecera
        header_match = re.search(r'ESTABILIDAD;(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}[AP]M)', lines[0])
        if not header_match:
            return None, None
        timestamp_str = header_match.group(1)
        inicio = datetime.strptime(timestamp_str, '%d/%m/%Y %I:%M:%S%p')
        # Datos: a partir de la línea 3 (índice 2)
        n_muestras = len([l for l in lines[2:] if l.strip() and not re.match(r'^[0-9]{2}:[0-9]{2}:[0-9]{2}', l.strip())])
        if n_muestras == 0:
            return inicio, inicio
        fin = inicio + timedelta(milliseconds=(n_muestras-1)*100)
        return inicio, fin
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

def generar_reporte_fechas():
    """Genera un reporte detallado con todas las fechas y horas de todos los archivos."""
    base_path = Path(os.path.dirname(__file__)) / "data/datosDoback/CMadrid/doback022"
    
    print("=" * 80)
    print("REPORTE DETALLADO DE FECHAS Y HORAS DE TODOS LOS ARCHIVOS")
    print("=" * 80)
    print(f"Vehículo: doback022")
    print(f"Fecha de generación: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    # 1. Archivos CAN
    print("\n1. ARCHIVOS CAN")
    print("-" * 80)
    can_files = []
    can_path = base_path / "CAN"
    for file_path in can_path.glob("*.txt"):
        if "RealTime" not in file_path.name:
            start_time, end_time = parse_can_timestamps(str(file_path))
            if start_time and end_time:
                duration = (end_time - start_time).total_seconds() / 60
                can_files.append({
                    'file': file_path.name,
                    'start': start_time,
                    'end': end_time,
                    'duration': duration
                })
                print(f"  {file_path.name}")
                print(f"    Inicio: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"    Fin:    {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"    Duración: {duration:.1f} minutos")
                print()
    
    print(f"Total archivos CAN: {len(can_files)}")
    
    # 2. Archivos GPS
    print("\n2. ARCHIVOS GPS")
    print("-" * 80)
    gps_files = []
    gps_path = base_path / "GPS"
    for file_path in gps_path.glob("*.txt"):
        if "realTime" not in file_path.name:
            start_time, end_time = parse_gps_timestamps(str(file_path))
            if start_time and end_time:
                duration = (end_time - start_time).total_seconds() / 60
                gps_files.append({
                    'file': file_path.name,
                    'start': start_time,
                    'end': end_time,
                    'duration': duration
                })
                print(f"  {file_path.name}")
                print(f"    Inicio: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"    Fin:    {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"    Duración: {duration:.1f} minutos")
                print()
    
    print(f"Total archivos GPS: {len(gps_files)}")
    
    # 3. Archivos de estabilidad
    print("\n3. ARCHIVOS DE ESTABILIDAD")
    print("-" * 80)
    stability_files = []
    stability_path = base_path / "estabilidad"
    for file_path in stability_path.glob("*.txt"):
        if "realTime" not in file_path.name:
            start_time, end_time = parse_stability_timestamps(str(file_path))
            if start_time and end_time:
                duration = (end_time - start_time).total_seconds() / 60
                stability_files.append({
                    'file': file_path.name,
                    'start': start_time,
                    'end': end_time,
                    'duration': duration
                })
                print(f"  {file_path.name}")
                print(f"    Inicio: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"    Fin:    {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"    Duración: {duration:.1f} minutos")
                print()
    
    print(f"Total archivos de estabilidad: {len(stability_files)}")
    
    # 4. Archivos rotativo
    print("\n4. ARCHIVOS ROTATIVO")
    print("-" * 80)
    rotativo_files = []
    rotativo_path = base_path / "ROTATIVO"
    for file_path in rotativo_path.glob("*.txt"):
        if "REALTIME" not in file_path.name:
            start_time, end_time = parse_rotativo_timestamps(str(file_path))
            if start_time and end_time:
                duration = (end_time - start_time).total_seconds() / 60
                rotativo_files.append({
                    'file': file_path.name,
                    'start': start_time,
                    'end': end_time,
                    'duration': duration
                })
                print(f"  {file_path.name}")
                print(f"    Inicio: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"    Fin:    {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"    Duración: {duration:.1f} minutos")
                print()
    
    print(f"Total archivos rotativo: {len(rotativo_files)}")
    
    # 5. Resumen por fecha
    print("\n5. RESUMEN POR FECHA")
    print("-" * 80)
    
    all_files = []
    all_files.extend([{'type': 'CAN', **f} for f in can_files])
    all_files.extend([{'type': 'GPS', **f} for f in gps_files])
    all_files.extend([{'type': 'ESTABILIDAD', **f} for f in stability_files])
    all_files.extend([{'type': 'ROTATIVO', **f} for f in rotativo_files])
    
    # Agrupar por fecha
    files_by_date = {}
    for file_info in all_files:
        date_str = file_info['start'].strftime('%Y-%m-%d')
        if date_str not in files_by_date:
            files_by_date[date_str] = []
        files_by_date[date_str].append(file_info)
    
    # Mostrar por fecha
    for date_str in sorted(files_by_date.keys()):
        print(f"\nFecha: {date_str}")
        files_on_date = files_by_date[date_str]
        files_on_date.sort(key=lambda x: x['start'])
        
        for file_info in files_on_date:
            print(f"  {file_info['type']:12} | {file_info['start'].strftime('%H:%M:%S')} - {file_info['end'].strftime('%H:%M:%S')} | {file_info['duration']:5.1f} min | {file_info['file']}")
    
    # 6. Estadísticas generales
    print("\n6. ESTADÍSTICAS GENERALES")
    print("-" * 80)
    print(f"Total de archivos: {len(all_files)}")
    print(f"Archivos CAN: {len(can_files)}")
    print(f"Archivos GPS: {len(gps_files)}")
    print(f"Archivos de estabilidad: {len(stability_files)}")
    print(f"Archivos rotativo: {len(rotativo_files)}")
    
    if all_files:
        earliest_start = min(f['start'] for f in all_files)
        latest_end = max(f['end'] for f in all_files)
        total_duration = (latest_end - earliest_start).total_seconds() / 60
        print(f"\nRango temporal total:")
        print(f"  Inicio más temprano: {earliest_start.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Fin más tardío: {latest_end.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Duración total: {total_duration:.1f} minutos ({total_duration/60:.1f} horas)")
    
    # 7. Archivos por hora del día
    print("\n7. DISTRIBUCIÓN POR HORA DEL DÍA")
    print("-" * 80)
    
    hour_distribution = {}
    for file_info in all_files:
        hour = file_info['start'].hour
        if hour not in hour_distribution:
            hour_distribution[hour] = []
        hour_distribution[hour].append(file_info)
    
    for hour in sorted(hour_distribution.keys()):
        files_in_hour = hour_distribution[hour]
        print(f"  {hour:02d}:00 - {hour:02d}:59: {len(files_in_hour)} archivos")
        for file_info in files_in_hour:
            print(f"    {file_info['type']:12} | {file_info['start'].strftime('%H:%M:%S')} - {file_info['end'].strftime('%H:%M:%S')} | {file_info['file']}")
    
    print("\n" + "=" * 80)
    print("FIN DEL REPORTE")
    print("=" * 80)

if __name__ == "__main__":
    generar_reporte_fechas() 