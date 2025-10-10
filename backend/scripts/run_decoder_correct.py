#!/usr/bin/env python3
"""
Script para ejecutar el decodificador CAN con la ruta correcta
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    print("🔧 Ejecutando Decodificador CAN - CMadrid")
    print("=" * 50)
    
    # Ruta al decodificador
    decoder_dir = Path(__file__).parent.parent / 'data' / 'DECODIFICADOR CAN'
    decoder_script = decoder_dir / 'decodificador_can_unificado.py'
    
    # Ruta a los archivos CAN de CMadrid
    cmadrid_can_dir = Path(__file__).parent.parent / 'data' / 'datosDoback' / 'CMadrid' / 'doback022' / 'CAN'
    
    if not decoder_script.exists():
        print(f"❌ No se encuentra el decodificador: {decoder_script}")
        return
    
    if not cmadrid_can_dir.exists():
        print(f"❌ No se encuentra la carpeta CAN: {cmadrid_can_dir}")
        return
    
    print(f"✅ Decodificador: {decoder_script}")
    print(f"✅ Carpeta CAN: {cmadrid_can_dir}")
    
    # Encontrar archivos CAN
    can_files = list(cmadrid_can_dir.glob("*.txt"))
    can_files = [f for f in can_files if '_TRADUCIDO' not in f.name]
    
    print(f"📊 Archivos CAN encontrados: {len(can_files)}")
    
    if not can_files:
        print("❌ No se encontraron archivos CAN para procesar")
        return
    
    # Mostrar archivos encontrados
    print("\n📋 Archivos a procesar:")
    for i, file_path in enumerate(can_files, 1):
        size_kb = file_path.stat().st_size / 1024
        print(f"   {i:2d}. {file_path.name} ({size_kb:.1f} KB)")
    
    # Cambiar al directorio del decodificador
    original_dir = os.getcwd()
    os.chdir(decoder_dir)
    
    try:
        print(f"\n🔄 Ejecutando decodificador...")
        
        # Ejecutar el decodificador con los archivos específicos
        for i, file_path in enumerate(can_files, 1):
            print(f"\n📁 Procesando {i}/{len(can_files)}: {file_path.name}")
            
            # Copiar el archivo al directorio del decodificador temporalmente
            import shutil
            temp_file = decoder_dir / file_path.name
            shutil.copy2(file_path, temp_file)
            
            try:
                # Ejecutar el decodificador
                result = subprocess.run([
                    sys.executable, 
                    'decodificador_can_unificado.py',
                    file_path.name
                ], capture_output=True, text=True, timeout=600)  # 10 minutos timeout
                
                if result.returncode == 0:
                    print(f"✅ Completado: {file_path.name}")
                    
                    # Mover el archivo traducido de vuelta
                    translated_file = decoder_dir / f"{file_path.stem}_TRADUCIDO.csv"
                    if translated_file.exists():
                        target_translated = file_path.parent / f"{file_path.stem}_TRADUCIDO.csv"
                        shutil.move(str(translated_file), str(target_translated))
                        print(f"📄 Archivo traducido: {target_translated.name}")
                else:
                    print(f"❌ Error: {file_path.name}")
                    print(f"   Error: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                print(f"⏰ Timeout: {file_path.name}")
            except Exception as e:
                print(f"❌ Excepción: {file_path.name} - {e}")
            finally:
                # Limpiar archivo temporal
                if temp_file.exists():
                    temp_file.unlink()
        
        print(f"\n🎉 Proceso completado!")
        
    except Exception as e:
        print(f"❌ Error general: {e}")
    finally:
        os.chdir(original_dir)

if __name__ == "__main__":
    main() 