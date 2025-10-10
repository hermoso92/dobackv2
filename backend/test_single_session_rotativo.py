#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para probar el procesamiento de una sesión específica con datos rotativos.
"""

import os
import sys
import logging
import json
from datetime import datetime

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SimpleSessionProcessor:
    """Procesador simple para una sesión con datos rotativos."""
    
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(__file__), 'data', 'datosDoback')
    
    def _split_flexible(self, line: str):
        """Divide una línea por coma o punto y coma."""
        if ';' in line:
            return [x.strip() for x in line.split(';')]
        return [x.strip() for x in line.split(',')]
    
    def load_rotativo_data(self, file_path: str) -> list:
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
    
    def simulate_database_upload(self, session_id: str, rotativo_data: list):
        """Simula la subida de datos rotativos a la base de datos."""
        logger.info(f"📤 Simulando subida de sesión {session_id} a la base de datos...")
        
        if not rotativo_data:
            logger.warning("⚠️  No hay datos rotativos para subir")
            return
        
        logger.info(f"📊 Subiendo {len(rotativo_data)} puntos rotativos...")
        
        # Simular inserción en base de datos
        for i, point in enumerate(rotativo_data[:5]):  # Mostrar solo los primeros 5
            logger.info(f"  📍 Punto {i+1}: {point['timestamp']} - Valor: {point['value']} - Estado: {point['status']}")
        
        if len(rotativo_data) > 5:
            logger.info(f"  ... y {len(rotativo_data) - 5} puntos más")
        
        logger.info(f"✅ Simulación completada: {len(rotativo_data)} puntos rotativos procesados")
    
    def process_session_with_rotativo(self, vehicle: str, date: str, session_num: str):
        """Procesa una sesión específica con datos rotativos."""
        logger.info(f"🔍 Procesando sesión: {vehicle} - {date} - {session_num}")
        
        # Construir ruta del archivo rotativo
        rotativo_filename = f"ROTATIVO_{vehicle}_{date}_{session_num}.txt"
        rotativo_path = os.path.join(self.data_dir, 'CMadrid', vehicle.lower(), 'ROTATIVO', rotativo_filename)
        
        if not os.path.exists(rotativo_path):
            logger.error(f"❌ Archivo rotativo no encontrado: {rotativo_path}")
            return False
        
        # Cargar datos rotativos
        rotativo_data = self.load_rotativo_data(rotativo_path)
        
        if not rotativo_data:
            logger.warning(f"⚠️  No se pudieron cargar datos rotativos de {rotativo_filename}")
            return False
        
        # Generar ID de sesión
        session_id = f"{vehicle}_{date}_{session_num}"
        
        # Simular subida a base de datos
        self.simulate_database_upload(session_id, rotativo_data)
        
        return True

def main():
    """Función principal."""
    logger.info("🚀 Iniciando prueba de sesión con datos rotativos...")
    
    processor = SimpleSessionProcessor()
    
    # Procesar una sesión específica (ejemplo con datos que sabemos que existen)
    success = processor.process_session_with_rotativo('DOBACK025', '20250710', '0')
    
    if success:
        logger.info("✅ Prueba completada exitosamente!")
    else:
        logger.error("❌ Prueba falló")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code) 