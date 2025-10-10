#!/usr/bin/env python3
"""
Script de prueba para procesamiento masivo CMadrid
"""

import sys
from pathlib import Path

def buscar_archivos_can_simple(directorio_base):
    """Busca archivos CAN de forma simple"""
    archivos_can = []
    directorio_base = Path(directorio_base)
    
    print(f"Explorando: {directorio_base}")
    
    if not directorio_base.exists():
        print(f"❌ El directorio {directorio_base} no existe")
        return archivos_can
    
    # Buscar en todas las subcarpetas de vehículos
    for vehiculo_dir in directorio_base.iterdir():
        if vehiculo_dir.is_dir() and vehiculo_dir.name.startswith('doback'):
            print(f"  Vehículo: {vehiculo_dir.name}")
            can_dir = vehiculo_dir / 'CAN'
            if can_dir.exists() and can_dir.is_dir():
                print(f"    Carpeta CAN encontrada")
                # Buscar archivos CAN sin procesar
                for archivo in can_dir.iterdir():
                    if archivo.is_file() and (archivo.suffix.lower() in ['.csv', '.txt']):
                        if '_TRADUCIDO' not in archivo.name:
                            archivos_can.append(str(archivo))
                            print(f"      ✓ {archivo.name}")
            else:
                print(f"    ❌ Carpeta CAN no encontrada")
    
    return archivos_can

def main():
    print("=== PROCESAMIENTO MASIVO CMADRID ===")
    print("=" * 50)
    
    # Directorio base de datos CMadrid
    directorio_cmadrid = Path(__file__).parent.parent / 'datosDoback' / 'CMadrid'
    print(f"Directorio objetivo: {directorio_cmadrid}")
    
    # Buscar archivos
    archivos_can = buscar_archivos_can_simple(directorio_cmadrid)
    
    print(f"\n📊 RESUMEN:")
    print(f"Total de archivos CAN encontrados: {len(archivos_can)}")
    
    if archivos_can:
        print("\nPrimeros 5 archivos:")
        for i, archivo in enumerate(archivos_can[:5]):
            print(f"  {i+1}. {Path(archivo).name}")
        
        if len(archivos_can) > 5:
            print(f"  ... y {len(archivos_can) - 5} más")
    
    print("\n=== FIN ===")

if __name__ == "__main__":
    main()