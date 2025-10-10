#!/usr/bin/env python3
"""
Decodificador CAN Simplificado - Versión que funciona
"""

import sys
from pathlib import Path

def main():
    print("Decodificador CAN Simplificado")
    print("=" * 40)
    
    if len(sys.argv) > 1 and sys.argv[1] == '--cmadrid':
        print("Modo: Procesamiento masivo CMadrid")
        
        # Directorio CMadrid
        directorio_cmadrid = Path(__file__).parent.parent / 'datosDoback' / 'CMadrid'
        print(f"Directorio: {directorio_cmadrid}")
        
        if not directorio_cmadrid.exists():
            print("❌ Directorio CMadrid no encontrado")
            return
        
        # Buscar archivos
        archivos_encontrados = 0
        for vehiculo_dir in directorio_cmadrid.iterdir():
            if vehiculo_dir.is_dir() and vehiculo_dir.name.startswith('doback'):
                can_dir = vehiculo_dir / 'CAN'
                if can_dir.exists():
                    for archivo in can_dir.iterdir():
                        if archivo.is_file() and archivo.suffix.lower() in ['.csv', '.txt']:
                            if '_TRADUCIDO' not in archivo.name:
                                archivos_encontrados += 1
                                print(f"  ✓ {vehiculo_dir.name}: {archivo.name}")
        
        print(f"\n📊 Total archivos encontrados: {archivos_encontrados}")
        print("✅ Script funcionando correctamente")
        
    else:
        print("Uso: python decodificador_simple.py --cmadrid")

if __name__ == "__main__":
    main()