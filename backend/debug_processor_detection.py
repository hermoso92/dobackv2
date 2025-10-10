#!/usr/bin/env python3
"""
Script de diagnóstico para ver qué archivos detecta el procesador principal
y por qué no encuentra los archivos de estabilidad.
"""

import os
from pathlib import Path
from complete_processor import DobackProcessor

def debug_file_detection():
    """Diagnostica la detección de archivos del procesador principal."""
    processor = DobackProcessor("CMadrid")
    
    print("=" * 80)
    print("DIAGNÓSTICO DE DETECCIÓN DE ARCHIVOS")
    print("=" * 80)
    
    # Escanear archivos manualmente
    all_files = []
    DATA_DIR = "data/datosDoback"
    
    print(f"Escaneando directorio: {DATA_DIR}")
    
    for root, dirs, files in os.walk(DATA_DIR):
        for file in files:
            if file.endswith(('.txt', '.csv')):
                file_path = os.path.join(root, file)
                file_type = processor._get_file_type(file)
                
                # Solo mostrar archivos de doback022
                if 'doback022' in file_path:
                    print(f"Archivo: {file}")
                    print(f"  Ruta: {file_path}")
                    print(f"  Tipo detectado: {file_type}")
                    
                    # Intentar extraer rango temporal
                    start_time, end_time = processor.extract_time_range_from_file(file_path, file_type)
                    if start_time and end_time:
                        print(f"  Rango: {start_time} - {end_time}")
                        all_files.append({
                            'path': file_path,
                            'name': file,
                            'type': file_type,
                            'start_time': start_time,
                            'end_time': end_time
                        })
                    else:
                        print(f"  ❌ No se pudo extraer rango temporal")
                    print()
    
    print(f"Total archivos doback022 con rangos válidos: {len(all_files)}")
    
    # Agrupar por tipo
    files_by_type = {}
    for file_info in all_files:
        file_type = file_info['type']
        if file_type not in files_by_type:
            files_by_type[file_type] = []
        files_by_type[file_type].append(file_info)
    
    print(f"\nArchivos por tipo:")
    for file_type, files in files_by_type.items():
        print(f"  {file_type}: {len(files)} archivos")
        for file_info in files:
            print(f"    - {file_info['name']}: {file_info['start_time']} - {file_info['end_time']}")
    
    # Verificar si faltan tipos
    required_types = ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO']
    missing_types = [t for t in required_types if t not in files_by_type]
    
    if missing_types:
        print(f"\n❌ Tipos faltantes: {missing_types}")
    else:
        print(f"\n✅ Todos los tipos están presentes")
    
    return files_by_type

if __name__ == "__main__":
    files_by_type = debug_file_detection() 