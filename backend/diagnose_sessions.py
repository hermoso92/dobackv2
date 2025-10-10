#!/usr/bin/env python3
"""
Script de diagnóstico para entender por qué solo se está creando una sesión.
Analiza en detalle cada archivo y los criterios de agrupación.
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

def diagnose_sessions():
    """Diagnóstico detallado de por qué solo hay una sesión."""
    # Usar ruta absoluta relativa a este archivo
    base_path = Path(os.path.dirname(__file__)) / "data/datosDoback/CMadrid/doback025"
    
    print("=== DIAGNÓSTICO DETALLADO DE SESIONES ===\n")
    
    # 1. Analizar archivos CAN disponibles
    print("1. ARCHIVOS CAN DISPONIBLES:")
    print("=" * 50)
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
    
    print(f"Total archivos CAN válidos: {len(can_files)}\n")
    
    # 2. Analizar archivos GPS disponibles
    print("2. ARCHIVOS GPS DISPONIBLES:")
    print("=" * 50)
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
    
    print(f"Total archivos GPS válidos: {len(gps_files)}\n")
    
    # 3. Analizar archivos de estabilidad disponibles
    print("3. ARCHIVOS DE ESTABILIDAD DISPONIBLES:")
    print("=" * 50)
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
    
    print(f"Total archivos de estabilidad válidos: {len(stability_files)}\n")
    
    # 4. Analizar archivos rotativo disponibles
    print("4. ARCHIVOS ROTATIVO DISPONIBLES:")
    print("=" * 50)
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
    
    print(f"Total archivos rotativo válidos: {len(rotativo_files)}\n")
    
    # 5. Análisis de criterios del procesador
    print("5. ANÁLISIS DE CRITERIOS DEL PROCESADOR:")
    print("=" * 50)
    
    print("Criterios actuales del procesador:")
    print("  - Requiere archivos CAN, GPS, ESTABILIDAD y ROTATIVO")
    print("  - Busca solapamiento temporal entre archivos")
    print("  - Usa archivos CAN como base para agrupar sesiones")
    print("  - Requiere que todos los tipos de archivo se solapen")
    print()
    
    # 6. Simular el algoritmo del procesador
    print("6. SIMULACIÓN DEL ALGORITMO DEL PROCESADOR:")
    print("=" * 50)
    
    sessions_found = []
    tolerance_minutes = 1.0  # Tolerancia de 1 minuto
    
    for can_file in can_files:
        print(f"\nAnalizando archivo CAN: {can_file['file']}")
        print(f"  Rango: {can_file['start'].strftime('%Y-%m-%d %H:%M:%S')} - {can_file['end'].strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Buscar archivos GPS que se solapen temporalmente
        matching_gps = []
        for gps_file in gps_files:
            # Verificar solapamiento real
            overlap_start = max(can_file['start'], gps_file['start'])
            overlap_end = min(can_file['end'], gps_file['end'])
            overlap_duration = (overlap_end - overlap_start).total_seconds()
            
            if overlap_duration > 0:  # Hay solapamiento real
                matching_gps.append({
                    'file': gps_file,
                    'overlap_duration': overlap_duration
                })
        
        print(f"  Archivos GPS que se solapan: {len(matching_gps)}")
        
        # Buscar archivos de estabilidad que se solapen temporalmente
        matching_stability = []
        for stability_file in stability_files:
            # Verificar solapamiento real
            overlap_start = max(can_file['start'], stability_file['start'])
            overlap_end = min(can_file['end'], stability_file['end'])
            overlap_duration = (overlap_end - overlap_start).total_seconds()
            
            if overlap_duration > 0:  # Hay solapamiento real
                matching_stability.append({
                    'file': stability_file,
                    'overlap_duration': overlap_duration
                })
        
        print(f"  Archivos de estabilidad que se solapan: {len(matching_stability)}")
        
        # Buscar archivos rotativo que se solapen temporalmente
        matching_rotativo = []
        for rotativo_file in rotativo_files:
            # Verificar solapamiento real
            overlap_start = max(can_file['start'], rotativo_file['start'])
            overlap_end = min(can_file['end'], rotativo_file['end'])
            overlap_duration = (overlap_end - overlap_start).total_seconds()
            
            if overlap_duration > 0:  # Hay solapamiento real
                matching_rotativo.append({
                    'file': rotativo_file,
                    'overlap_duration': overlap_duration
                })
        
        print(f"  Archivos rotativo que se solapan: {len(matching_rotativo)}")
        
        # Verificar si se puede formar una sesión
        if matching_gps and matching_stability and matching_rotativo:
            print(f"  ✅ SESIÓN POSIBLE")
            
            # Encontrar el mejor archivo de cada tipo (mayor solapamiento)
            best_gps = max(matching_gps, key=lambda x: x['overlap_duration'])
            best_stability = max(matching_stability, key=lambda x: x['overlap_duration'])
            best_rotativo = max(matching_rotativo, key=lambda x: x['overlap_duration'])
            
            # Calcular rango de la sesión como intersección de todos los archivos
            all_starts = [can_file['start'], best_gps['file']['start'], best_stability['file']['start'], best_rotativo['file']['start']]
            all_ends = [can_file['end'], best_gps['file']['end'], best_stability['file']['end'], best_rotativo['file']['end']]
            session_start = max(all_starts)  # Intersección: máximo de los inicios
            session_end = min(all_ends)      # Intersección: mínimo de los fines
            session_duration = (session_end - session_start).total_seconds() / 60
            
            sessions_found.append({
                'can_file': can_file['file'],
                'gps_file': best_gps['file']['file'],
                'stability_file': best_stability['file']['file'],
                'rotativo_file': best_rotativo['file']['file'],
                'start': session_start,
                'end': session_end,
                'duration': session_duration
            })
            
            print(f"    Rango de sesión: {session_start.strftime('%Y-%m-%d %H:%M:%S')} - {session_end.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"    Duración: {session_duration:.1f} minutos")
            print(f"    Archivos:")
            print(f"      CAN: {can_file['file']}")
            print(f"      GPS: {best_gps['file']['file']} (solapamiento: {best_gps['overlap_duration']:.1f}s)")
            print(f"      ESTABILIDAD: {best_stability['file']['file']} (solapamiento: {best_stability['overlap_duration']:.1f}s)")
            print(f"      ROTATIVO: {best_rotativo['file']['file']} (solapamiento: {best_rotativo['overlap_duration']:.1f}s)")
        else:
            print(f"  ❌ NO SE PUEDE FORMAR SESIÓN")
            if not matching_gps:
                print(f"    - Falta archivo GPS que se solape")
            if not matching_stability:
                print(f"    - Falta archivo de estabilidad que se solape")
            if not matching_rotativo:
                print(f"    - Falta archivo rotativo que se solape")
    
    # 7. Resumen final
    print("\n7. RESUMEN FINAL:")
    print("=" * 50)
    print(f"Total de sesiones encontradas: {len(sessions_found)}")
    
    if sessions_found:
        print("\nSesiones válidas:")
        for i, session in enumerate(sessions_found, 1):
            print(f"\nSesión {i}:")
            print(f"  Rango: {session['start'].strftime('%Y-%m-%d %H:%M:%S')} - {session['end'].strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"  Duración: {session['duration']:.1f} minutos")
            print(f"  Archivos:")
            print(f"    CAN: {session['can_file']}")
            print(f"    GPS: {session['gps_file']}")
            print(f"    ESTABILIDAD: {session['stability_file']}")
            print(f"    ROTATIVO: {session['rotativo_file']}")
    else:
        print("\n❌ NO SE ENCONTRARON SESIONES VÁLIDAS")
        print("\nPosibles causas:")
        print("  1. Los archivos de estabilidad tienen duración 0.0 minutos")
        print("  2. No hay solapamiento temporal entre todos los tipos de archivo")
        print("  3. Faltan archivos de algún tipo requerido")
        print("  4. Los rangos temporales están muy separados")
    
    # 8. Recomendaciones
    print("\n8. RECOMENDACIONES:")
    print("=" * 50)
    print("Para aumentar el número de sesiones:")
    print("  1. Ajustar la tolerancia temporal para archivos de estabilidad")
    print("  2. Permitir sesiones sin archivos de estabilidad")
    print("  3. Usar archivos rotativo como base en lugar de CAN")
    print("  4. Reducir los requisitos de solapamiento temporal")
    print("  5. Procesar archivos de estabilidad de manera diferente")

if __name__ == "__main__":
    diagnose_sessions() 