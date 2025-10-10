#!/usr/bin/env python3
"""
Automatización de Decodificación CAN - CMadrid doback022
Decodifica todos los archivos CAN y luego ejecuta análisis temporal estricto
"""

import os
import sys
import subprocess
import logging
from pathlib import Path
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def decode_can_files():
    """Decodifica todos los archivos CAN de CMadrid/doback022"""
    logger.info("🚀 Iniciando decodificación automática de archivos CAN...")
    
    # Rutas
    base_path = Path(__file__).parent / 'data' / 'datosDoback'
    cmadrid_path = base_path / 'CMadrid'
    doback022_can_path = cmadrid_path / 'doback022' / 'can'
    decoder_path = Path(__file__).parent / 'data' / 'DECODIFICADOR CAN' / 'decodificador_can_unificado.py'
    
    if not doback022_can_path.exists():
        logger.error(f"No se encuentra la ruta: {doback022_can_path}")
        return False
    
    if not decoder_path.exists():
        logger.error(f"No se encuentra el decodificador: {decoder_path}")
        return False
    
    # Buscar archivos CAN
    can_files = list(doback022_can_path.glob('*.txt'))
    if not can_files:
        logger.warning(f"No se encontraron archivos CAN en: {doback022_can_path}")
        return False
    
    logger.info(f"Encontrados {len(can_files)} archivos CAN para decodificar")
    
    # Decodificar cada archivo
    success_count = 0
    for can_file in can_files:
        try:
            logger.info(f"Decodificando: {can_file.name}")
            
            # Ejecutar decodificador
            result = subprocess.run([
                sys.executable, str(decoder_path), str(can_file)
            ], capture_output=True, text=True, cwd=decoder_path.parent)
            
            if result.returncode == 0:
                logger.info(f"✅ Decodificado exitosamente: {can_file.name}")
                success_count += 1
            else:
                logger.error(f"❌ Error decodificando {can_file.name}: {result.stderr}")
                
        except Exception as e:
            logger.error(f"❌ Error procesando {can_file.name}: {e}")
    
    logger.info(f"Decodificación completada: {success_count}/{len(can_files)} archivos exitosos")
    return success_count > 0

def run_strict_temporal_analysis():
    """Ejecuta el análisis temporal estricto después de la decodificación"""
    logger.info("🔍 Ejecutando análisis temporal estricto...")
    
    try:
        # Ejecutar el procesador estricto temporal
        result = subprocess.run([
            sys.executable, 'strict_temporal_processor.py'
        ], capture_output=True, text=True, cwd=Path(__file__).parent)
        
        if result.returncode == 0:
            logger.info("✅ Análisis temporal estricto completado")
            print("\n" + "="*60)
            print("RESULTADO DEL ANÁLISIS TEMPORAL ESTRICTO")
            print("="*60)
            print(result.stdout)
        else:
            logger.error(f"❌ Error en análisis temporal: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error ejecutando análisis temporal: {e}")
        return False
    
    return True

def main():
    """Función principal"""
    print("="*60)
    print("AUTOMATIZACIÓN: DECODIFICACIÓN CAN + ANÁLISIS TEMPORAL")
    print("Organización: CMadrid | Vehículo: doback022")
    print("="*60)
    
    # Paso 1: Decodificar archivos CAN
    if not decode_can_files():
        logger.error("❌ Falló la decodificación de archivos CAN")
        return
    
    # Paso 2: Ejecutar análisis temporal estricto
    if not run_strict_temporal_analysis():
        logger.error("❌ Falló el análisis temporal estricto")
        return
    
    logger.info("🎉 Proceso completado exitosamente")

if __name__ == "__main__":
    main() 