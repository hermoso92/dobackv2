#!/usr/bin/env python3
"""
Script de prueba para verificar el sistema de logging de errores.
"""

import sys
import os
from pathlib import Path

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from decodificador_can_unificado import DecodificadorCAN

def test_logging():
    """Prueba el sistema de logging de errores."""
    print("🧪 PROBANDO SISTEMA DE LOGGING DE ERRORES")
    print("=" * 50)
    
    # Crear instancia del decodificador
    decodificador = DecodificadorCAN()
    
    # Verificar archivos DBC
    if not decodificador.verificar_archivos_dbc():
        print("❌ No se pueden encontrar los archivos DBC necesarios.")
        return False
    
    print("✅ Archivos DBC encontrados")
    
    # Buscar un archivo CAN para probar
    base_dir = Path("../datosDoback/CMadrid")
    archivos_encontrados = []
    
    for vehiculo_dir in base_dir.iterdir():
        if vehiculo_dir.is_dir() and vehiculo_dir.name.startswith('doback'):
            can_dir = vehiculo_dir / 'CAN'
            if can_dir.exists():
                for archivo in can_dir.glob("CAN_*.txt"):
                    if '_TRADUCIDO' not in str(archivo):
                        archivos_encontrados.append(str(archivo))
                        break
                if archivos_encontrados:
                    break
    
    if not archivos_encontrados:
        print("❌ No se encontraron archivos CAN para probar")
        return False
    
    archivo_test = archivos_encontrados[0]
    print(f"📁 Archivo de prueba: {Path(archivo_test).name}")
    
    # Eliminar archivo traducido si existe para forzar procesamiento
    archivo_traducido = Path(archivo_test).parent / f"{Path(archivo_test).stem}_TRADUCIDO.csv"
    if archivo_traducido.exists():
        archivo_traducido.unlink()
        print("🗑️ Archivo traducido eliminado para forzar procesamiento")
    
    # Procesar archivo
    print("🔄 Procesando archivo...")
    resultado = decodificador.procesar_archivo(archivo_test)
    
    if resultado:
        print("✅ Archivo procesado exitosamente")
    else:
        print("❌ Error en el procesamiento del archivo")
    
    # Verificar si se generó archivo de errores
    archivos_errores = list(Path('.').glob('errores_can_*.log'))
    if archivos_errores:
        archivo_errores = archivos_errores[-1]  # El más reciente
        print(f"📝 Archivo de errores generado: {archivo_errores.name}")
        
        # Mostrar contenido del archivo de errores
        with open(archivo_errores, 'r', encoding='utf-8') as f:
            contenido = f.read()
            print("\n📋 CONTENIDO DEL ARCHIVO DE ERRORES:")
            print("-" * 40)
            print(contenido[:1000] + "..." if len(contenido) > 1000 else contenido)
    else:
        print("ℹ️ No se generó archivo de errores (posiblemente no hubo errores)")
    
    return True

if __name__ == "__main__":
    test_logging()