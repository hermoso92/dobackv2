#!/usr/bin/env python3
"""
Script para procesar todos los archivos CAN de todos los vehículos en CMadrid.
Este script ejecuta el decodificador CAN unificado en modo masivo.
"""

import os
import sys
from pathlib import Path

def main():
    """Ejecuta el procesamiento masivo de archivos CAN en CMadrid."""
    
    # Obtener la ruta del script actual
    script_dir = Path(__file__).parent
    decodificador_path = script_dir / 'decodificador_can_unificado.py'
    
    if not decodificador_path.exists():
        print(f"Error: No se encuentra el archivo {decodificador_path}")
        return 1
    
    print("Iniciando procesamiento masivo de archivos CAN en CMadrid...")
    print("=" * 60)
    
    # Cambiar al directorio del decodificador
    os.chdir(script_dir)
    
    # Ejecutar el decodificador en modo masivo
    try:
        import subprocess
        result = subprocess.run([
            sys.executable, 
            'decodificador_can_unificado.py', 
            '--cmadrid'
        ], check=True)
        
        print("\nProcesamiento completado exitosamente.")
        return 0
        
    except subprocess.CalledProcessError as e:
        print(f"\nError durante el procesamiento: {e}")
        return 1
    except Exception as e:
        print(f"\nError inesperado: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)