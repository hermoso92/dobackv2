#!/usr/bin/env python3
"""
Script para decodificar todos los archivos CAN de la organización CMadrid
Usa el decodificador CAN unificado para procesar todos los archivos .txt y .csv
de las carpetas CAN de todos los vehículos de CMadrid.
"""

import os
import sys
import time
from pathlib import Path
from datetime import datetime
import logging

# Importar el decodificador directamente
decoder_path = Path(__file__).parent.parent / 'data' / 'DECODIFICADOR CAN' / 'decodificador_can_unificado.py'

if not decoder_path.exists():
    print(f"Error: No se encuentra el decodificador en: {decoder_path}")
    sys.exit(1)

# Importar el módulo dinámicamente
import importlib.util
spec = importlib.util.spec_from_file_location("decodificador_can_unificado", decoder_path)
decodificador_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(decodificador_module)
DecodificadorCAN = decodificador_module.DecodificadorCAN

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'decode_cmadrid_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CMadridCANDecoder:
    def __init__(self):
        self.base_path = Path(__file__).parent.parent / 'data' / 'datosDoback' / 'CMadrid'
        self.decoder = DecodificadorCAN()
        self.stats = {
            'total_files': 0,
            'processed_files': 0,
            'failed_files': 0,
            'total_messages': 0,
            'start_time': None,
            'end_time': None
        }
        
    def find_all_can_files(self):
        """Encuentra todos los archivos CAN en las carpetas de CMadrid"""
        can_files = []
        
        if not self.base_path.exists():
            logger.error(f"❌ No se encuentra el directorio base: {self.base_path}")
            return can_files
            
        logger.info(f"🔍 Buscando archivos CAN en: {self.base_path}")
        
        # Buscar en todos los vehículos
        for vehicle_dir in self.base_path.iterdir():
            if not vehicle_dir.is_dir():
                continue
                
            vehicle_name = vehicle_dir.name
            can_dir = vehicle_dir / 'CAN'
            
            if not can_dir.exists():
                logger.debug(f"   No se encuentra carpeta CAN en {vehicle_name}")
                continue
                
            logger.info(f"📁 Procesando vehículo: {vehicle_name}")
            
            # Buscar archivos CAN (.txt y .csv)
            for file_path in can_dir.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in ['.txt', '.csv']:
                    # Excluir archivos ya traducidos
                    if '_TRADUCIDO' not in file_path.name:
                        can_files.append({
                            'vehicle': vehicle_name,
                            'file_path': file_path,
                            'file_size': file_path.stat().st_size
                        })
                        logger.debug(f"   ✅ Encontrado: {file_path.name} ({file_path.stat().st_size / 1024:.1f} KB)")
        
        logger.info(f"📊 Total archivos CAN encontrados: {len(can_files)}")
        return can_files
    
    def process_file(self, file_info):
        """Procesa un archivo CAN individual"""
        vehicle = file_info['vehicle']
        file_path = file_info['file_path']
        
        logger.info(f"🔄 Procesando: {vehicle}/{file_path.name}")
        
        try:
            # Cambiar al directorio del archivo para que el decodificador funcione correctamente
            original_cwd = os.getcwd()
            os.chdir(file_path.parent)
            
            # Procesar el archivo
            success = self.decoder.procesar_archivo(file_path.name)
            
            # Restaurar directorio original
            os.chdir(original_cwd)
            
            if success:
                self.stats['processed_files'] += 1
                logger.info(f"✅ Completado: {vehicle}/{file_path.name}")
                return True
            else:
                self.stats['failed_files'] += 1
                logger.error(f"❌ Falló: {vehicle}/{file_path.name}")
                return False
                
        except Exception as e:
            self.stats['failed_files'] += 1
            logger.error(f"❌ Error procesando {vehicle}/{file_path.name}: {e}")
            return False
    
    def run(self):
        """Ejecuta el proceso completo de decodificación"""
        logger.info("🚀 Iniciando decodificación CAN para CMadrid")
        self.stats['start_time'] = datetime.now()
        
        # Verificar archivos DBC
        if not self.decoder.verificar_archivos_dbc():
            logger.error("❌ No se pueden encontrar los archivos DBC necesarios")
            return False
        
        # Encontrar todos los archivos CAN
        can_files = self.find_all_can_files()
        if not can_files:
            logger.warning("⚠️ No se encontraron archivos CAN para procesar")
            return False
        
        self.stats['total_files'] = len(can_files)
        
        # Procesar archivos por tamaño (más pequeños primero)
        can_files.sort(key=lambda x: x['file_size'])
        
        logger.info(f"📋 Archivos a procesar (ordenados por tamaño):")
        for i, file_info in enumerate(can_files, 1):
            size_mb = file_info['file_size'] / (1024 * 1024)
            logger.info(f"   {i:2d}. {file_info['vehicle']}/{file_info['file_path'].name} ({size_mb:.1f} MB)")
        
        # Procesar cada archivo
        for i, file_info in enumerate(can_files, 1):
            logger.info(f"\n📁 Progreso: {i}/{len(can_files)}")
            self.process_file(file_info)
            
            # Pausa breve entre archivos grandes
            if file_info['file_size'] > 10 * 1024 * 1024:  # > 10MB
                logger.info("⏸️ Pausa de 2 segundos para archivo grande...")
                time.sleep(2)
        
        # Generar reporte final
        self.stats['end_time'] = datetime.now()
        self.generate_report()
        
        return True
    
    def generate_report(self):
        """Genera un reporte final del procesamiento"""
        duration = self.stats['end_time'] - self.stats['start_time']
        
        logger.info("\n" + "="*60)
        logger.info("📊 REPORTE FINAL DE DECODIFICACIÓN CAN - CMADRID")
        logger.info("="*60)
        logger.info(f"⏱️  Tiempo total: {duration}")
        logger.info(f"📁 Archivos totales: {self.stats['total_files']}")
        logger.info(f"✅ Archivos procesados: {self.stats['processed_files']}")
        logger.info(f"❌ Archivos fallidos: {self.stats['failed_files']}")
        logger.info(f"📈 Tasa de éxito: {(self.stats['processed_files']/self.stats['total_files']*100):.1f}%")
        
        if self.stats['failed_files'] > 0:
            logger.warning("⚠️ Algunos archivos fallaron. Revisa el log para detalles.")
        else:
            logger.info("🎉 ¡Todos los archivos procesados exitosamente!")
        
        logger.info("="*60)

def main():
    """Función principal"""
    print("🔧 Decodificador CAN - Organización CMadrid")
    print("=" * 50)
    
    decoder = CMadridCANDecoder()
    
    try:
        success = decoder.run()
        if success:
            print("\n✅ Proceso completado. Revisa el log para detalles.")
        else:
            print("\n❌ El proceso falló. Revisa el log para errores.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n⏹️ Proceso interrumpido por el usuario.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        print(f"\n❌ Error inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 