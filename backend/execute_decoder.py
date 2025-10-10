#!/usr/bin/env python3
"""
Script para ejecutar el decodificador CAN directamente
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    print("🔧 Ejecutando Decodificador CAN - CMadrid")
    print("=" * 50)
    
    # Ruta al decodificador
    decoder_path = Path(__file__).parent / 'data' / 'DECODIFICADOR CAN' / 'decodificador_can_unificado.py'
    
    # Ruta al archivo CAN específico
    can_file = Path(__file__).parent / 'data' / 'datosDoback' / 'CMadrid' / 'doback022' / 'CAN' / 'CAN_DOBACK022_20250714_3.txt'
    
    if not decoder_path.exists():
        print(f"❌ No se encuentra el decodificador: {decoder_path}")
        return
    
    if not can_file.exists():
        print(f"❌ No se encuentra el archivo CAN: {can_file}")
        return
    
    print(f"✅ Decodificador: {decoder_path}")
    print(f"✅ Archivo CAN: {can_file}")
    print(f"📊 Tamaño: {can_file.stat().st_size / 1024:.1f} KB")
    
    # Cambiar al directorio del decodificador
    decoder_dir = decoder_path.parent
    original_dir = os.getcwd()
    os.chdir(decoder_dir)
    
    try:
        print(f"\n🔄 Ejecutando decodificador...")
        
        # Copiar el archivo CAN al directorio del decodificador
        import shutil
        temp_file = decoder_dir / can_file.name
        shutil.copy2(can_file, temp_file)
        
        # Ejecutar el decodificador
        result = subprocess.run([
            sys.executable, 
            'decodificador_can_unificado.py',
            can_file.name
        ], capture_output=True, text=True, timeout=300)  # 5 minutos timeout
        
        if result.returncode == 0:
            print("✅ Decodificador ejecutado exitosamente")
            
            # Verificar archivo de salida
            output_file = decoder_dir / f"{can_file.stem}_TRADUCIDO.csv"
            if output_file.exists():
                print(f"📄 Archivo traducido creado: {output_file.name}")
                print(f"📊 Tamaño: {output_file.stat().st_size / 1024:.1f} KB")
                
                # Mover el archivo traducido a la ubicación original
                target_file = can_file.parent / f"{can_file.stem}_TRADUCIDO.csv"
                shutil.move(str(output_file), str(target_file))
                print(f"📁 Archivo movido a: {target_file}")
                
                # Mostrar primeras líneas
                print("\n📋 Primeras líneas del archivo traducido:")
                with open(target_file, 'r', encoding='utf-8') as f:
                    for i, line in enumerate(f):
                        if i < 10:  # Mostrar las primeras 10 líneas
                            print(f"   {line.strip()}")
                        else:
                            break
            else:
                print("❌ No se encontró el archivo traducido")
        else:
            print(f"❌ Error al ejecutar el decodificador")
            print(f"   Error: {result.stderr}")
            print(f"   Output: {result.stdout}")
            
    except subprocess.TimeoutExpired:
        print("⏰ Timeout al ejecutar el decodificador")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        # Limpiar archivo temporal
        if temp_file.exists():
            temp_file.unlink()
        os.chdir(original_dir)

if __name__ == "__main__":
    main() 