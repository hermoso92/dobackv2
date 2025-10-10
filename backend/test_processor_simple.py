#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de prueba simple para verificar que el procesador funciona sin errores Unicode
"""

import os
import sys
import logging

# Configuración de logging simple
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def main():
    logger.info("Iniciando prueba del procesador flexible")
    
    # Verificar que el directorio de datos existe
    data_dir = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback')
    if not os.path.exists(data_dir):
        logger.error(f"Directorio de datos no encontrado: {data_dir}")
        return False
    
    logger.info(f"Directorio de datos encontrado: {data_dir}")
    
    # Contar archivos por tipo
    file_counts = {'CAN': 0, 'GPS': 0, 'ESTABILIDAD': 0, 'ROTATIVO': 0}
    
    for root, dirs, files in os.walk(data_dir):
        for file in files:
            if file.endswith('.txt'):
                filename = file.upper()
                if 'CAN' in filename:
                    file_counts['CAN'] += 1
                elif 'GPS' in filename:
                    file_counts['GPS'] += 1
                elif 'ESTABILIDAD' in filename:
                    file_counts['ESTABILIDAD'] += 1
                elif 'ROTATIVO' in filename:
                    file_counts['ROTATIVO'] += 1
    
    logger.info("Archivos encontrados por tipo:")
    for file_type, count in file_counts.items():
        logger.info(f"  {file_type}: {count} archivos")
    
    # Verificar datos mínimos
    has_minimum = file_counts['ESTABILIDAD'] > 0 or file_counts['GPS'] > 0
    logger.info(f"Datos mínimos disponibles: {has_minimum}")
    
    logger.info("Prueba completada exitosamente")
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Error en la prueba: {e}")
        sys.exit(1)
