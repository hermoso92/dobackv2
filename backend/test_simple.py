#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DOBACK SOFT - PROCESADOR DE PRUEBA SIMPLE
===============================================================================
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Set
import psycopg2

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('test_simple.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuración de directorios
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback')

# Configuración de base de datos
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'dobacksoft',
    'user': 'postgres',
    'password': 'postgres'
}

class SimpleTestProcessor:
    def __init__(self):
        self.data_dir = DATA_DIR
        self.db_config = DB_CONFIG
        self.organization_name = 'CMadrid'
        self.user_id = 'a8071944-989c-4627-b8a7-71aa03f24180'

    def run(self):
        """Ejecuta el procesador de prueba simple."""
        logger.info("🚀 Iniciando procesador de prueba simple")
        
        try:
            # Escanear archivos
            all_files = self._get_all_files()
            logger.info(f"📁 Total archivos encontrados: {len(all_files)}")
            
            # Agrupar por vehículo
            files_by_vehicle = {}
            for file_info in all_files:
                vehicle = file_info.get('vehicle', 'unknown')
                if vehicle not in files_by_vehicle:
                    files_by_vehicle[vehicle] = []
                files_by_vehicle[vehicle].append(file_info)
            
            # Mostrar resumen por vehículo
            logger.info("📊 === RESUMEN POR VEHÍCULO ===")
            for vehicle, files in files_by_vehicle.items():
                # Contar por tipo
                types = {}
                for file_info in files:
                    file_type = file_info.get('type')
                    types[file_type] = types.get(file_type, 0) + 1
                
                logger.info(f"  🚗 {vehicle}: {types}")
                
                # Verificar si tiene datos mínimos
                has_minimum = types.get('ESTABILIDAD', 0) > 0 or types.get('GPS', 0) > 0
                if has_minimum:
                    logger.info(f"     ✅ VÁLIDO - Tiene datos mínimos")
                else:
                    logger.info(f"     ❌ INVÁLIDO - No tiene datos mínimos")
            
            # Buscar vehículos válidos
            valid_vehicles = []
            for vehicle, files in files_by_vehicle.items():
                types = {}
                for file_info in files:
                    file_type = file_info.get('type')
                    types[file_type] = types.get(file_type, 0) + 1
                
                has_minimum = types.get('ESTABILIDAD', 0) > 0 or types.get('GPS', 0) > 0
                if has_minimum:
                    valid_vehicles.append(vehicle)
            
            logger.info(f"✅ Vehículos válidos encontrados: {len(valid_vehicles)}")
            logger.info(f"📋 Lista: {valid_vehicles}")
            
        except Exception as e:
            logger.error(f"Error en procesador de prueba: {e}")
            raise

    def _get_all_files(self) -> List[Dict]:
        """Obtiene todos los archivos del directorio de datos."""
        files = []
        
        for root, dirs, filenames in os.walk(self.data_dir):
            for filename in filenames:
                if filename.endswith(('.txt', '.csv')):
                    file_path = os.path.join(root, filename)
                    file_info = self._parse_filename(file_path)
                    if file_info:
                        files.append(file_info)
        
        return files

    def _parse_filename(self, file_path: str) -> Optional[Dict]:
        """Parsea el nombre del archivo para extraer información."""
        filename = os.path.basename(file_path)
        
        # Detectar tipo de archivo
        if 'CAN' in filename.upper():
            file_type = 'CAN'
        elif 'GPS' in filename.upper():
            file_type = 'GPS'
        elif 'ESTABILIDAD' in filename.upper():
            file_type = 'ESTABILIDAD'
        elif 'ROTATIVO' in filename.upper():
            file_type = 'ROTATIVO'
        else:
            return None
        
        # Extraer vehículo y fecha del nombre
        parts = filename.split('_')
        if len(parts) >= 3:
            vehicle = parts[1]
            date_str = parts[2]
            
            # Convertir fecha
            try:
                date = datetime.strptime(date_str, '%Y%m%d').date()
                return {
                    'path': file_path,
                    'filename': filename,
                    'type': file_type,
                    'vehicle': vehicle,
                    'date': date
                }
            except ValueError:
                return None
        
        return None

if __name__ == "__main__":
    processor = SimpleTestProcessor()
    processor.run()
