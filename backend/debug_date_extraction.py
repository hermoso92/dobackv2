#!/usr/bin/env python3
"""
Debug de Extracción de Fechas - Doback Soft
Verifica qué fechas está extrayendo el sistema de cada archivo
"""

import logging
from pathlib import Path
from comprehensive_session_finder import FileContentAnalyzer

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def debug_date_extraction():
    """Debug de extracción de fechas"""
    analyzer = FileContentAnalyzer()
    base_path = Path(__file__).parent / 'data' / 'datosDoback'
    
    # Verificar archivos específicos
    test_files = [
        ('CMadrid/doback022/can/CAN_DOBACK022_20250708_0_TRADUCIDO.csv', 'CAN'),
        ('CMadrid/doback022/gps/GPS_DOBACK022_20250708_0.txt', 'GPS'),
        ('CMadrid/doback022/estabilidad/ESTABILIDAD_DOBACK022_20250708_0.txt', 'ESTABILIDAD'),
        ('CMadrid/doback022/rotativo/ROTATIVO_DOBACK022_20250707_7.txt', 'ROTATIVO'),
        ('CMadrid/doback022/rotativo/ROTATIVO_DOBACK022_20250708_0.txt', 'ROTATIVO')
    ]
    
    print("="*60)
    print("DEBUG DE EXTRACCIÓN DE FECHAS")
    print("="*60)
    
    for test_file, file_type in test_files:
        file_path = base_path / test_file
        if file_path.exists():
            print(f"\nArchivo: {test_file}")
            print(f"Tipo: {file_type}")
            
            # Extraer fecha
            real_datetime = analyzer.extract_real_datetime_from_file(file_path, file_type)
            if real_datetime:
                print(f"Fecha extraída: {real_datetime}")
            else:
                print("❌ No se pudo extraer fecha")
                
            # Mostrar primeras líneas del archivo
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()[:5]
                print("Primeras líneas:")
                for i, line in enumerate(lines, 1):
                    print(f"  {i}: {line.strip()}")
            except Exception as e:
                print(f"Error leyendo archivo: {e}")
        else:
            print(f"\n❌ Archivo no encontrado: {test_file}")

if __name__ == "__main__":
    debug_date_extraction() 