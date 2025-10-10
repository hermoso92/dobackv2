#!/usr/bin/env python3
"""
Script directo para decodificar archivos CAN de CMadrid
Usa el decodificador sin importaciones complejas
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    print("🔧 Decodificador CAN Directo - CMadrid")
    print("=" * 50)
    
    # Ruta al decodificador
    decoder_path = Path(__file__).parent.parent / 'data' / 'DECODIFICADOR CAN' / 'decodificador_can_unificado.py'
    
    if not decoder_path.exists():
        print(f"❌ No se encuentra el decodificador: {decoder_path}")
        return
    
    # Ruta a los datos de CMadrid
    cmadrid_path = Path(__file__).parent.parent / 'data' / 'datosDoback' / 'CMadrid'
    
    if not cmadrid_path.exists():
        print(f"❌ No se encuentra la carpeta CMadrid: {cmadrid_path}")
        return
    
    print(f"✅ Decodificador encontrado: {decoder_path}")
    print(f"✅ Datos CMadrid encontrados: {cmadrid_path}")
    
    # Encontrar archivos CAN
    can_files = []
    for vehicle_dir in cmadrid_path.iterdir():
        if not vehicle_dir.is_dir():
            continue
            
        can_dir = vehicle_dir / 'CAN'
        if can_dir.exists():
            for file_path in can_dir.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in ['.txt', '.csv']:
                    if '_TRADUCIDO' not in file_path.name:
                        can_files.append(file_path)
    
    print(f"📊 Total archivos CAN encontrados: {len(can_files)}")
    
    if not can_files:
        print("❌ No se encontraron archivos CAN para procesar")
        return
    
    # Procesar archivos uno por uno
    processed = 0
    failed = 0
    
    for i, file_path in enumerate(can_files, 1):
        print(f"\n📁 Procesando {i}/{len(can_files)}: {file_path.name}")
        
        try:
            # Cambiar al directorio del archivo
            os.chdir(file_path.parent)
            
            # Ejecutar el decodificador directamente
            result = subprocess.run([
                sys.executable, 
                str(decoder_path), 
                file_path.name
            ], capture_output=True, text=True, timeout=300)  # 5 minutos timeout
            
            if result.returncode == 0:
                print(f"✅ Completado: {file_path.name}")
                processed += 1
            else:
                print(f"❌ Error: {file_path.name}")
                print(f"   Error: {result.stderr}")
                failed += 1
                
        except subprocess.TimeoutExpired:
            print(f"⏰ Timeout: {file_path.name}")
            failed += 1
        except Exception as e:
            print(f"❌ Excepción: {file_path.name} - {e}")
            failed += 1
    
    # Reporte final
    print(f"\n📊 REPORTE FINAL:")
    print(f"   Total archivos: {len(can_files)}")
    print(f"   Procesados: {processed}")
    print(f"   Fallidos: {failed}")
    print(f"   Tasa de éxito: {(processed/len(can_files)*100):.1f}%")

if __name__ == "__main__":
    main() 