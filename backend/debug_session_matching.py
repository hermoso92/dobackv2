#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de depuración para analizar por qué las sesiones no se emparejan correctamente.
"""

from complete_processor import DobackProcessor
from datetime import datetime

def debug_session_matching():
    """Analiza en detalle por qué las sesiones no se emparejan."""
    
    print("=" * 80)
    print("DEPURACIÓN DE EMPAREJAMIENTO DE SESIONES - DOBACK022")
    print("=" * 80)
    
    processor = DobackProcessor()
    processor.scan_files_and_find_sessions()
    
    # Filtrar solo archivos de doback022
    doback022_files = [f for f in processor.all_files if f['vehicle'] == 'doback022']
    
    # Agrupar por tipo
    files_by_type = {}
    for file_info in doback022_files:
        file_type = file_info['type']
        if file_type not in files_by_type:
            files_by_type[file_type] = []
        files_by_type[file_type].append(file_info)
    
    # Analizar cada archivo CAN
    can_files = files_by_type.get('CAN', [])
    
    for can_file in can_files:
        print(f"\n{'='*60}")
        print(f"ANALIZANDO CAN: {can_file['name']}")
        print(f"Rango CAN: {can_file['start_time']} - {can_file['end_time']}")
        print(f"{'='*60}")
        
        can_start = can_file['start_time']
        max_diff_minutes = 5
        
        for file_type in ['GPS', 'ESTABILIDAD', 'ROTATIVO']:
            print(f"\n--- {file_type} ---")
            
            if file_type not in files_by_type:
                print(f"❌ No hay archivos {file_type} disponibles")
                continue
            
            available_files = files_by_type[file_type]
            print(f"Archivos {file_type} disponibles: {len(available_files)}")
            
            valid_files = []
            invalid_files = []
            
            for file_info in available_files:
                f_start = file_info['start_time']
                f_end = file_info['end_time']
                
                # Verificar que no empiece demasiado antes del CAN (máximo 10 minutos)
                early_diff = (can_start - f_start).total_seconds() / 60.0
                within_early_limit = early_diff <= 10
                
                # Verificar solapamiento
                latest_start = max(can_start, f_start)
                earliest_end = min(can_file['end_time'], f_end)
                overlap = (earliest_end - latest_start).total_seconds()
                
                # Criterios de validación (nueva lógica)
                has_overlap = overlap > 0
                
                file_status = {
                    'file': file_info,
                    'early_diff_minutes': early_diff,
                    'within_early_limit': within_early_limit,
                    'has_overlap': has_overlap,
                    'overlap_seconds': overlap,
                    'valid': within_early_limit and has_overlap
                }
                
                if file_status['valid']:
                    valid_files.append(file_status)
                else:
                    invalid_files.append(file_status)
            
            # Mostrar archivos válidos
            if valid_files:
                print(f"✅ Archivos {file_type} VÁLIDOS ({len(valid_files)}):")
                for status in sorted(valid_files, key=lambda x: x['overlap_seconds'], reverse=True):
                    f = status['file']
                    print(f"  {f['name']}")
                    print(f"    Rango: {f['start_time']} - {f['end_time']}")
                    print(f"    Diferencia temprana: {status['early_diff_minutes']:.1f} min")
                    print(f"    Solapamiento: {status['overlap_seconds']:.0f} seg")
            else:
                print(f"❌ No hay archivos {file_type} válidos")
            
            # Mostrar archivos inválidos (solo los más cercanos)
            if invalid_files:
                print(f"❌ Archivos {file_type} INVÁLIDOS (mostrando los 3 con mayor solapamiento):")
                best_invalid = sorted(invalid_files, key=lambda x: x['overlap_seconds'], reverse=True)[:3]
                for status in best_invalid:
                    f = status['file']
                    reasons = []
                    if not status['within_early_limit']:
                        reasons.append("empieza > 10min antes")
                    if not status['has_overlap']:
                        reasons.append("sin solapamiento")
                    
                    print(f"  {f['name']}")
                    print(f"    Rango: {f['start_time']} - {f['end_time']}")
                    print(f"    Diferencia temprana: {status['early_diff_minutes']:.1f} min")
                    print(f"    Solapamiento: {status['overlap_seconds']:.0f} seg")
                    print(f"    Motivo: {', '.join(reasons)}")
        
        # Resumen de la sesión
        print(f"\n{'='*60}")
        print("RESUMEN DE LA SESIÓN:")
        
        # Verificar si se puede formar sesión
        can_form_session = True
        missing_types = []
        
        for file_type in ['GPS', 'ESTABILIDAD', 'ROTATIVO']:
            if file_type not in files_by_type:
                missing_types.append(file_type)
                can_form_session = False
                continue
            
            # Buscar archivos válidos para este tipo
            valid_count = 0
            for file_info in files_by_type[file_type]:
                f_start = file_info['start_time']
                early_diff = (can_start - f_start).total_seconds() / 60.0
                
                latest_start = max(can_start, f_start)
                earliest_end = min(can_file['end_time'], file_info['end_time'])
                overlap = (earliest_end - latest_start).total_seconds()
                
                if early_diff <= 10 and overlap > 0:
                    valid_count += 1
            
            if valid_count == 0:
                missing_types.append(file_type)
                can_form_session = False
        
        if can_form_session:
            print("✅ SESIÓN COMPLETA - Todos los tipos tienen archivos válidos")
        else:
            print("❌ SESIÓN INCOMPLETA")
            print(f"   Tipos faltantes o sin archivos válidos: {', '.join(missing_types)}")
        
        print(f"{'='*60}")

if __name__ == "__main__":
    debug_session_matching() 