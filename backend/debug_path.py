#!/usr/bin/env python3
"""
Script de debug para verificar rutas y encontrar archivos de CMadrid
"""

import os
from pathlib import Path

def debug_paths():
    print("🔍 DEBUG DE RUTAS")
    print("=" * 50)
    
    # Ruta actual
    current_dir = Path.cwd()
    print(f"Directorio actual: {current_dir}")
    
    # Ruta del script
    script_dir = Path(__file__).parent
    print(f"Directorio del script: {script_dir}")
    
    # Ruta esperada de datos
    expected_data_path = script_dir.parent / "data" / "datosDoback"
    print(f"Ruta esperada de datos: {expected_data_path}")
    print(f"¿Existe?: {expected_data_path.exists()}")
    
    # Buscar datos en diferentes ubicaciones
    possible_paths = [
        script_dir.parent / "data" / "datosDoback",
        script_dir / "data" / "datosDoback", 
        Path("data/datosDoback"),
        Path("../data/datosDoback"),
        Path("../../data/datosDoback"),
        Path("../../../data/datosDoback")
    ]
    
    print(f"\n🔍 BUSCANDO DATOS EN DIFERENTES UBICACIONES:")
    for path in possible_paths:
        print(f"  {path}: {'✅' if path.exists() else '❌'}")
        if path.exists():
            print(f"    Contenido: {list(path.iterdir())}")
            
            # Buscar CMadrid específicamente
            cmadrid_path = path / "CMadrid"
            if cmadrid_path.exists():
                print(f"    ✅ CMadrid encontrado en: {cmadrid_path}")
                print(f"    Contenido CMadrid: {list(cmadrid_path.iterdir())}")
                
                # Contar archivos recursivamente
                file_count = 0
                for root, dirs, files in os.walk(cmadrid_path):
                    file_count += len(files)
                print(f"    Total archivos en CMadrid: {file_count}")
            else:
                print(f"    ❌ CMadrid no encontrado en: {path}")

if __name__ == "__main__":
    debug_paths() 