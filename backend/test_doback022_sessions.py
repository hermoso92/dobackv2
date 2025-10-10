#!/usr/bin/env python3
"""
Script específico para probar la detección de sesiones en doback022
usando rangos temporales reales del contenido de los archivos.
"""

import os
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple

def extract_time_range_from_file(file_path: str, file_type: str) -> Tuple[Optional[datetime], Optional[datetime]]:
    """Extrae el rango temporal real de un archivo según su tipo."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            lines = file.readlines()
        
        if not lines:
            return None, None
        
        if file_type == 'CAN':
            # Para archivos CAN decodificados, buscar timestamps en el contenido
            start_time = None
            end_time = None
            for line in lines:
                line = line.strip()
                if line and ',' in line:
                    parts = line.split(',')
                    if len(parts) >= 1:
                        try:
                            # Formato: DD/MM/YYYY HH:MM:SSAM/PM
                            timestamp = datetime.strptime(parts[0].strip(), '%d/%m/%Y %I:%M:%S%p')
                            if start_time is None:
                                start_time = timestamp
                            end_time = timestamp
                        except ValueError:
                            continue
            return start_time, end_time
        
        elif file_type == 'GPS':
            # Para archivos GPS, buscar timestamps en formato DD/MM/YYYY,HH:MM:SS
            start_time = None
            end_time = None
            for line in lines:
                line = line.strip()
                if line and ',' in line:
                    parts = line.split(',')
                    if len(parts) >= 2:
                        try:
                            date_str = parts[0].strip()
                            time_str = parts[1].strip()
                            timestamp = datetime.strptime(f"{date_str} {time_str}", "%d/%m/%Y %H:%M:%S")
                            if start_time is None:
                                start_time = timestamp
                            end_time = timestamp
                        except ValueError:
                            continue
            return start_time, end_time
        
        elif file_type == 'ESTABILIDAD':
            # Para archivos de estabilidad, usar timestamp de cabecera + número de muestras
            if len(lines) < 3:
                return None, None
            
            # Extraer timestamp de cabecera
            header_match = re.search(r'ESTABILIDAD;(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}[AP]M)', lines[0])
            if not header_match:
                return None, None
            
            try:
                timestamp_str = header_match.group(1)
                base_time = datetime.strptime(timestamp_str, '%d/%m/%Y %I:%M:%S%p')
                
                # Contar muestras de datos (desde línea 3)
                sample_count = len([l for l in lines[2:] if l.strip() and not re.match(r'^[0-9]{2}:[0-9]{2}:[0-9]{2}', l.strip())])
                
                if sample_count == 0:
                    return base_time, base_time
                
                end_time = base_time + timedelta(milliseconds=(sample_count - 1) * 100)
                return base_time, end_time
            except Exception as e:
                print(f"Error procesando estabilidad {file_path}: {e}")
                return None, None
        
        elif file_type == 'ROTATIVO':
            # Para archivos rotativo, buscar timestamps en formato YYYY-MM-DD HH:MM:SS
            start_time = None
            end_time = None
            for line in lines:
                line = line.strip()
                if line and ';' in line:
                    parts = line.split(';')
                    if len(parts) >= 1:
                        try:
                            timestamp = datetime.strptime(parts[0].strip(), '%Y-%m-%d %H:%M:%S')
                            if start_time is None:
                                start_time = timestamp
                            end_time = timestamp
                        except ValueError:
                            continue
            return start_time, end_time
        
        return None, None
        
    except Exception as e:
        print(f"Error extrayendo rango temporal de {file_path}: {e}")
        return None, None

def get_file_type(filename: str) -> str:
    """Determina el tipo de archivo basado en el nombre."""
    if filename.startswith('CAN_') and '_TRADUCIDO.csv' in filename:
        return 'CAN'
    elif filename.startswith('GPS_'):
        return 'GPS'
    elif filename.startswith('ESTABILIDAD_'):
        return 'ESTABILIDAD'
    elif filename.startswith('ROTATIVO_'):
        return 'ROTATIVO'
    else:
        return 'UNKNOWN'

def scan_doback022_files():
    """Escanea archivos de doback022 y busca sesiones."""
    base_path = Path("data/datosDoback/CMadrid/doback022")
    
    print("=" * 80)
    print("ESCANEO DE ARCHIVOS DOBACK022")
    print("=" * 80)
    
    all_files = []
    
    # Escanear archivos por tipo
    for file_type in ['CAN', 'GPS', 'estabilidad', 'ROTATIVO']:
        type_path = base_path / file_type
        if not type_path.exists():
            print(f"❌ Directorio no existe: {type_path}")
            continue
        
        print(f"\n📁 Tipo: {file_type}")
        files_found = 0
        
        # Buscar archivos según el tipo
        if file_type == 'CAN':
            # Para CAN, buscar archivos CSV decodificados
            for file_path in type_path.glob('*_TRADUCIDO.csv'):
                if 'RealTime' not in file_path.name:
                    start_time, end_time = extract_time_range_from_file(str(file_path), 'CAN')
                    if start_time and end_time:
                        all_files.append({
                            'path': str(file_path),
                            'name': file_path.name,
                            'type': 'CAN',
                            'start_time': start_time,
                            'end_time': end_time
                        })
                        print(f"  ✅ {file_path.name}: {start_time} - {end_time}")
                        files_found += 1
        else:
            # Para otros tipos, buscar archivos TXT
            for file_path in type_path.glob('*.txt'):
                if 'RealTime' not in file_path.name.lower():
                    actual_type = get_file_type(file_path.name)
                    start_time, end_time = extract_time_range_from_file(str(file_path), actual_type)
                    if start_time and end_time:
                        all_files.append({
                            'path': str(file_path),
                            'name': file_path.name,
                            'type': actual_type,
                            'start_time': start_time,
                            'end_time': end_time
                        })
                        print(f"  ✅ {file_path.name}: {start_time} - {end_time}")
                        files_found += 1
        
        print(f"  Total archivos {file_type}: {files_found}")
    
    print(f"\n📊 Total archivos escaneados: {len(all_files)}")
    
    # Agrupar por tipo
    files_by_type = {}
    for file_info in all_files:
        file_type = file_info['type']
        if file_type not in files_by_type:
            files_by_type[file_type] = []
        files_by_type[file_type].append(file_info)
    
    print(f"\n📋 Archivos por tipo:")
    for file_type, files in files_by_type.items():
        print(f"  {file_type}: {len(files)} archivos")
    
    return files_by_type

def find_sessions(files_by_type: Dict):
    """Busca sesiones completas usando solapamiento temporal."""
    print(f"\n🔍 BUSCANDO SESIONES COMPLETAS")
    print("=" * 80)
    
    required_types = ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']
    missing_types = [t for t in required_types if t not in files_by_type]
    
    if missing_types:
        print(f"❌ Faltan tipos: {missing_types}")
        return []
    
    sessions = []
    can_files = files_by_type['CAN']
    
    for i, can_file in enumerate(can_files):
        print(f"\n🔍 Analizando CAN {i+1}: {can_file['name']}")
        print(f"   Rango: {can_file['start_time']} - {can_file['end_time']}")
        
        session_files = {'CAN': can_file}
        session_complete = True
        
        for file_type in ['GPS', 'ESTABILIDAD', 'ROTATIVO']:
            best_match = None
            max_overlap = 0
            
            for file_info in files_by_type[file_type]:
                # Calcular solapamiento real
                latest_start = max(can_file['start_time'], file_info['start_time'])
                earliest_end = min(can_file['end_time'], file_info['end_time'])
                overlap = (earliest_end - latest_start).total_seconds()
                
                if overlap > 0 and overlap > max_overlap:
                    max_overlap = overlap
                    best_match = file_info
            
            if best_match:
                session_files[file_type] = best_match
                overlap_minutes = max_overlap / 60
                print(f"   ✅ {file_type}: {best_match['name']} (solapamiento: {overlap_minutes:.1f} min)")
            else:
                session_complete = False
                print(f"   ❌ {file_type}: No encontrado")
        
        if session_complete:
            # Calcular rango de la sesión
            all_starts = [f['start_time'] for f in session_files.values()]
            all_ends = [f['end_time'] for f in session_files.values()]
            session_start = max(all_starts)
            session_end = min(all_ends)
            
            session = {
                'files': session_files,
                'start_time': session_start,
                'end_time': session_end,
                'duration_minutes': (session_end - session_start).total_seconds() / 60
            }
            
            sessions.append(session)
            print(f"   🎉 SESIÓN COMPLETA ENCONTRADA!")
            print(f"      Rango: {session_start} - {session_end}")
            print(f"      Duración: {session['duration_minutes']:.1f} minutos")
    
    print(f"\n📊 Total sesiones encontradas: {len(sessions)}")
    return sessions

if __name__ == "__main__":
    files_by_type = scan_doback022_files()
    sessions = find_sessions(files_by_type)
    
    if sessions:
        print(f"\n🎯 RESUMEN FINAL")
        print("=" * 80)
        for i, session in enumerate(sessions, 1):
            print(f"\nSesión {i}:")
            print(f"  Rango: {session['start_time']} - {session['end_time']}")
            print(f"  Duración: {session['duration_minutes']:.1f} minutos")
            print(f"  Archivos:")
            for file_type, file_info in session['files'].items():
                print(f"    {file_type}: {file_info['name']}")
    else:
        print(f"\n❌ No se encontraron sesiones completas") 