#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de prueba para verificar el procesamiento de datos rotativos.
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import List, Dict

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SimpleRotativoProcessor:
    """Procesador simple para datos rotativos."""
    
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback')
    
    def _split_flexible(self, line: str):
        """Divide una línea por coma o punto y coma."""
        if ';' in line:
            return [x.strip() for x in line.split(';')]
        return [x.strip() for x in line.split(',')]
    
    def load_rotativo_data(self, file_path: str) -> List[Dict]:
        """Carga datos rotativos desde un archivo CSV/TXT."""
        try:
            data = []
            logger.info(f"Procesando archivo rotativo: {file_path}")
            
            with open(file_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                
            logger.info(f"Archivo leído: {len(lines)} líneas")
            
            # Buscar cabecera de columnas
            data_start = None
            for i, line in enumerate(lines):
                if 'fecha' in line.lower() and 'estado' in line.lower():
                    data_start = i + 1
                    break
            else:
                data_start = 1  # Si no se encuentra cabecera, empezar desde la línea 1
            
            logger.info(f"Procesando {len(lines)-data_start} líneas de datos")
            lines_processed = 0
            lines_valid = 0
            
            for line in lines[data_start:]:
                line = line.strip()
                if not line:
                    continue
                    
                lines_processed += 1
                parts = self._split_flexible(line)
                
                if len(parts) >= 2:  # Mínimo: timestamp, valor
                    try:
                        # Parsear timestamp
                        timestamp_str = parts[0].replace('.', '').strip()
                        if timestamp_str and timestamp_str != 'Fecha-Hora':
                            timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                            
                            # Parsear valor y estado
                            value = float(parts[1]) if len(parts) > 1 and parts[1].replace('.', '').replace('-', '').isdigit() else 0.0
                            status = parts[2] if len(parts) > 2 else 'UNKNOWN'
                            
                            data.append({
                                'timestamp': timestamp,
                                'value': value,
                                'status': status
                            })
                            lines_valid += 1
                        
                    except (ValueError, IndexError) as e:
                        # Saltar líneas con errores de formato
                        continue
                        
            logger.info(f"Procesamiento completado: {lines_processed} líneas procesadas, {lines_valid} válidas")
            logger.info(f"Cargados {len(data)} puntos rotativo válidos")
            return data
            
        except Exception as e:
            logger.error(f"Error cargando datos rotativo: {e}")
            return []
    
    def find_rotativo_files(self) -> List[str]:
        """Encuentra todos los archivos rotativos en el directorio de datos."""
        rotativo_files = []
        
        if not os.path.exists(self.data_dir):
            logger.error(f"Directorio de datos no encontrado: {self.data_dir}")
            return rotativo_files
        
        for root, dirs, files in os.walk(self.data_dir):
            for file in files:
                if file.startswith('ROTATIVO_') and file.endswith('.txt'):
                    file_path = os.path.join(root, file)
                    rotativo_files.append(file_path)
        
        logger.info(f"Encontrados {len(rotativo_files)} archivos rotativos")
        return rotativo_files
    
    def process_all_rotativo_files(self):
        """Procesa todos los archivos rotativos encontrados."""
        rotativo_files = self.find_rotativo_files()
        
        if not rotativo_files:
            logger.warning("No se encontraron archivos rotativos para procesar")
            return
        
        total_points = 0
        
        for file_path in rotativo_files:
            logger.info(f"\n{'='*50}")
            logger.info(f"Procesando: {os.path.basename(file_path)}")
            
            data = self.load_rotativo_data(file_path)
            total_points += len(data)
            
            if data:
                # Mostrar algunos ejemplos
                logger.info(f"Primeros 3 puntos:")
                for i, point in enumerate(data[:3]):
                    logger.info(f"  {i+1}. {point['timestamp']} - Valor: {point['value']} - Estado: {point['status']}")
                
                logger.info(f"Últimos 3 puntos:")
                for i, point in enumerate(data[-3:]):
                    logger.info(f"  {i+1}. {point['timestamp']} - Valor: {point['value']} - Estado: {point['status']}")
        
        logger.info(f"\n{'='*50}")
        logger.info(f"RESUMEN: Procesados {len(rotativo_files)} archivos rotativos")
        logger.info(f"Total puntos válidos: {total_points}")

def main():
    """Función principal."""
    logger.info("Iniciando procesador de datos rotativos...")
    
    processor = SimpleRotativoProcessor()
    processor.process_all_rotativo_files()
    
    logger.info("Procesamiento completado.")

if __name__ == "__main__":
    main() 