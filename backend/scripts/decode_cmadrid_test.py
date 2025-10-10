#!/usr/bin/env python3
"""
Script de prueba para decodificar un archivo CAN pequeño de CMadrid
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Importar el decodificador directamente
decoder_path = Path(__file__).parent.parent / 'data' / 'DECODIFICADOR CAN' / 'decodificador_can_unificado.py'

if not decoder_path.exists():
    print(f"Error: No se encuentra el decodificador en: {decoder_path}")
    sys.exit(1)

# Importar el módulo dinámicamente
import importlib.util
spec = importlib.util.spec_from_file_location("decodificador_can_unificado", decoder_path)
decodificador_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(decodificador_module)
DecodificadorCAN = decodificador_module.DecodificadorCAN

def main():
    print("🧪 Prueba de Decodificador CAN - CMadrid")
    print("=" * 50)
    
    # Ruta al archivo de prueba (uno de los más pequeños)
    test_file = Path(__file__).parent.parent / 'data' / 'datosDoback' / 'CMadrid' / 'doback022' / 'CAN' / 'CAN_DOBACK022_20250714_3.txt'
    
    if not test_file.exists():
        print(f"❌ No se encuentra el archivo de prueba: {test_file}")
        sys.exit(1)
    
    print(f"📁 Archivo de prueba: {test_file.name}")
    print(f"📊 Tamaño: {test_file.stat().st_size / 1024:.1f} KB")
    
    # Crear instancia del decodificador
    decoder = DecodificadorCAN()
    
    # Verificar archivos DBC
    if not decoder.verificar_archivos_dbc():
        print("❌ No se pueden encontrar los archivos DBC necesarios")
        sys.exit(1)
    
    print("✅ Archivos DBC verificados")
    
    # Cambiar al directorio del archivo
    original_cwd = os.getcwd()
    os.chdir(test_file.parent)
    
    try:
        print(f"\n🔄 Procesando archivo...")
        success = decoder.procesar_archivo(test_file.name)
        
        if success:
            print("✅ Archivo procesado exitosamente")
            
            # Verificar si se creó el archivo traducido
            translated_file = test_file.parent / f"{test_file.stem}_TRADUCIDO.csv"
            if translated_file.exists():
                print(f"📄 Archivo traducido creado: {translated_file.name}")
                print(f"📊 Tamaño del archivo traducido: {translated_file.stat().st_size / 1024:.1f} KB")
                
                # Mostrar primeras líneas del archivo traducido
                print("\n📋 Primeras líneas del archivo traducido:")
                with open(translated_file, 'r', encoding='utf-8') as f:
                    for i, line in enumerate(f):
                        if i < 10:  # Mostrar solo las primeras 10 líneas
                            print(f"   {line.strip()}")
                        else:
                            break
            else:
                print("❌ No se encontró el archivo traducido")
        else:
            print("❌ Error al procesar el archivo")
            
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
    finally:
        # Restaurar directorio original
        os.chdir(original_cwd)

if __name__ == "__main__":
    main() 