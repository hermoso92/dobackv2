#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de prueba para verificar las correcciones del procesador
con el vehículo doback022.
"""

import os
import sys
from datetime import datetime
from complete_processor import DobackProcessor

def test_processor_corrections():
    """Prueba las correcciones del procesador con doback022."""
    
    print("=" * 80)
    print("PRUEBA DE CORRECCIONES DEL PROCESADOR - DOBACK022")
    print("=" * 80)
    
    # Inicializar procesador
    processor = DobackProcessor()
    
    # Escanear archivos
    print("\n1. ESCANEANDO ARCHIVOS...")
    processor.scan_files_and_find_sessions()
    
    # Filtrar solo archivos de doback022
    doback022_files = [f for f in processor.all_files if f['vehicle'] == 'doback022']
    
    print(f"\nArchivos encontrados para doback022: {len(doback022_files)}")
    
    # Agrupar por tipo
    files_by_type = {}
    for file_info in doback022_files:
        file_type = file_info['type']
        if file_type not in files_by_type:
            files_by_type[file_type] = []
        files_by_type[file_type].append(file_info)
    
    # Mostrar archivos por tipo
    print("\n2. ARCHIVOS POR TIPO:")
    for file_type, files in files_by_type.items():
        print(f"\n{file_type}: {len(files)} archivos")
        for file_info in files:
            print(f"  {file_info['name']}")
            print(f"    Rango: {file_info['start_time']} - {file_info['end_time']}")
    
    # Buscar sesiones
    print("\n3. BUSCANDO SESIONES...")
    can_files = files_by_type.get('CAN', [])
    sessions_found = []
    
    for can_file in can_files:
        print(f"\nAnalizando CAN: {can_file['name']}")
        print(f"  Rango: {can_file['start_time']} - {can_file['end_time']}")
        
        session = processor._find_matching_session(can_file, files_by_type)
        if session:
            print("  ✅ SESIÓN ENCONTRADA:")
            for file_type, file_info in session['files'].items():
                time_diff = abs((file_info['start_time'] - can_file['start_time']).total_seconds() / 60)
                print(f"    {file_type}: {file_info['name']}")
                print(f"      Rango: {file_info['start_time']} - {file_info['end_time']}")
                print(f"      Diferencia: {time_diff:.1f} min")
            
            # Calcular máxima diferencia
            max_diff = 0
            for file_type, file_info in session['files'].items():
                if file_type != 'CAN':
                    time_diff = abs((file_info['start_time'] - can_file['start_time']).total_seconds() / 60)
                    max_diff = max(max_diff, time_diff)
            
            print(f"    Máxima diferencia: {max_diff:.1f} min")
            sessions_found.append(session)
        else:
            print("  ❌ No se encontró sesión completa")
    
    print(f"\n4. RESUMEN:")
    print(f"Sesiones completas encontradas: {len(sessions_found)}")
    
    # Verificar contra el análisis esperado
    expected_sessions = [
        "2025-07-07 17:21",  # Sesión 1
        "2025-07-08 07:41",  # Sesión 2  
        "2025-07-08 09:12",  # Sesión 3
        "2025-07-08 11:28",  # Sesión 4 (incompleta)
        "2025-07-09 09:15"   # Sesión 5
    ]
    
    print(f"\n5. VERIFICACIÓN CONTRA ANÁLISIS ESPERADO:")
    for expected in expected_sessions:
        found = False
        for session in sessions_found:
            session_start = session['start_time'].strftime("%Y-%m-%d %H:%M")
            if session_start == expected:
                found = True
                break
        
        status = "✅" if found else "❌"
        print(f"{status} {expected}")
    
    return sessions_found

if __name__ == "__main__":
    test_processor_corrections() 