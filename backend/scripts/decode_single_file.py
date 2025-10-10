#!/usr/bin/env python3
"""
Script para procesar un solo archivo CAN específico
"""

import os
import sys
from pathlib import Path

def main():
    print("🔧 Procesamiento de Archivo CAN Individual")
    print("=" * 50)
    
    # Archivo específico a procesar (uno de los más pequeños)
    target_file = "data/datosDoback/CMadrid/doback022/CAN/CAN_DOBACK022_20250714_3.txt"
    
    if not os.path.exists(target_file):
        print(f"❌ No se encuentra el archivo: {target_file}")
        return
    
    print(f"📁 Archivo objetivo: {target_file}")
    print(f"📊 Tamaño: {os.path.getsize(target_file) / 1024:.1f} KB")
    
    # Cambiar al directorio del archivo
    file_path = Path(target_file)
    original_dir = os.getcwd()
    os.chdir(file_path.parent)
    
    try:
        print(f"\n🔄 Procesando archivo...")
        
        # Ejecutar el decodificador directamente
        decoder_script = Path(original_dir) / "data" / "DECODIFICADOR CAN" / "decodificador_can_unificado.py"
        
        if not decoder_script.exists():
            print(f"❌ No se encuentra el decodificador: {decoder_script}")
            return
        
        # Importar y ejecutar el decodificador
        import importlib.util
        spec = importlib.util.spec_from_file_location("decodificador", decoder_script)
        decoder_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(decoder_module)
        
        # Crear instancia y procesar
        decoder = decoder_module.DecodificadorCAN()
        success = decoder.procesar_archivo(file_path.name)
        
        if success:
            print("✅ Archivo procesado exitosamente")
            
            # Verificar archivo de salida
            output_file = f"{file_path.stem}_TRADUCIDO.csv"
            if os.path.exists(output_file):
                print(f"📄 Archivo de salida creado: {output_file}")
                print(f"📊 Tamaño: {os.path.getsize(output_file) / 1024:.1f} KB")
            else:
                print("❌ No se encontró el archivo de salida")
        else:
            print("❌ Error al procesar el archivo")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        os.chdir(original_dir)

if __name__ == "__main__":
    main() 