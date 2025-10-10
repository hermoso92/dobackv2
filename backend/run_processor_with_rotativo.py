#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para ejecutar el procesador completo con funcionalidad de rotativo.
"""

import os
import sys
import logging

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Función principal."""
    logger.info("🚀 Iniciando procesador Doback Soft con funcionalidad de rotativo...")
    
    try:
        # Importar el procesador
        from complete_processor import DobackProcessor
        
        # Crear instancia del procesador
        processor = DobackProcessor()
        
        # Ejecutar el pipeline completo
        logger.info("📊 Ejecutando pipeline completo...")
        
        # 1. Decodificar archivos CAN
        logger.info("🔧 Paso 1: Decodificando archivos CAN...")
        processor.decode_can_files()
        
        # 2. Escanear archivos y encontrar sesiones
        logger.info("🔍 Paso 2: Escaneando archivos y encontrando sesiones...")
        sessions = processor.scan_files_and_find_sessions()
        
        if not sessions:
            logger.warning("⚠️  No se encontraron sesiones para procesar")
            return
        
        logger.info(f"✅ Encontradas {len(sessions)} sesiones")
        
        # 3. Subir sesiones a la base de datos
        logger.info("📤 Paso 3: Subiendo sesiones a la base de datos...")
        processor.upload_sessions_to_database(sessions)
        
        # 4. Generar reporte
        logger.info("📋 Paso 4: Generando reporte...")
        processor.generate_complete_report()
        
        logger.info("🎉 Procesamiento completado exitosamente!")
        
    except Exception as e:
        logger.error(f"❌ Error durante el procesamiento: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code) 