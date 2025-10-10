#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de prueba para verificar que el procesador flexible funciona sin errores Unicode
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

def test_processor():
    logger.info("Iniciando prueba del procesador flexible")
    
    try:
        # Importar el procesador
        from complete_processor_flexible import FlexibleSessionProcessor
        
        # Crear instancia del procesador
        processor = FlexibleSessionProcessor()
        
        # Ejecutar escaneo de archivos
        logger.info("Ejecutando escaneo de archivos...")
        sessions = processor.scan_files_and_find_sessions()
        
        logger.info(f"Sesiones encontradas: {len(sessions)}")
        
        if sessions:
            logger.info("Primeras 3 sesiones encontradas:")
            for i, session in enumerate(sessions[:3]):
                logger.info(f"  {i+1}. {session['id']} - Tipos: {session.get('available_types', [])}")
        
        logger.info("Prueba completada exitosamente")
        return True
        
    except Exception as e:
        logger.error(f"Error en la prueba: {e}")
        return False

if __name__ == "__main__":
    try:
        success = test_processor()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Error crítico: {e}")
        sys.exit(1)
